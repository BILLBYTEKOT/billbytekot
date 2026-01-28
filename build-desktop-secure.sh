#!/bin/bash

echo "========================================"
echo "BillByteKOT - Secure Desktop Build v3.0.0"
echo "========================================"
echo

echo "[1/5] Cleaning previous builds..."
rm -rf frontend/dist-electron
rm -rf frontend/build

echo "[2/5] Installing dependencies..."
cd frontend
npm install

echo "[3/5] Building React application..."
npm run build

echo "[4/5] Building Electron desktop app..."
case "$(uname -s)" in
    Darwin*)
        echo "Building for macOS..."
        npm run electron:build:mac
        ;;
    Linux*)
        echo "Building for Linux..."
        npm run electron:build:linux
        ;;
    *)
        echo "Building for Windows..."
        npm run electron:build:win
        ;;
esac

echo "[5/5] Build completed!"
echo
echo "========================================"
echo "BillByteKOT v3.0.0 Build Complete"
echo "========================================"
echo
echo "Output location: frontend/dist-electron/"
echo
echo "Features:"
echo "- Secure desktop application"
echo "- Hidden developer tools (Ctrl+H+S only)"
echo "- Restaurant Automation Platform"
echo "- Offline storage support"
echo "- WhatsApp integration"
echo "- Thermal printer support"
echo
echo "Installation files created in dist-electron/"
echo