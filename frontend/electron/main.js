const { app, BrowserWindow, Menu, shell, ipcMain, Notification, session } = require('electron');
const path = require('path');
const CONFIG = require('./config');

const isDev = process.env.NODE_ENV === 'development';

let mainWindow;
let whatsappWindow = null;
let whatsappConnected = false;

// WhatsApp session data path for persistence
const whatsappSessionPath = path.join(app.getPath('userData'), 'whatsapp-session');

function createWindow() {
  mainWindow = new BrowserWindow({
    width: CONFIG.WINDOW.WIDTH,
    height: CONFIG.WINDOW.HEIGHT,
    minWidth: CONFIG.WINDOW.MIN_WIDTH,
    minHeight: CONFIG.WINDOW.MIN_HEIGHT,
    title: CONFIG.APP_NAME,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true
    },
    titleBarStyle: 'default',
    show: false,
    backgroundColor: CONFIG.WINDOW.BACKGROUND_COLOR
  });

  // Load the app
  // In dev: localhost, In production: finverge.tech (web app)
  const startUrl = isDev 
    ? CONFIG.DEV_URL 
    : CONFIG.PRODUCTION_URL;
  
  console.log(`[RestoBill Desktop] Loading from: ${startUrl}`);
  console.log(`[RestoBill Desktop] Backend: ${CONFIG.BACKEND_URL}`);
  mainWindow.loadURL(startUrl);

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Create application menu
  createMenu();
}

function createMenu() {
  const template = [
    {
      label: 'RestoBill',
      submenu: [
        { label: 'About RestoBill', role: 'about' },
        { type: 'separator' },
        { label: 'Preferences', accelerator: 'CmdOrCtrl+,', click: () => mainWindow.webContents.send('navigate', '/settings') },
        { type: 'separator' },
        { label: 'Quit', accelerator: 'CmdOrCtrl+Q', click: () => app.quit() }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Navigate',
      submenu: [
        { label: 'Dashboard', accelerator: 'CmdOrCtrl+1', click: () => mainWindow.webContents.send('navigate', '/dashboard') },
        { label: 'Orders', accelerator: 'CmdOrCtrl+2', click: () => mainWindow.webContents.send('navigate', '/orders') },
        { label: 'Menu', accelerator: 'CmdOrCtrl+3', click: () => mainWindow.webContents.send('navigate', '/menu') },
        { label: 'Tables', accelerator: 'CmdOrCtrl+4', click: () => mainWindow.webContents.send('navigate', '/tables') },
        { label: 'Kitchen', accelerator: 'CmdOrCtrl+5', click: () => mainWindow.webContents.send('navigate', '/kitchen') },
        { type: 'separator' },
        { label: 'Reports', accelerator: 'CmdOrCtrl+R', click: () => mainWindow.webContents.send('navigate', '/reports') },
        { label: 'Settings', accelerator: 'CmdOrCtrl+,', click: () => mainWindow.webContents.send('navigate', '/settings') }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        { type: 'separator' },
        { role: 'close' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        { label: 'Documentation', click: () => shell.openExternal('https://finverge.tech/docs') },
        { label: 'Support', click: () => shell.openExternal('https://finverge.tech/support') },
        { label: 'Visit Website', click: () => shell.openExternal('https://finverge.tech') },
        { type: 'separator' },
        { label: 'Check for Updates', click: () => checkForUpdates() }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// Handle notifications from renderer
ipcMain.on('show-notification', (event, { title, body }) => {
  if (Notification.isSupported()) {
    new Notification({ title, body }).show();
  }
});

// Handle print request
ipcMain.on('print-receipt', (event, content) => {
  const printWindow = new BrowserWindow({ show: false });
  printWindow.loadURL(`data:text/html,${encodeURIComponent(content)}`);
  printWindow.webContents.on('did-finish-load', () => {
    printWindow.webContents.print({ silent: false, printBackground: true }, (success) => {
      printWindow.close();
    });
  });
});

// Handle WhatsApp integration
ipcMain.on('send-whatsapp', (event, { phone, message }) => {
  const whatsappUrl = `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
  shell.openExternal(whatsappUrl);
});

// Handle WhatsApp Business integration
ipcMain.on('send-whatsapp-business', (event, { phone, message, businessNumber }) => {
  // If business number is provided, use WhatsApp Business API
  if (businessNumber) {
    const businessUrl = `https://wa.me/${businessNumber.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    shell.openExternal(businessUrl);
  } else {
    // Fallback to regular WhatsApp
    const whatsappUrl = `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    shell.openExternal(whatsappUrl);
  }
});

// Handle bulk WhatsApp messages
ipcMain.on('send-bulk-whatsapp', (event, { contacts, message }) => {
  contacts.forEach((contact, index) => {
    setTimeout(() => {
      const whatsappUrl = `https://wa.me/${contact.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message.replace('{name}', contact.name))}`;
      shell.openExternal(whatsappUrl);
    }, index * 2000); // 2 second delay between each message
  });
});

// ============ WHATSAPP WEB INTEGRATION ============

// Create WhatsApp Web window with persistent session
function createWhatsAppWindow() {
  if (whatsappWindow && !whatsappWindow.isDestroyed()) {
    whatsappWindow.focus();
    return whatsappWindow;
  }

  // Create a separate session for WhatsApp to persist login
  const whatsappSession = session.fromPartition('persist:whatsapp', { cache: true });

  whatsappWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: 'WhatsApp Web - RestoBill',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      session: whatsappSession,
      // Allow WhatsApp Web to work properly
      webSecurity: true,
      allowRunningInsecureContent: false
    },
    autoHideMenuBar: true,
    icon: path.join(__dirname, '../public/favicon.ico')
  });

  whatsappWindow.loadURL('https://web.whatsapp.com');

  // Monitor connection status
  whatsappWindow.webContents.on('did-finish-load', () => {
    // Inject script to monitor WhatsApp connection status
    whatsappWindow.webContents.executeJavaScript(`
      (function() {
        let lastStatus = null;
        
        const checkConnection = () => {
          const chatList = document.querySelector('[data-testid="chat-list"]') || 
                          document.querySelector('[aria-label="Chat list"]') ||
                          document.querySelector('div[data-tab="3"]');
          const qrCode = document.querySelector('[data-testid="qrcode"]') || 
                        document.querySelector('canvas[aria-label="Scan me!"]') ||
                        document.querySelector('div[data-ref]');
          const loading = document.querySelector('[data-testid="startup"]') ||
                         document.querySelector('.landing-wrapper');
          
          let status = 'loading';
          if (chatList && !qrCode) {
            status = 'connected';
          } else if (qrCode) {
            status = 'qr_visible';
          }
          
          if (status !== lastStatus) {
            lastStatus = status;
            console.log('WHATSAPP_STATUS:' + status);
          }
        };
        
        // Check immediately and then every 2 seconds
        checkConnection();
        setInterval(checkConnection, 2000);
      })();
    `).catch(err => console.log('WhatsApp script injection error:', err));
  });

  // Listen for console messages to detect connection status
  whatsappWindow.webContents.on('console-message', (event, level, message) => {
    if (message.startsWith('WHATSAPP_STATUS:')) {
      const status = message.replace('WHATSAPP_STATUS:', '');
      whatsappConnected = (status === 'connected');
      
      // Notify main window of status change
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('whatsapp-status', { 
          connected: whatsappConnected, 
          status: status 
        });
      }
    }
  });

  whatsappWindow.on('closed', () => {
    whatsappWindow = null;
    // Don't reset connected status - session persists
  });

  return whatsappWindow;
}

// Open WhatsApp Web window
ipcMain.on('open-whatsapp-web', (event) => {
  createWhatsAppWindow();
});

// Get WhatsApp connection status
ipcMain.handle('get-whatsapp-status', () => {
  return { 
    connected: whatsappConnected,
    windowOpen: whatsappWindow && !whatsappWindow.isDestroyed()
  };
});

// Send message via WhatsApp Web directly
ipcMain.handle('send-whatsapp-direct', async (event, { phone, message }) => {
  try {
    // Clean phone number
    const cleanPhone = phone.replace(/\D/g, '');
    
    // If WhatsApp window doesn't exist or is closed, create it
    if (!whatsappWindow || whatsappWindow.isDestroyed()) {
      createWhatsAppWindow();
      // Wait for window to load
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    // Focus the WhatsApp window
    whatsappWindow.focus();

    // Navigate to chat and send message
    const chatUrl = `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
    whatsappWindow.loadURL(chatUrl);

    return { success: true, message: 'Opening chat...' };
  } catch (error) {
    console.error('WhatsApp send error:', error);
    return { success: false, error: error.message };
  }
});

// Send bulk messages via WhatsApp Web
ipcMain.handle('send-whatsapp-bulk-direct', async (event, { contacts, message }) => {
  try {
    if (!whatsappWindow || whatsappWindow.isDestroyed()) {
      createWhatsAppWindow();
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    whatsappWindow.focus();

    // Send messages with delay
    for (let i = 0; i < contacts.length; i++) {
      const contact = contacts[i];
      const cleanPhone = contact.phone.replace(/\D/g, '');
      const personalizedMessage = message.replace(/{name}/g, contact.name || 'Customer');
      
      const chatUrl = `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(personalizedMessage)}`;
      whatsappWindow.loadURL(chatUrl);
      
      // Notify progress
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('whatsapp-bulk-progress', {
          current: i + 1,
          total: contacts.length,
          contact: contact.name
        });
      }
      
      // Wait between messages
      if (i < contacts.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    return { success: true, sent: contacts.length };
  } catch (error) {
    console.error('WhatsApp bulk send error:', error);
    return { success: false, error: error.message };
  }
});

// Close WhatsApp window
ipcMain.on('close-whatsapp-web', () => {
  if (whatsappWindow && !whatsappWindow.isDestroyed()) {
    whatsappWindow.close();
  }
});

// Logout from WhatsApp (clear session)
ipcMain.handle('logout-whatsapp', async () => {
  try {
    const whatsappSession = session.fromPartition('persist:whatsapp');
    await whatsappSession.clearStorageData();
    whatsappConnected = false;
    
    if (whatsappWindow && !whatsappWindow.isDestroyed()) {
      whatsappWindow.close();
    }
    
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('whatsapp-status', { connected: false, status: 'logged_out' });
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

function checkForUpdates() {
  // Placeholder for auto-update functionality
  mainWindow.webContents.send('check-updates');
}

// App lifecycle
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, url) => {
    event.preventDefault();
    shell.openExternal(url);
  });
});
