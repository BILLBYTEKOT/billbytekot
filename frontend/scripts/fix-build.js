const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing build files for Chrome compatibility...');

// Read the built index.html
const indexPath = path.join(__dirname, '../build/index.html');
let indexContent = fs.readFileSync(indexPath, 'utf8');

// Extract CSS and JS files from the original build
const cssFiles = indexContent.match(/<link[^>]*href="[^"]*static\/css\/[^"]*"[^>]*>/g) || [];
const jsFiles = indexContent.match(/<script[^>]*src="[^"]*static\/js\/[^"]*"[^>]*>/g) || [];
const externalScripts = indexContent.match(/<script[^>]*src="https:\/\/[^"]*"[^>]*>.*?<\/script>/gs) || [];

// Create a clean, properly formatted HTML
const chromeFixedContent = `<!doctype html>
<html lang="en-IN" prefix="og: https://ogp.me/ns#">
<head>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=5,viewport-fit=cover,user-scalable=yes"/>
    <meta name="theme-color" content="#7c3aed"/>
    
    <!-- Chrome-specific fixes -->
    <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
    <meta http-equiv="Pragma" content="no-cache">
    <meta http-equiv="Expires" content="0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
    
    <!-- Chrome DevTools Console Debug -->
    <script>
        console.log('🔧 Chrome Fix Applied - BillByteKOT Loading...');
        console.log('📍 URL:', window.location.href);
        console.log('🌐 User Agent:', navigator.userAgent);
        
        // Chrome-specific resource loading fix
        window.chromeResourceFix = function() {
            const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
            if (isChrome) {
                console.log('🔍 Chrome detected - applying fixes...');
                
                // Force reload resources if they fail
                window.addEventListener('error', function(e) {
                    if (e.target.tagName === 'SCRIPT' && e.target.src) {
                        console.warn('🔄 Script failed, retrying:', e.target.src);
                        setTimeout(() => {
                            const newScript = document.createElement('script');
                            newScript.src = e.target.src + '?t=' + Date.now();
                            newScript.defer = true;
                            document.head.appendChild(newScript);
                        }, 1000);
                    }
                }, true);
            }
        };
        
        window.chromeResourceFix();
    </script>
    
    <!-- Favicon -->
    <link rel="icon" href="/favicon.svg" type="image/svg+xml">
    <link rel="icon" href="/favicon.ico" sizes="any">
    <link rel="apple-touch-icon" href="/apple-touch-icon.png">
    <link rel="manifest" href="/manifest.json">
    <meta name="mobile-web-app-capable" content="yes"/>
    <meta name="apple-mobile-web-app-capable" content="yes"/>
    
    <!-- Primary SEO Meta Tags -->
    <title>Restaurant Billing Software India | Free KOT System & POS - BillByteKOT</title>
    <meta name="description" content="Best restaurant billing software in India with FREE KOT system, thermal printing, GST billing & WhatsApp integration. Trusted by 500+ restaurants. Start free trial - ₹499/year only!"/>
    <meta name="keywords" content="restaurant billing software, restaurant billing software free download, restaurant billing software India, best restaurant billing software, restaurant POS software, restaurant POS system, KOT software, KOT system for restaurant, kitchen order ticket software, restaurant management software, billing software for restaurant, restaurant billing app, free restaurant billing software, GST billing software for restaurant, thermal printer billing software, restaurant inventory software, cafe billing software, hotel billing software, food billing software, restaurant software India, POS software India, billing software India, restaurant management system, restaurant order management, table management software, WhatsApp billing software, cloud POS system, online restaurant billing, restaurant billing system, best POS for restaurant India, cheap restaurant software, affordable restaurant POS, small restaurant billing software, dhaba billing software, canteen billing software, food court billing software, QSR POS system, fast food billing software, fine dining POS, bar billing software, bakery billing software, sweet shop billing software, restaurant software free trial, restaurant billing software with inventory, multi-outlet restaurant software, chain restaurant POS, restaurant analytics software, restaurant reporting software, BillByteKOT, billbytekot restaurant, billbytekot billing"/>
    
    <!-- Canonical URL -->
    <link rel="canonical" href="https://billbytekot.in/"/>
    
    <!-- Author and Publisher -->
    <meta name="author" content="BillByteKOT - FinVerge Technologies"/>
    <link rel="publisher" href="https://billbytekot.in/"/>
    
    <!-- Search Engine Optimization -->
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"/>
    <meta name="googlebot" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1"/>
    <meta name="bingbot" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1"/>
    <meta name="revisit-after" content="3 days"/>
    <meta name="rating" content="General"/>
    <meta name="distribution" content="Global"/>
    <meta name="geo.region" content="IN"/>
    <meta name="geo.placename" content="India"/>
    <meta name="geo.position" content="28.6139;77.2090"/>
    <meta name="ICBM" content="28.6139, 77.2090"/>
    <meta name="target" content="all"/>
    <meta name="audience" content="all"/>
    <meta name="coverage" content="Worldwide"/>
    <meta name="referrer" content="no-referrer-when-downgrade"/>

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website"/>
    <meta property="og:url" content="https://billbytekot.in/"/>
    <meta property="og:site_name" content="BillByteKOT - Restaurant Billing Software"/>
    <meta property="og:title" content="Restaurant Billing Software India | Free KOT System & POS - BillByteKOT"/>
    <meta property="og:description" content="Best restaurant billing software in India with FREE KOT system, thermal printing, GST billing & WhatsApp integration. Trusted by 500+ restaurants."/>
    <meta property="og:image" content="https://billbytekot.in/images/og-image.jpg"/>
    <meta property="og:image:width" content="1200"/>
    <meta property="og:image:height" content="630"/>
    <meta property="og:locale" content="en_IN"/>
    <meta property="og:see_also" content="https://www.facebook.com/billbytekot"/>
    <meta property="og:see_also" content="https://twitter.com/billbytekot"/>
    <meta property="og:see_also" content="https://www.linkedin.com/company/billbytekot"/>
    <meta property="article:publisher" content="https://www.facebook.com/billbytekot"/>

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image"/>
    <meta name="twitter:site" content="@billbytekot"/>
    <meta name="twitter:creator" content="@billbytekot"/>
    <meta name="twitter:title" content="Restaurant Billing Software India | Free KOT System & POS - BillByteKOT"/>
    <meta name="twitter:description" content="Best restaurant billing software in India with FREE KOT system, thermal printing, GST billing & WhatsApp integration. Trusted by 500+ restaurants."/>
    <meta name="twitter:image" content="https://billbytekot.in/images/twitter-card.jpg"/>
    <meta name="twitter:image:alt" content="BillByteKOT - Restaurant Billing Software"/>

    <!-- Alternate Languages -->
    <link rel="alternate" hreflang="en-in" href="https://billbytekot.in/"/>
    <link rel="alternate" hreflang="hi-in" href="https://billbytekot.in/hi/"/>
    <link rel="alternate" hreflang="x-default" href="https://billbytekot.in/"/>

    <!-- PWA -->
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"/>
    <meta name="apple-mobile-web-app-title" content="BillByteKOT"/>
    
    <!-- CSS Files -->
    ${cssFiles.map(css => 
        css.replace('href="/', 'href="./')
           .replace('<link', '<link crossorigin="anonymous"')
    ).join('\n    ')}
    
    <!-- Loading indicator styles -->
    <style>
        .loading-container {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            color: white;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .loading-spinner {
            width: 50px;
            height: 50px;
            border: 4px solid rgba(255,255,255,0.3);
            border-top: 4px solid white;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 20px;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .loading-text {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 10px;
        }
        
        .loading-subtext {
            font-size: 14px;
            opacity: 0.8;
            text-align: center;
            max-width: 300px;
        }
        
        .error-container {
            background: #dc2626;
            padding: 20px;
            border-radius: 10px;
            margin-top: 20px;
            max-width: 400px;
            text-align: center;
        }
        
        .retry-button {
            background: white;
            color: #dc2626;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            font-weight: 600;
            cursor: pointer;
            margin-top: 10px;
        }
        
        .chrome-warning {
            background: #fbbf24;
            color: #92400e;
            padding: 15px;
            border-radius: 8px;
            margin-top: 15px;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <noscript>
        <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
            <h1>JavaScript Required</h1>
            <p>You need to enable JavaScript to run BillByteKOT.</p>
            <p>Please enable JavaScript in your browser settings and refresh the page.</p>
        </div>
    </noscript>
    
    <!-- Loading Screen -->
    <div id="loading-screen" class="loading-container">
        <div class="loading-spinner"></div>
        <div class="loading-text">Loading BillByteKOT...</div>
        <div class="loading-subtext">Restaurant Billing & KOT Management System</div>
        <div id="chrome-warning" class="chrome-warning" style="display: none;">
            <strong>Chrome Browser Detected</strong><br>
            If you see a white screen, try:<br>
            • Hard refresh (Ctrl+Shift+R)<br>
            • Clear cache and cookies<br>
            • Disable extensions temporarily
        </div>
        <div id="error-message" class="error-container" style="display: none;">
            <div>⚠️ Loading Error</div>
            <div style="font-size: 12px; margin-top: 10px;">
                Failed to load application resources. This appears to be a Chrome-specific issue.
            </div>
            <button class="retry-button" onclick="window.location.reload(true)">Hard Refresh</button>
            <button class="retry-button" onclick="clearChromeCache()">Clear Cache & Retry</button>
        </div>
    </div>
    
    <!-- React App Root -->
    <div id="root"></div>
    
    <!-- Chrome-specific Resource Loading Script -->
    <script>
        console.log('🔧 Chrome-specific fixes loading...');
        
        // Detect Chrome
        const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
        if (isChrome) {
            console.log('🌐 Chrome browser detected - applying Chrome-specific fixes');
            document.getElementById('chrome-warning').style.display = 'block';
        }
        
        let loadedResources = 0;
        const totalResources = ${jsFiles.length}; // Count actual JS files
        let loadTimeout;
        let retryCount = 0;
        const maxRetries = 3;
        
        function hideLoadingScreen() {
            const loadingScreen = document.getElementById('loading-screen');
            if (loadingScreen) {
                loadingScreen.style.opacity = '0';
                loadingScreen.style.transition = 'opacity 0.5s ease';
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                }, 500);
            }
        }
        
        function showError() {
            const errorMessage = document.getElementById('error-message');
            if (errorMessage) {
                errorMessage.style.display = 'block';
            }
        }
        
        function clearChromeCache() {
            console.log('🧹 Clearing Chrome cache...');
            
            // Clear service worker cache
            if ('caches' in window) {
                caches.keys().then(names => {
                    names.forEach(name => {
                        caches.delete(name);
                        console.log('🗑️ Deleted cache:', name);
                    });
                });
            }
            
            // Clear localStorage
            try {
                localStorage.clear();
                sessionStorage.clear();
                console.log('🗑️ Cleared storage');
            } catch (e) {
                console.warn('Could not clear storage:', e);
            }
            
            // Force reload from server
            setTimeout(() => {
                window.location.reload(true);
            }, 1000);
        }
        
        function onResourceLoad() {
            loadedResources++;
            console.log(\`✅ Resource loaded (\${loadedResources}/\${totalResources})\`);
            
            if (loadedResources >= totalResources) {
                clearTimeout(loadTimeout);
                setTimeout(hideLoadingScreen, 1000);
            }
        }
        
        function onResourceError(resource) {
            console.error('❌ Failed to load:', resource);
            
            if (retryCount < maxRetries) {
                retryCount++;
                console.log(\`🔄 Retrying (\${retryCount}/\${maxRetries})...\`);
                
                // Retry with cache-busting
                setTimeout(() => {
                    const script = document.createElement('script');
                    script.src = resource + '?v=' + Date.now() + '&retry=' + retryCount;
                    script.defer = true;
                    script.crossOrigin = 'anonymous';
                    script.onload = onResourceLoad;
                    script.onerror = () => onResourceError(resource);
                    document.head.appendChild(script);
                }, 1000 * retryCount);
            } else {
                clearTimeout(loadTimeout);
                showError();
            }
        }
        
        // Set timeout for loading
        loadTimeout = setTimeout(() => {
            console.warn('⏰ Loading timeout - showing error');
            showError();
        }, 20000); // 20 second timeout for Chrome
        
        // Hide loading screen when React renders
        const observer = new MutationObserver((mutations) => {
            const root = document.getElementById('root');
            if (root && root.children.length > 0) {
                console.log('✅ React app rendered');
                clearTimeout(loadTimeout);
                hideLoadingScreen();
                observer.disconnect();
            }
        });
        
        observer.observe(document.getElementById('root'), {
            childList: true,
            subtree: true
        });
        
        // Chrome-specific error handling
        window.addEventListener('error', function(e) {
            console.error('🚨 Global error:', e);
            if (e.filename && e.filename.includes('static/js/')) {
                console.error('❌ JavaScript loading error in Chrome');
                if (isChrome) {
                    showError();
                }
            }
        });
        
        // Unhandled promise rejection handler
        window.addEventListener('unhandledrejection', function(e) {
            console.error('🚨 Unhandled promise rejection:', e.reason);
        });
    </script>
    
    <!-- JS Files with proper loading -->
    ${[...new Set(jsFiles)].map(script => 
        script.replace('src="/', 'src="./')
              .replace('<script', '<script crossorigin="anonymous" onload="onResourceLoad()" onerror="onResourceError(this.src)"')
              .replace('>', '></script>')
    ).join('\n    ')}
    
    <!-- External Scripts -->
    ${externalScripts.join('\n    ')}
</body>
</html>`;

// Write the fixed content
fs.writeFileSync(indexPath, chromeFixedContent);

console.log('✅ Build files fixed for Chrome compatibility!');
console.log('📁 Updated: build/index.html');
console.log('🔧 Fixed syntax errors and malformed HTML');
console.log('📊 JS Files found:', jsFiles.length);
console.log('📊 CSS Files found:', cssFiles.length);