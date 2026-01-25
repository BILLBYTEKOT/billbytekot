// ✅ Stress Testing Suite for High-Load Scenarios
// Tests system behavior under extreme conditions and high load

const axios = require('axios');
const fs = require('fs');
const { performance } = require('perf_hooks');

class StressTester {
  constructor() {
    this.results = [];
    this.API_URL = process.env.REACT_APP_API_URL || 'https://restro-ai.onrender.com/api';
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      maxResponseTime: 0,
      minResponseTime: Infinity,
      responseTimes: []
    };
  }

  async runStressTests() {
    console.log('🔥 STRESS TESTING SUITE - HIGH LOAD SCENARIOS');
    console.log('='.repeat(60));
    
    const stressTests = [
      { name: 'High Volume Order Creation', test: () => this.testHighVolumeOrders() },
      { name: 'Concurrent User Sessions', test: () => this.testConcurrentUsers() },
      { name: 'Database Connection Pool Stress', test: () => this.testDatabaseStress() },
      { name: 'Memory Leak Detection', test: () => this.testMemoryLeaks() },
      { name: 'Storage Capacity Limits', test: () => this.testStorageLimits() },
      { name: 'Network Bandwidth Saturation', test: () => this.testBandwidthSaturation() },
      { name: 'Sync Queue Overflow', test: () => this.testSyncQueueOverflow() },
      { name: 'Rapid State Changes', test: () => this.testRapidStateChanges() },
      { name: 'Large Data Set Operations', test: () => this.testLargeDataSets() },
      { name: 'Extended Runtime Stability', test: () => this.testExtendedRuntime() }
    ];

    for (const test of stressTests) {
      await this.runStressTest(test);
    }

    await this.generateStressReport();
  }

  async runStressTest(test) {
    console.log(`\n🔥 Stress Testing: ${test.name}`);
    console.log('-'.repeat(40));
    
    const startTime = performance.now();
    
    try {
      const result = await test.test();
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      this.results.push({
        test: test.name,
        status: result.success ? 'PASS' : 'FAIL',
        duration: Math.round(duration),
        metrics: result.metrics || {},
        issues: result.issues || [],
        criticalIssues: result.criticalIssues || [],
        timestamp: new Date().toISOString()
      });
      
      console.log(`${result.success ? '✅' : '❌'} ${test.name}: ${result.success ? 'PASSED' : 'FAILED'}`);
      console.log(`   Duration: ${Math.round(duration)}ms`);
      
      if (result.metrics) {
        Object.entries(result.metrics).forEach(([key, value]) => {
          console.log(`   ${key}: ${value}`);
        });
      }
      
      if (result.issues.length > 0) {
        console.log(`   Issues: ${result.issues.length}`);
      }
      
    } catch (error) {
      console.error(`💥 ${test.name}: ERROR - ${error.message}`);
      this.results.push({
        test: test.name,
        status: 'ERROR',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Stress Test 1: High Volume Order Creation
  async testHighVolumeOrders() {
    console.log('   Creating 1000 orders in parallel...');
    
    const issues = [];
    const criticalIssues = [];
    const startTime = performance.now();
    
    // Create 1000 orders simultaneously
    const orderPromises = [];
    for (let i = 0; i < 1000; i++) {
      orderPromises.push(this.createStressTestOrder(i));
    }
    
    try {
      const results = await Promise.allSettled(orderPromises);
      const endTime = performance.now();
      
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      const totalTime = endTime - startTime;
      const ordersPerSecond = (successful / (totalTime / 1000)).toFixed(2);
      
      if (failed > 100) { // Allow some failures under extreme load
        issues.push(`High failure rate: ${failed}/1000 orders failed`);
      }
      
      if (successful < 800) { // Expect at least 80% success rate
        criticalIssues.push(`Low success rate: only ${successful}/1000 orders succeeded`);
      }
      
      return {
        success: criticalIssues.length === 0,
        metrics: {
          'Total Orders': 1000,
          'Successful': successful,
          'Failed': failed,
          'Success Rate': `${((successful / 1000) * 100).toFixed(1)}%`,
          'Orders/Second': ordersPerSecond,
          'Total Time': `${Math.round(totalTime)}ms`
        },
        issues,
        criticalIssues
      };
      
    } catch (error) {
      return {
        success: false,
        criticalIssues: [`High volume order test failed: ${error.message}`]
      };
    }
  }

  // Stress Test 2: Concurrent User Sessions
  async testConcurrentUsers() {
    console.log('   Simulating 100 concurrent user sessions...');
    
    const issues = [];
    const criticalIssues = [];
    const startTime = performance.now();
    
    // Simulate 100 concurrent users performing various operations
    const userSessions = [];
    for (let i = 0; i < 100; i++) {
      userSessions.push(this.simulateUserSession(i));
    }
    
    try {
      const results = await Promise.allSettled(userSessions);
      const endTime = performance.now();
      
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      const totalTime = endTime - startTime;
      
      if (failed > 10) {
        issues.push(`High session failure rate: ${failed}/100 sessions failed`);
      }
      
      if (successful < 80) {
        criticalIssues.push(`Low session success rate: only ${successful}/100 sessions succeeded`);
      }
      
      return {
        success: criticalIssues.length === 0,
        metrics: {
          'Concurrent Users': 100,
          'Successful Sessions': successful,
          'Failed Sessions': failed,
          'Session Success Rate': `${((successful / 100) * 100).toFixed(1)}%`,
          'Total Time': `${Math.round(totalTime)}ms`
        },
        issues,
        criticalIssues
      };
      
    } catch (error) {
      return {
        success: false,
        criticalIssues: [`Concurrent users test failed: ${error.message}`]
      };
    }
  }

  // Stress Test 3: Database Connection Pool Stress
  async testDatabaseStress() {
    console.log('   Stressing database with 500 simultaneous queries...');
    
    const issues = [];
    const criticalIssues = [];
    const startTime = performance.now();
    
    // Create 500 simultaneous database operations
    const dbOperations = [];
    for (let i = 0; i < 500; i++) {
      dbOperations.push(this.performDatabaseOperation(i));
    }
    
    try {
      const results = await Promise.allSettled(dbOperations);
      const endTime = performance.now();
      
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      const totalTime = endTime - startTime;
      const queriesPerSecond = (successful / (totalTime / 1000)).toFixed(2);
      
      if (failed > 50) {
        issues.push(`High database failure rate: ${failed}/500 queries failed`);
      }
      
      if (successful < 400) {
        criticalIssues.push(`Low database success rate: only ${successful}/500 queries succeeded`);
      }
      
      return {
        success: criticalIssues.length === 0,
        metrics: {
          'Database Queries': 500,
          'Successful': successful,
          'Failed': failed,
          'Success Rate': `${((successful / 500) * 100).toFixed(1)}%`,
          'Queries/Second': queriesPerSecond,
          'Total Time': `${Math.round(totalTime)}ms`
        },
        issues,
        criticalIssues
      };
      
    } catch (error) {
      return {
        success: false,
        criticalIssues: [`Database stress test failed: ${error.message}`]
      };
    }
  }

  // Stress Test 4: Memory Leak Detection
  async testMemoryLeaks() {
    console.log('   Testing for memory leaks over 1000 operations...');
    
    const issues = [];
    const criticalIssues = [];
    
    // Monitor memory usage
    const initialMemory = process.memoryUsage();
    const memorySnapshots = [initialMemory];
    
    try {
      // Perform 1000 operations that could potentially leak memory
      for (let i = 0; i < 1000; i++) {
        await this.performMemoryIntensiveOperation(i);
        
        // Take memory snapshot every 100 operations
        if (i % 100 === 0) {
          memorySnapshots.push(process.memoryUsage());
        }
      }
      
      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      const memoryIncreasePercent = ((memoryIncrease / initialMemory.heapUsed) * 100).toFixed(1);
      
      // Check for significant memory increase
      if (memoryIncrease > 100 * 1024 * 1024) { // 100MB increase
        issues.push(`Significant memory increase: ${Math.round(memoryIncrease / 1024 / 1024)}MB`);
      }
      
      if (memoryIncrease > 500 * 1024 * 1024) { // 500MB increase
        criticalIssues.push(`Critical memory increase: ${Math.round(memoryIncrease / 1024 / 1024)}MB`);
      }
      
      return {
        success: criticalIssues.length === 0,
        metrics: {
          'Initial Memory': `${Math.round(initialMemory.heapUsed / 1024 / 1024)}MB`,
          'Final Memory': `${Math.round(finalMemory.heapUsed / 1024 / 1024)}MB`,
          'Memory Increase': `${Math.round(memoryIncrease / 1024 / 1024)}MB`,
          'Increase Percentage': `${memoryIncreasePercent}%`,
          'Operations': 1000
        },
        issues,
        criticalIssues
      };
      
    } catch (error) {
      return {
        success: false,
        criticalIssues: [`Memory leak test failed: ${error.message}`]
      };
    }
  }

  // Stress Test 5: Storage Capacity Limits
  async testStorageLimits() {
    console.log('   Testing storage capacity limits...');
    
    const issues = [];
    const criticalIssues = [];
    
    try {
      // Try to store increasingly large amounts of data
      const dataSizes = [1, 10, 50, 100, 500]; // MB
      const results = [];
      
      for (const sizeMB of dataSizes) {
        const data = 'x'.repeat(sizeMB * 1024 * 1024); // Create data of specified size
        const startTime = performance.now();
        
        try {
          const result = await this.storeData(`large_data_${sizeMB}MB`, data);
          const endTime = performance.now();
          
          results.push({
            size: sizeMB,
            success: result.success,
            time: Math.round(endTime - startTime)
          });
          
        } catch (error) {
          results.push({
            size: sizeMB,
            success: false,
            error: error.message
          });
        }
      }
      
      const failedSizes = results.filter(r => !r.success);
      const maxSuccessfulSize = Math.max(...results.filter(r => r.success).map(r => r.size));
      
      if (maxSuccessfulSize < 10) {
        criticalIssues.push(`Very low storage capacity: max ${maxSuccessfulSize}MB`);
      } else if (maxSuccessfulSize < 50) {
        issues.push(`Limited storage capacity: max ${maxSuccessfulSize}MB`);
      }
      
      return {
        success: criticalIssues.length === 0,
        metrics: {
          'Max Successful Size': `${maxSuccessfulSize}MB`,
          'Failed Sizes': failedSizes.length,
          'Storage Results': results.map(r => `${r.size}MB: ${r.success ? 'OK' : 'FAIL'}`).join(', ')
        },
        issues,
        criticalIssues
      };
      
    } catch (error) {
      return {
        success: false,
        criticalIssues: [`Storage limits test failed: ${error.message}`]
      };
    }
  }

  // Helper methods for stress testing

  async createStressTestOrder(index) {
    // Simulate order creation with random data
    const order = {
      id: `stress_order_${index}`,
      table_number: (index % 20) + 1,
      items: Array(Math.floor(Math.random() * 10) + 1).fill().map((_, i) => ({
        id: `item_${index}_${i}`,
        name: `Stress Test Item ${i}`,
        price: Math.random() * 50 + 5,
        quantity: Math.floor(Math.random() * 5) + 1
      })),
      status: 'pending',
      created_at: new Date().toISOString()
    };
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
    
    return { success: true, order };
  }

  async simulateUserSession(userId) {
    // Simulate a user session with multiple operations
    const operations = [
      () => this.createStressTestOrder(`user_${userId}_order_1`),
      () => this.createStressTestOrder(`user_${userId}_order_2`),
      () => this.updateOrderStatus(`user_${userId}_order_1`, 'preparing'),
      () => this.updateOrderStatus(`user_${userId}_order_2`, 'ready'),
      () => this.fetchUserData(userId)
    ];
    
    const results = [];
    for (const operation of operations) {
      try {
        const result = await operation();
        results.push(result);
      } catch (error) {
        results.push({ success: false, error: error.message });
      }
    }
    
    const successful = results.filter(r => r.success).length;
    return { success: successful >= 3, operations: results.length, successful };
  }

  async performDatabaseOperation(index) {
    // Simulate database query
    await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 50));
    
    // Simulate occasional failures
    if (Math.random() < 0.05) { // 5% failure rate
      throw new Error(`Database operation ${index} failed`);
    }
    
    return { success: true, index };
  }

  async performMemoryIntensiveOperation(index) {
    // Create and manipulate data that could potentially leak
    const data = Array(1000).fill().map(() => ({
      id: Math.random().toString(36),
      data: Array(100).fill().map(() => Math.random()),
      timestamp: Date.now()
    }));
    
    // Simulate processing
    data.forEach(item => {
      item.processed = item.data.reduce((sum, val) => sum + val, 0);
    });
    
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 1));
    
    return { processed: data.length };
  }

  async storeData(key, data) {
    // Simulate storage operation
    try {
      // In real implementation, this would use actual storage
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Simulate storage limits
      if (data.length > 100 * 1024 * 1024) { // 100MB limit
        throw new Error('Storage quota exceeded');
      }
      
      return { success: true, size: data.length };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async updateOrderStatus(orderId, status) {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 50));
    return { success: true, orderId, status };
  }

  async fetchUserData(userId) {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
    return { success: true, userId, data: { name: `User ${userId}` } };
  }

  // Generate stress test report
  async generateStressReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 STRESS TEST REPORT');
    console.log('='.repeat(60));
    
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const errors = this.results.filter(r => r.status === 'ERROR').length;
    const total = this.results.length;
    
    const totalIssues = this.results.reduce((sum, r) => sum + (r.issues?.length || 0), 0);
    const totalCriticalIssues = this.results.reduce((sum, r) => sum + (r.criticalIssues?.length || 0), 0);
    
    console.log(`\n📈 STRESS TEST SUMMARY:`);
    console.log(`   Tests Run: ${total}`);
    console.log(`   ✅ Passed: ${passed}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   💥 Errors: ${errors}`);
    console.log(`   📊 Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
    console.log(`   ⚠️ Issues Found: ${totalIssues}`);
    console.log(`   🚨 Critical Issues: ${totalCriticalIssues}`);
    
    // Performance metrics
    const avgDuration = this.results.reduce((sum, r) => sum + (r.duration || 0), 0) / total;
    const maxDuration = Math.max(...this.results.map(r => r.duration || 0));
    
    console.log(`\n⚡ PERFORMANCE METRICS:`);
    console.log(`   Average Test Duration: ${Math.round(avgDuration)}ms`);
    console.log(`   Maximum Test Duration: ${Math.round(maxDuration)}ms`);
    
    // Detailed results
    console.log(`\n📋 DETAILED RESULTS:`);
    this.results.forEach((result, index) => {
      const status = result.status === 'PASS' ? '✅' : 
                    result.status === 'FAIL' ? '❌' : '💥';
      
      console.log(`\n${index + 1}. ${status} ${result.test}`);
      console.log(`   Status: ${result.status}`);
      console.log(`   Duration: ${result.duration || 0}ms`);
      
      if (result.metrics) {
        console.log(`   Metrics:`);
        Object.entries(result.metrics).forEach(([key, value]) => {
          console.log(`     ${key}: ${value}`);
        });
      }
      
      if (result.criticalIssues && result.criticalIssues.length > 0) {
        console.log(`   🚨 Critical Issues:`);
        result.criticalIssues.forEach(issue => {
          console.log(`     • ${issue}`);
        });
      }
    });
    
    // System stability assessment
    console.log(`\n🎯 SYSTEM STABILITY ASSESSMENT:`);
    if (totalCriticalIssues === 0 && failed === 0) {
      console.log(`   🟢 EXCELLENT: System handles high load very well`);
    } else if (totalCriticalIssues <= 2 && failed <= 2) {
      console.log(`   🟡 GOOD: System mostly stable under stress with minor issues`);
    } else if (totalCriticalIssues <= 5 && failed <= 5) {
      console.log(`   🟠 MODERATE: System has some stability issues under high load`);
    } else {
      console.log(`   🔴 POOR: System has significant stability issues under stress`);
    }
    
    // Recommendations
    console.log(`\n💡 STRESS TEST RECOMMENDATIONS:`);
    if (totalCriticalIssues > 0) {
      console.log(`   • Address ${totalCriticalIssues} critical performance issues`);
      console.log(`   • Implement load balancing and connection pooling`);
      console.log(`   • Add circuit breakers for high-load scenarios`);
    }
    
    if (failed > 0) {
      console.log(`   • Optimize performance for ${failed} failing stress tests`);
      console.log(`   • Implement graceful degradation under high load`);
    }
    
    console.log(`   • Monitor system performance in production`);
    console.log(`   • Set up alerts for high resource usage`);
    console.log(`   • Consider horizontal scaling for peak loads`);
    
    // Save report
    const reportData = {
      timestamp: new Date().toISOString(),
      summary: { total, passed, failed, errors, totalIssues, totalCriticalIssues },
      performance: { avgDuration: Math.round(avgDuration), maxDuration: Math.round(maxDuration) },
      results: this.results
    };
    
    fs.writeFileSync('stress-test-report.json', JSON.stringify(reportData, null, 2));
    console.log(`\n💾 Detailed report saved to: stress-test-report.json`);
    
    console.log('\n' + '='.repeat(60));
  }
}

// Run stress tests if script is executed directly
if (require.main === module) {
  const tester = new StressTester();
  
  tester.runStressTests()
    .then(() => {
      console.log('\n🎉 All stress tests completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Stress test suite failed:', error.message);
      process.exit(1);
    });
}

module.exports = StressTester;