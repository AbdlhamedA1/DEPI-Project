import React from 'react';
import Link from 'next/link';
import { Locale } from '../../i18n/config';
import { LanguageSwitcher } from '../navigation/language-switcher';

export function Header({ locale }: { locale: Locale }) {
  const isAr = locale === 'ar';

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-6">
          <Link href={`/${locale}`} className="text-xl font-extrabold text-orange-600">
            {isAr ? 'سكن الطلاب المصري' : 'Sakan Misr'}
          </Link>
          <nav className="hidden md:flex items-center gap-4 text-sm font-medium text-slate-700">
            <Link href={`/${locale}/search`} className="hover:text-orange-600 transition">
              {isAr ? 'البحث عن سكن' : 'Search Housing'}
            </Link>
            <Link href={`/${locale}/about`} className="hover:text-orange-600 transition">
              {isAr ? 'عن المنصة' : 'About'}
            </Link>
            <Link href={`/${locale}/contact`} className="hover:text-orange-600 transition">
              {isAr ? 'تواصل معنا' : 'Contact'}
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <LanguageSwitcher currentLocale={locale} />
          <Link
            href={`/${locale}/login`}
            className="text-sm font-medium text-slate-700 hover:text-orange-600 px-3 py-1.5 transition"
          >
            {isAr ? 'تسجيل الدخول' : 'Sign In'}
          </Link>
          <Link
            href={`/${locale}/register`}
            className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
          >
            {isAr ? 'حساب جديد' : 'Sign Up'}
          </Link>
        </div>
      </div>
    </header>
  );
}
