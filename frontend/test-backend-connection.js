#!/usr/bin/env node

/**
 * RestoBill AI Frontend - Backend Connection Test
 * ===============================================
 *
 * This script tests the connection between the frontend and backend
 * to ensure they can communicate properly.
 */

const https = require('https');
const http = require('http');

// Configuration
const BACKEND_URL = 'https://restro-ai.onrender.com';
const FRONTEND_URL = 'http://localhost:3000';

// Color codes for output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = colors.white) {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`${color}[${timestamp}] ${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
}

function logWarning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

function logInfo(message) {
  log(`ℹ️  ${message}`, colors.blue);
}

function logHeader(message) {
  console.log(`\n${colors.bold}${colors.cyan}${message}${colors.reset}`);
  console.log(colors.cyan + '='.repeat(60) + colors.reset);
}

// Make HTTP request helper
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https://');
    const requestModule = isHttps ? https : http;

    const defaultOptions = {
      method: 'GET',
      timeout: 10000,
      headers: {
        'User-Agent': 'RestoBill-Frontend-Test/1.0.0',
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    };

    const finalOptions = { ...defaultOptions, ...options };

    const req = requestModule.request(url, finalOptions, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data,
          url: url
        });
      });
    });

    req.on('error', (error) => {
      reject({
        error: error,
        url: url,
        message: error.message
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject({
        error: 'TIMEOUT',
        url: url,
        message: 'Request timeout'
      });
    });

    req.setTimeout(finalOptions.timeout);
    req.end();
  });
}

// Test backend endpoints
async function testBackendEndpoints() {
  logHeader('🔧 Testing Backend Endpoints');

  const endpoints = [
    { name: 'Health Check', path: '/health', critical: true },
    { name: 'API Documentation', path: '/docs', critical: false },
    { name: 'OpenAPI Schema', path: '/openapi.json', critical: false },
    { name: 'Root Endpoint', path: '/', critical: false }
  ];

  const results = [];

  for (const endpoint of endpoints) {
    const url = `${BACKEND_URL}${endpoint.path}`;
    logInfo(`Testing ${endpoint.name}: ${url}`);

    try {
      const response = await makeRequest(url);

      if (response.statusCode >= 200 && response.statusCode < 400) {
        logSuccess(`${endpoint.name}: HTTP ${response.statusCode}`);

        // Special handling for JSON endpoints
        if (endpoint.path === '/health' || endpoint.path === '/openapi.json') {
          try {
            const jsonData = JSON.parse(response.data);
            if (endpoint.path === '/health') {
              logInfo(`  Status: ${jsonData.status}`);
              logInfo(`  Database: ${jsonData.services?.database || 'unknown'}`);
            }
          } catch (e) {
            logWarning(`  Response is not valid JSON`);
          }
        }

        results.push({ endpoint: endpoint.name, status: 'success', code: response.statusCode });
      } else {
        logWarning(`${endpoint.name}: HTTP ${response.statusCode}`);
        results.push({ endpoint: endpoint.name, status: 'warning', code: response.statusCode });
      }
    } catch (error) {
      if (endpoint.critical) {
        logError(`${endpoint.name}: ${error.message}`);
        results.push({ endpoint: endpoint.name, status: 'error', message: error.message });
      } else {
        logWarning(`${endpoint.name}: ${error.message}`);
        results.push({ endpoint: endpoint.name, status: 'warning', message: error.message });
      }
    }
  }

  return results;
}

// Test CORS configuration
async function testCORS() {
  logHeader('🌐 Testing CORS Configuration');

  const testUrl = `${BACKEND_URL}/health`;

  try {
    const response = await makeRequest(testUrl, {
      headers: {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });

    const corsHeaders = {
      'access-control-allow-origin': response.headers['access-control-allow-origin'],
      'access-control-allow-methods': response.headers['access-control-allow-methods'],
      'access-control-allow-headers': response.headers['access-control-allow-headers']
    };

    logInfo('CORS Headers received:');
    Object.entries(corsHeaders).forEach(([key, value]) => {
      if (value) {
        logInfo(`  ${key}: ${value}`);
      } else {
        logWarning(`  ${key}: Not set`);
      }
    });

    if (corsHeaders['access-control-allow-origin']) {
      logSuccess('CORS appears to be configured');
      return true;
    } else {
      logWarning('CORS headers not found - may cause frontend connection issues');
      return false;
    }
  } catch (error) {
    logError(`CORS test failed: ${error.message}`);
    return false;
  }
}

// Test frontend server
async function testFrontend() {
  logHeader('🎨 Testing Frontend Server');

  try {
    const response = await makeRequest(FRONTEND_URL);

    if (response.statusCode === 200) {
      logSuccess(`Frontend server responding: HTTP ${response.statusCode}`);

      // Check if it looks like a React app
      if (response.data.includes('root') || response.data.includes('react')) {
        logSuccess('Response looks like a React application');
      } else {
        logWarning('Response may not be from React app');
      }

      return true;
    } else {
      logWarning(`Frontend server returned: HTTP ${response.statusCode}`);
      return false;
    }
  } catch (error) {
    logError(`Frontend server not accessible: ${error.message}`);
    logInfo('Make sure you run: npm start');
    return false;
  }
}

// Environment validation
function validateEnvironment() {
  logHeader('🔍 Environment Validation');

  const envFile = require('path').join(__dirname, '.env.local');
  const fs = require('fs');

  if (fs.existsSync(envFile)) {
    logSuccess('.env.local file exists');

    try {
      const envContent = fs.readFileSync(envFile, 'utf8');

      // Check for backend URL
      if (envContent.includes('REACT_APP_BACKEND_URL=https://restro-ai.onrender.com')) {
        logSuccess('Backend URL correctly configured');
      } else if (envContent.includes('REACT_APP_BACKEND_URL')) {
        const match = envContent.match(/REACT_APP_BACKEND_URL=(.+)/);
        if (match) {
          logWarning(`Backend URL set to: ${match[1].trim()}`);
        }
      } else {
        logError('REACT_APP_BACKEND_URL not found in .env.local');
      }

      // Check for other important variables
      const importantVars = [
        'REACT_APP_RAZORPAY_ENABLED',
        'REACT_APP_ENVIRONMENT'
      ];

      importantVars.forEach(varName => {
        if (envContent.includes(varName)) {
          logInfo(`✓ ${varName} is configured`);
        } else {
          logWarning(`⚠ ${varName} not found`);
        }
      });

    } catch (error) {
      logError(`Error reading .env.local: ${error.message}`);
    }
  } else {
    logWarning('.env.local file not found');
    logInfo('Run: cp .env.local.template .env.local');
  }
}

// API endpoint test
async function testAPIEndpoints() {
  logHeader('🔌 Testing API Endpoints');

  const apiEndpoints = [
    { name: 'Authentication', path: '/api/auth/me', method: 'GET' },
    { name: 'Menu', path: '/api/menu', method: 'GET' },
    { name: 'Orders', path: '/api/orders', method: 'GET' }
  ];

  const results = [];

  for (const endpoint of apiEndpoints) {
    const url = `${BACKEND_URL}${endpoint.path}`;
    logInfo(`Testing ${endpoint.name}: ${endpoint.method} ${url}`);

    try {
      const response = await makeRequest(url, { method: endpoint.method });

      if (response.statusCode === 401) {
        logSuccess(`${endpoint.name}: HTTP ${response.statusCode} (Auth required - normal)`);
        results.push({ endpoint: endpoint.name, status: 'success', note: 'Authentication required' });
      } else if (response.statusCode >= 200 && response.statusCode < 500) {
        logSuccess(`${endpoint.name}: HTTP ${response.statusCode}`);
        results.push({ endpoint: endpoint.name, status: 'success', code: response.statusCode });
      } else {
        logWarning(`${endpoint.name}: HTTP ${response.statusCode}`);
        results.push({ endpoint: endpoint.name, status: 'warning', code: response.statusCode });
      }
    } catch (error) {
      logWarning(`${endpoint.name}: ${error.message}`);
      results.push({ endpoint: endpoint.name, status: 'warning', message: error.message });
    }
  }

  return results;
}

// Generate connection summary
function generateSummary(backendResults, corsResult, frontendResult, apiResults) {
  logHeader('📊 Connection Test Summary');

  const totalTests = backendResults.length + (corsResult ? 1 : 0) + (frontendResult ? 1 : 0) + apiResults.length;
  const successfulTests =
    backendResults.filter(r => r.status === 'success').length +
    (corsResult ? 1 : 0) +
    (frontendResult ? 1 : 0) +
    apiResults.filter(r => r.status === 'success').length;

  logInfo(`Total tests: ${totalTests}`);
  logInfo(`Successful: ${successfulTests}`);
  logInfo(`Success rate: ${Math.round((successfulTests / totalTests) * 100)}%`);

  console.log('\n📋 Test Results:');

  // Backend endpoints
  console.log('\n🔧 Backend Endpoints:');
  backendResults.forEach(result => {
    const icon = result.status === 'success' ? '✅' : result.status === 'warning' ? '⚠️' : '❌';
    console.log(`  ${icon} ${result.endpoint}: ${result.code || result.message}`);
  });

  // CORS
  console.log('\n🌐 CORS Configuration:');
  const corsIcon = corsResult ? '✅' : '⚠️';
  console.log(`  ${corsIcon} CORS Headers: ${corsResult ? 'Configured' : 'May need configuration'}`);

  // Frontend
  console.log('\n🎨 Frontend Server:');
  const frontendIcon = frontendResult ? '✅' : '❌';
  console.log(`  ${frontendIcon} Local Server: ${frontendResult ? 'Running' : 'Not accessible'}`);

  // API endpoints
  console.log('\n🔌 API Endpoints:');
  apiResults.forEach(result => {
    const icon = result.status === 'success' ? '✅' : '⚠️';
    console.log(`  ${icon} ${result.endpoint}: ${result.note || result.code || result.message}`);
  });

  // Overall status
  console.log('\n🎯 Overall Status:');
  if (successfulTests >= totalTests * 0.8) {
    logSuccess('Connection tests mostly successful! Frontend should work with backend.');
  } else if (successfulTests >= totalTests * 0.5) {
    logWarning('Some issues detected. Frontend may have limited functionality.');
  } else {
    logError('Multiple connection issues detected. Frontend may not work properly.');
  }

  // Next steps
  console.log('\n🚀 Next Steps:');
  if (frontendResult) {
    logInfo('1. Open http://localhost:3000 in your browser');
    logInfo('2. Test login and basic functionality');
    logInfo('3. Check browser console for any errors');
  } else {
    logWarning('1. Start the frontend server: npm start');
    logWarning('2. Ensure .env.local is configured correctly');
  }

  logInfo('4. Monitor network requests in browser developer tools');
  logInfo('5. Check that API calls go to https://restro-ai.onrender.com');
}

// Main test runner
async function runTests() {
  console.log(`${colors.bold}${colors.magenta}🍽️  RestoBill AI - Frontend-Backend Connection Test${colors.reset}`);
  console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}`);

  console.log(`\n${colors.bold}Configuration:${colors.reset}`);
  console.log(`Backend URL: ${colors.green}${BACKEND_URL}${colors.reset}`);
  console.log(`Frontend URL: ${colors.blue}${FRONTEND_URL}${colors.reset}`);

  try {
    // Run all tests
    validateEnvironment();

    const backendResults = await testBackendEndpoints();
    const corsResult = await testCORS();
    const frontendResult = await testFrontend();
    const apiResults = await testAPIEndpoints();

    // Generate summary
    generateSummary(backendResults, corsResult, frontendResult, apiResults);

    console.log(`\n${colors.green}${colors.bold}🎉 Connection test completed!${colors.reset}`);
    console.log(`${colors.cyan}Visit your frontend at: http://localhost:3000${colors.reset}`);
    console.log(`${colors.cyan}Backend API docs at: https://restro-ai.onrender.com/docs${colors.reset}`);

  } catch (error) {
    logError(`Test runner failed: ${error.message}`);
    process.exit(1);
  }
}

// Run tests if called directly
if (require.main === module) {
  runTests().catch(error => {
    logError(`Fatal error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  runTests,
  testBackendEndpoints,
  testCORS,
  testFrontend,
  validateEnvironment,
  testAPIEndpoints
};
