'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import useWave from 'use-wave';
import { Route, Train, Map, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useKeyboardVisible } from '@/hooks/use-keyboard-visible';

const titles = {
  en: ['Route', 'Lines', 'Map', 'Stations'],
  fa: ['مسیریابی', 'خطوط', 'نقشه', 'ایستگاه‌ها'],
};

export function AppNavigation() {
  const pathname = usePathname();
  const lang = pathname.split('/')[1] as 'en' | 'fa';
  const navLinks = [
    { to: `/${lang}/route`, title: titles[lang][0], icon: Route },
    // { to: `/${lang}/lines`, title: titles[lang][1], icon: Train },
    { to: `/${lang}/map`, title: titles[lang][2], icon: Map },
    // { to: `/${lang}/stations`, title: titles[lang][3], icon: MapPin },
  ];
  const isActive = (to: string) => pathname === to || pathname.startsWith(to + '/');
  const wave = useWave({ color: 'var(--primary)' });
  const isKeyboardVisible = useKeyboardVisible();
  // Routes where navigation should be hidden
  const hiddenRoutes = ['/route/detail'];

  // Check if current path includes any hidden route
  const shouldHideNavigation = hiddenRoutes.some(route => pathname.includes(route));

  if (shouldHideNavigation || isKeyboardVisible) return null;
  return (
    <div className="bg-background fixed inset-x-0 bottom-0 z-30 mx-auto max-w-screen-sm overflow-hidden border-t  sm:border-x">
      <div className="bg-background safe-bottom-padding relative z-10 flex items-center justify-evenly overflow-hidden">
        {navLinks.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.to);

          return (
            <Link
              key={item.to}
              href={item.to}
              className="text-muted-foreground relative flex w-full flex-col items-center justify-center py-5 rounded-full"
            >
              <div
                className={cn(
                  'bg-primary absolute top-0 size-7 translate-y-1/2 opacity-0 blur-xl transition-opacity duration-500',
                  { 'opacity-100': active }
                )}
              />
              <Icon
                className={cn('size-6.5', {
                  'text-primary': active,
                })}
              />
              <span className={cn('text-xs mt-2 font-medium', { 'text-primary': active })}>
                {item.title}
              </span>

              <div
                ref={wave}
                className="absolute top-1/2 size-26 -translate-y-1/2 rounded-full"
              />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
