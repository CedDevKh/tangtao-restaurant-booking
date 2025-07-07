'use client';

import { useOnlineStatus } from '@/hooks/usePWA';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { WifiOff } from 'lucide-react';

export default function OfflineIndicator() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <Alert className="rounded-none border-orange-200 bg-orange-50 border-b">
        <WifiOff className="h-4 w-4 text-orange-600" />
        <AlertDescription className="text-orange-800">
          You're currently offline. Some features may not be available.
        </AlertDescription>
      </Alert>
    </div>
  );
}
