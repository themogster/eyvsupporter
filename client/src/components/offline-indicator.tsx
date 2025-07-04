import { usePWA } from '@/hooks/use-pwa';
import { Card } from '@/components/ui/card';
import { WifiOff, Wifi } from 'lucide-react';

export function OfflineIndicator() {
  const { isOffline } = usePWA();

  if (!isOffline) {
    return null;
  }

  return (
    <Card className="fixed top-4 left-4 right-4 z-50 bg-amber-500 text-white shadow-lg border-0">
      <div className="p-3">
        <div className="flex items-center space-x-2">
          <WifiOff className="w-4 h-4" />
          <span className="text-sm font-medium">You're offline</span>
        </div>
        <p className="text-xs mt-1 text-amber-100">
          The app still works! You can create and download profile pictures without an internet connection.
        </p>
      </div>
    </Card>
  );
}