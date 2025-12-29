'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
  BottomSheet,
  BottomSheetTrigger,
  BottomSheetContent,
  BottomSheetHeader,
  BottomSheetTitle,
  BottomSheetDescription,
} from '@/components/ui/bottom-sheet';
import { flushSync } from 'react-dom';

interface Dict {
  theme: {
    title: string;
    description: string;
    system: string;
    light: string;
    dark: string;
    select: string;
  };
  locale: {
    title: string;
    description: string;
    english: string;
    persian: string;
    select: string;
  };
}

export function ThemeToggle({ dict }: { dict: Dict }) {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const handleThemeChange = (newTheme: string) => {
    const isAppearanceTransition =
      typeof document !== 'undefined' &&
      'startViewTransition' in document &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!isAppearanceTransition) {
      setTheme(newTheme);
      return;
    }

    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const targetResolvedTheme = newTheme === 'system' ? systemTheme : newTheme;

    if (resolvedTheme === targetResolvedTheme) {
      setTheme(newTheme);
      return;
    }

    document.startViewTransition(() => {
      flushSync(() => {
        setTheme(newTheme);
      });
    });
  };

  return (
    <BottomSheet>
      <BottomSheetTrigger asChild>
        <Button variant="ghost" size="icon">
          <i className="icon-[lucide--sun] hidden dark:block size-6" />
          <i className="icon-[lucide--moon] size-6 dark:hidden" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </BottomSheetTrigger>
      <BottomSheetContent header={
        <BottomSheetHeader>
          <BottomSheetTitle>{dict.theme.title}</BottomSheetTitle>
          <BottomSheetDescription>{dict.theme.description}</BottomSheetDescription>
        </BottomSheetHeader>
      }>

        <div>
          <RadioGroup
            value={theme}
            onValueChange={handleThemeChange}
          >
            <div className="flex flex-row items-center ">
              <RadioGroupItem value="system" id="system" className="hidden" />
              <Label
                htmlFor="system"
                className="w-full flex justify-between px-4 py-5"
              >
                <div className="flex items-center gap-2">
                  <i className="text-card-muted size-5 icon-[mingcute--cellphone-2-line] opacity-80"></i>
                  <p className="text-sm">{dict.theme.system}</p>
                </div>
                {theme === 'system' ? (
                  <i className="icon-[material-symbols--check-circle] text-success size-5" />
                ) : (
                  <span className="text-sm opacity-80">{dict.theme.select}</span>
                )}
              </Label>
            </div>
            <div className="flex flex-row items-center ">
              <RadioGroupItem value="light" id="light" className="hidden" />
              <Label
                htmlFor="light"
                className="w-full flex justify-between px-4 py-5"
              >
                <div className="flex items-center gap-2">
                  <i className="text-card-muted size-5 icon-[lucide--sun] opacity-80"></i>
                  <p className="text-sm">{dict.theme.light}</p>
                </div>
                {theme === 'light' ? (
                  <i className="icon-[material-symbols--check-circle] text-success size-5" />
                ) : (
                  <span className="text-sm opacity-80">{dict.theme.select}</span>
                )}
              </Label>
            </div>
            <div className="flex flex-row items-center ">
              <RadioGroupItem value="dark" id="dark" className="hidden" />
              <Label
                htmlFor="dark"
                className="w-full flex justify-between px-4 py-5"
              >
                <div className="flex items-center gap-2">
                  <i className="text-card-muted size-5 icon-[lucide--moon] opacity-80"></i>
                  <p className="text-sm">{dict.theme.dark}</p>
                </div>
                {theme === 'dark' ? (
                  <i className="icon-[material-symbols--check-circle] text-success size-5" />
                ) : (
                  <span className="text-sm opacity-80">{dict.theme.select}</span>
                )}
              </Label>
            </div>
          </RadioGroup>
        </div>
      </BottomSheetContent>
    </BottomSheet>
  );
}

