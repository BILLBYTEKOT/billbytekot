import { useElectron } from '../hooks/useElectron';
import { Mail } from 'lucide-react';

/**
 * Component to display desktop app info
 * Only visible when running in Electron
 */
const DesktopInfo = () => {
  const { isElectron, platform, getVersion } = useElectron();
  
  if (!isElectron) return null;
  
  const platformNames = {
    win32: 'Windows',
    darwin: 'macOS',
    linux: 'Linux'
  };
  
  return (
    <>
      {/* Top Header with Contact Info */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-violet-600 to-purple-600 text-white py-2 px-4 shadow-md">
        <div className="container mx-auto flex items-center justify-between text-sm">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              <span className="font-medium">Support:</span>
              <a href="mailto:support@billbytekot.in" className="hover:underline">
                support@billbytekot.in
              </a>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              <span className="font-medium">Contact:</span>
              <a href="mailto:contact@billbytekot.in" className="hover:underline">
                contact@billbytekot.in
              </a>
            </div>
          </div>
          <div className="text-xs opacity-90">
            BillByteKOT Desktop v{getVersion()} • {platformNames[platform] || platform}
          </div>
        </div>
      </div>
      
      {/* Spacer to prevent content from going under fixed header */}
      <div className="h-10"></div>
    </>
  );
};

export default DesktopInfo;
