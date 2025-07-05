import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, Download, Smartphone, Info } from 'lucide-react';
import { usePWA } from '@/hooks/use-pwa';

export function PWAInstallBanner() {
  const { isInstallable, isInstalled, installApp, getInstallInstructions, canPromptInstall } = usePWA();
  const [isDismissed, setIsDismissed] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  // Don't show if already installed, dismissed, or not installable
  if (isInstalled || isDismissed || !isInstallable) {
    return null;
  }

  const handleInstall = async () => {
    if (canPromptInstall) {
      const success = await installApp();
      if (!success) {
        // Show manual instructions if auto-install failed
        setShowInstructions(true);
      }
    } else {
      // Show manual instructions
      setShowInstructions(true);
    }
  };

  const instructions = getInstallInstructions();

  if (showInstructions) {
    return (
      <Card className="fixed bottom-4 left-4 right-4 z-50 text-white shadow-lg border-0" style={{ backgroundColor: '#6E1284' }}>
        <div className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Smartphone className="w-5 h-5" />
              <h3 className="font-semibold">Install EYV Creator</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowInstructions(false)}
              className="text-white hover:bg-black/20 h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          <p className="text-sm mb-3 opacity-80">
            To install this app on your {instructions.platform}:
          </p>
          
          <ol className="text-sm space-y-1 opacity-80 mb-4">
            {instructions.steps.map((step, index) => (
              <li key={index} className="flex items-start space-x-2">
                <span className="font-medium text-white">{index + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
          
          <div className="flex space-x-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsDismissed(true)}
              className="bg-white hover:bg-gray-100"
              style={{ color: '#6E1284' }}
            >
              Maybe Later
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="fixed bottom-4 left-4 right-4 z-50 text-white shadow-lg border-0" style={{ backgroundColor: '#6E1284' }}>
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Download className="w-5 h-5" />
            <h3 className="font-semibold">Install EYV Creator</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsDismissed(true)}
            className="text-white hover:bg-black/20 h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        <p className="text-sm mb-4 opacity-80">
          Get the full app experience! Install EYV Creator for faster access and offline use.
        </p>
        
        <div className="flex space-x-2">
          <Button
            onClick={handleInstall}
            variant="secondary"
            size="sm"
            className="bg-white hover:bg-gray-100 flex-1"
            style={{ color: '#6E1284' }}
          >
            <Download className="w-4 h-4 mr-2" />
            Install App
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowInstructions(true)}
            className="text-white hover:bg-black/20"
          >
            <Info className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}