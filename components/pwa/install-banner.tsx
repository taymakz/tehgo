'use client';

import { usePWAInstall } from '@/hooks/use-pwa-install';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface InstallBannerProps {
  dict: {
    install_title: string;
    install_description: string;
    install_button: string;
  };
}

export function InstallBanner({ dict }: InstallBannerProps) {
  const { isInstallable, promptInstall } = usePWAInstall();

  const showInstall = typeof window !== 'undefined' && isInstallable;

  if (!showInstall) return null;

  return (
    <div className="border-b bg-primary/5 p-3 ">
      <div className="flex items-center gap-3 max-w-screen-sm mx-auto">
        {/* Icon */}
        <div className="shrink-0 size-10 bg-primary/10 rounded-full flex items-center justify-center">
          <Download className="size-5 text-primary" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-card-foreground">
            {dict.install_title}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {dict.install_description}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 ">
          <Button
            size="sm"
            className='min-w-22'
            onClick={() => {
              promptInstall();
            }}
          >
            {dict.install_button}
          </Button>
        </div>
      </div>
    </div>
  );
}
