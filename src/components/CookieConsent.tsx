'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { saveConsentAction } from '@/app/actions/compliance';
import { logger } from '@/lib/logger';

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [consented, setConsented] = useState({
    necessary: true,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    const localConsent = localStorage.getItem('cookieConsent');
    if (!localConsent) {
      setIsVisible(true);
    } else {
      setConsented(JSON.parse(localConsent));
    }
  }, []);

  const saveConsent = async (prefs: typeof consented) => {
    localStorage.setItem('cookieConsent', JSON.stringify(prefs));
    setConsented(prefs);
    setIsVisible(false);
    setShowSettings(false);

    try {
      await saveConsentAction({
        consented: prefs,
        version: '1.0'
      });
    } catch (error) {
      // User might not be logged in, that's fine for local storage
      console.debug('Consent not saved to DB (user likely guest)');
    }
  };

  const handleAcceptAll = () => {
    saveConsent({ necessary: true, analytics: true, marketing: true });
  };

  const handleRejectAll = () => {
    saveConsent({ necessary: true, analytics: false, marketing: false });
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-8 md:max-w-md p-6 bg-zinc-950/95 backdrop-blur-md text-white z-50 rounded-2xl border border-zinc-800 shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-10 duration-500">
      <div className="space-y-2">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          🍪 Cookie Settings
        </h3>
        <p className="text-sm text-zinc-400 leading-relaxed">
          We use cookies to enhance your experience. You can choose which categories to allow. 
          Read our <a href="/privacy" className="text-white underline hover:text-zinc-300">Privacy Policy</a> for more.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <Button 
          variant="default" 
          className="w-full bg-white text-black hover:bg-zinc-200 h-11 font-medium"
          onClick={handleAcceptAll}
        >
          Accept All
        </Button>
        <div className="grid grid-cols-2 gap-3">
          <Button 
            variant="outline" 
            className="border-zinc-700 hover:bg-zinc-900 text-zinc-300 h-10"
            onClick={handleRejectAll}
          >
            Necessary Only
          </Button>
          <Button 
            variant="outline" 
            className="border-zinc-700 hover:bg-zinc-900 text-zinc-300 h-10"
            onClick={() => setShowSettings(true)}
          >
            Settings
          </Button>
        </div>
      </div>

      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Cookie Preferences</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Customize how cookies are used on this platform.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Strictly Necessary</Label>
                <p className="text-xs text-zinc-500">Required for the site to function. Cannot be disabled.</p>
              </div>
              <Switch checked={true} disabled />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base font-medium">Analytics</Label>
                <p className="text-xs text-zinc-500">Helps us understand how visitors interact with the site.</p>
              </div>
              <Switch 
                checked={consented.analytics} 
                onCheckedChange={(checked) => setConsented(prev => ({ ...prev, analytics: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base font-medium">Marketing</Label>
                <p className="text-xs text-zinc-500">Used to track visitors across websites to deliver relevant ads.</p>
              </div>
              <Switch 
                checked={consented.marketing} 
                onCheckedChange={(checked) => setConsented(prev => ({ ...prev, marketing: checked }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              className="w-full bg-white text-black hover:bg-zinc-200"
              onClick={() => saveConsent(consented)}
            >
              Save Preferences
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
