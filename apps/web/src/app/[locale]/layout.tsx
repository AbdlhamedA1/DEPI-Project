import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Locale, localeDirections, supportedLocales } from '../../i18n/config';
import '../globals.css';

export async function generateStaticParams() {
  return supportedLocales.map(locale => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const isAr = params.locale === 'ar';
  return {
    title: isAr
      ? 'سكن الطلاب المصري | منصة سكن الطلاب الأولى في مصر'
      : 'Egyptian Student Housing | Leading Student Housing Platform in Egypt',
    description: isAr
      ? 'منصة سكن الطلاب الموثوقة والآمنة في مصر - ابحث عن سكنك الجامعي بدون سماسرة'
      : 'Trusted and secure student housing platform in Egypt - find student housing without brokers',
  };
}

export default function RootLocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!supportedLocales.includes(params.locale as Locale)) {
    notFound();
  }

  const locale = params.locale as Locale;
  const dir = localeDirections[locale] || 'rtl';

  return (
    <html lang={locale} dir={dir}>
      <body className="antialiased font-sans">
        <div className="min-h-screen flex flex-col">{children}</div>
      </body>
    </html>
  );
}
