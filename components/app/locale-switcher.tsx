'use client';

import * as React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
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

export function LocaleSwitcher({ dict }: { dict: Dict }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentLang = pathname.split('/')[1] as 'en' | 'fa';

  const handleLocaleChange = (newLang: string) => {
    const isAppearanceTransition =
      typeof document !== 'undefined' &&
      'startViewTransition' in document &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const segments = pathname.split('/');
    segments[1] = newLang;
    const newPath = segments.join('/');
    const queryString = searchParams.toString();
    const fullUrl = queryString ? `${newPath}?${queryString}` : newPath;

    if (!isAppearanceTransition) {
      router.push(fullUrl);
      return;
    }

    document.startViewTransition(() => {
      flushSync(() => {
        router.push(fullUrl);
      });
    });
  };

  return (
    <BottomSheet>
      <BottomSheetTrigger asChild>
        <Button variant="ghost" size="icon">
          <i className="icon-[tabler--language-katakana] size-6" />
          <span className="sr-only">Switch language</span>
        </Button>
      </BottomSheetTrigger>
      <BottomSheetContent header={<BottomSheetHeader>
        <BottomSheetTitle>{dict.locale.title}</BottomSheetTitle>
        <BottomSheetDescription>{dict.locale.description}</BottomSheetDescription>
      </BottomSheetHeader>}>

        <div>
          <RadioGroup
            value={currentLang}
            onValueChange={handleLocaleChange}
          >
            <div className="flex flex-row items-center px-4 py-5">
              <RadioGroupItem value="en" id="en" className="hidden" />
              <Label
                htmlFor="en"
                className="w-full flex justify-between"
              >
                <div className="flex items-center gap-2">
                  <i className="text-card-muted size-5 icon-[emojione--flag-for-united-states] "></i>
                  <p className="text-sm">{dict.locale.english}</p>
                </div>
                {currentLang === 'en' ? (
                  <i className="icon-[material-symbols--check-circle] text-success size-5" />
                ) : (
                  <span className="text-sm opacity-80">{dict.locale.select}</span>
                )}
              </Label>
            </div>
            <div className="flex flex-row items-center px-4 py-5">
              <RadioGroupItem value="fa" id="fa" className="hidden" />
              <Label
                htmlFor="fa"
                className="w-full flex justify-between"
              >
                <div className="flex items-center gap-2">
                  <i className="text-card-muted size-5 icon-[emojione--flag-for-iran] "></i>
                  <p className="text-sm">{dict.locale.persian}</p>
                </div>
                {currentLang === 'fa' ? (
                  <i className="icon-[material-symbols--check-circle] text-success size-5" />
                ) : (
                  <span className="text-sm opacity-80">{dict.locale.select}</span>
                )}
              </Label>
            </div>
          </RadioGroup>
        </div>
      </BottomSheetContent>
    </BottomSheet>
  );
}
