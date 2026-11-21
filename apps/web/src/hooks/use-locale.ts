'use client';

import { usePathname } from 'next/navigation';
import { defaultLocale, Locale, supportedLocales } from '../i18n/config';

export function useLocale(): Locale {
  const pathname = usePathname();
  if (!pathname) return defaultLocale;

  const segment = pathname.split('/')[1];
  if (supportedLocales.includes(segment as Locale)) {
    return segment as Locale;
  }

  return defaultLocale;
}
