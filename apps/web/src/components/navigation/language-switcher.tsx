'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Locale } from '../../i18n/config';

export function LanguageSwitcher({ currentLocale }: { currentLocale: Locale }) {
  const pathname = usePathname();

  const targetLocale = currentLocale === 'ar' ? 'en' : 'ar';
  const targetLabel = currentLocale === 'ar' ? 'English' : 'العربية';

  // Replace locale prefix in path
  const targetPath = pathname
    ? pathname.replace(`/${currentLocale}`, `/${targetLocale}`)
    : `/${targetLocale}`;

  return (
    <Link
      href={targetPath}
      className="px-3 py-1 text-sm font-medium border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
    >
      {targetLabel}
    </Link>
  );
}
