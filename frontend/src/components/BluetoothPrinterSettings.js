/**
 * Bluetooth Printer Settings Component
 * 
 * Allows users to connect and manage Bluetooth thermal printers
 * for direct printing without any dialogs.
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { 
  Bluetooth, BluetoothConnected, BluetoothOff, 
  Printer, RefreshCw, Trash2, CheckCircle, XCircle,
  Smartphone, Wifi
} from 'lucide-react';
import {
  isBluetoothSupported,
  getSavedPrinter,
  connectPrinter,
  disconnectPrinter,
  isPrinterConnected,
  testPrint
} from '../utils/bluetoothPrint';

const BluetoothPrinterSettings = () => {
  const [supported, setSupported] = useState(false);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [savedPrinter, setSavedPrinter] = useState(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    setSupported(isBluetoothSupported());
    setSavedPrinter(getSavedPrinter());
    setConnected(isPrinterConnected());
  }, []);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const result = await connectPrinter();
      setConnected(true);
      setSavedPrinter(getSavedPrinter());
      toast.success(`Connected to ${result.device.name}`);
    } catch (error) {
      console.error('Connection error:', error);
      if (error.message.includes('cancelled')) {
        toast.info('Printer selection cancelled');
      } else {
        toast.error(error.message || 'Failed to connect printer');
      }
    }
    setConnecting(false);
  };

  const handleDisconnect = () => {
    disconnectPrinter();
    setConnected(false);
    toast.info('Printer disconnected');
  };

  const handleForget = () => {
    disconnectPrinter();
    localStorage.removeItem('bluetooth_printer');
    setSavedPrinter(null);
    setConnected(false);
    toast.success('Printer removed');
  };

  const handleTestPrint = async () => {
    setTesting(true);
    try {
      await testPrint();
      toast.success('Test print sent!');
    } catch (error) {
      toast.error(error.message || 'Test print failed');
    }
    setTesting(false);
  };

  if (!supported) {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-amber-700">
            <BluetoothOff className="w-5 h-5" />
            Bluetooth Not Available
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-amber-600 mb-3">
            Bluetooth printing is not supported on this device/browser.
          </p>
          <div className="bg-white rounded-lg p-3 text-sm">
            <p className="font-medium text-gray-700 mb-2">To use direct printing:</p>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>Use the BillByteKOT Android app</li>
              <li>Or use Chrome browser on Android</li>
              <li>Or use the Windows desktop app</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Bluetooth className="w-5 h-5 text-blue-600" />
          Bluetooth Printer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className={`flex items-center justify-between p-3 rounded-lg ${
          connected ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'
        }`}>
          <div className="flex items-center gap-3">
            {connected ? (
              <BluetoothConnected className="w-6 h-6 text-green-600" />
            ) : (
              <BluetoothOff className="w-6 h-6 text-gray-400" />
            )}
            <div>
              <p className={`font-medium ${connected ? 'text-green-700' : 'text-gray-600'}`}>
                {connected ? 'Connected' : 'Not Connected'}
              </p>
              {savedPrinter && (
                <p className="text-sm text-gray-500">{savedPrinter.name}</p>
              )}
            </div>
          </div>
          {connected && (
            <CheckCircle className="w-5 h-5 text-green-500" />
          )}
        </div>

        {/* Saved Printer Info */}
        {savedPrinter && !connected && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Printer className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">Saved Printer</span>
            </div>
            <p className="text-sm text-blue-600">{savedPrinter.name}</p>
            <p className="text-xs text-blue-500">
              Last used: {new Date(savedPrinter.savedAt).toLocaleDateString()}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          {!connected ? (
            <Button
              onClick={handleConnect}
              disabled={connecting}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {connecting ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <Bluetooth className="w-4 h-4 mr-2" />
                  {savedPrinter ? 'Reconnect Printer' : 'Connect Printer'}
                </>
              )}
            </Button>
          ) : (
            <>
              <Button
                onClick={handleTestPrint}
                disabled={testing}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {testing ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Printing...
                  </>
                ) : (
                  <>
                    <Printer className="w-4 h-4 mr-2" />
                    Test Print
                  </>
                )}
              </Button>
              <Button
                onClick={handleDisconnect}
                variant="outline"
                className="w-full"
              >
                <BluetoothOff className="w-4 h-4 mr-2" />
                Disconnect
              </Button>
            </>
          )}

          {savedPrinter && (
            <Button
              onClick={handleForget}
              variant="ghost"
              className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Forget Printer
            </Button>
          )}
        </div>

        {/* Help Text */}
        <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600">
          <p className="font-medium mb-1">How to connect:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Turn on your Bluetooth printer</li>
            <li>Make sure it's in pairing mode</li>
            <li>Click "Connect Printer" above</li>
            <li>Select your printer from the list</li>
          </ol>
        </div>

        {/* Supported Printers */}
        <div className="text-xs text-gray-500">
          <p className="font-medium mb-1">Supported printers:</p>
          <p>Most 58mm/80mm Bluetooth thermal printers (ESC/POS compatible)</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default BluetoothPrinterSettings;
