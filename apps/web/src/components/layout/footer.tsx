import React from 'react';
import Link from 'next/link';
import { Locale } from '../../i18n/config';

export function Footer({ locale }: { locale: Locale }) {
  const isAr = locale === 'ar';

  return (
    <footer className="border-t border-slate-200 bg-slate-900 text-slate-400 py-12 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <h3 className="text-white text-lg font-bold mb-3">
            {isAr ? 'سكن الطلاب المصري' : 'Egyptian Student Housing'}
          </h3>
          <p className="text-sm">
            {isAr
              ? 'المنصة الأولى الموثوقة للبحث عن سكن جامعي آمن ومفروش في جميع الجامعات المصرية.'
              : 'The premier trusted platform for finding safe and furnished university student housing in Egypt.'}
          </p>
        </div>

        <div>
          <h4 className="text-white text-sm font-semibold mb-3">
            {isAr ? 'روابط هامة' : 'Quick Links'}
          </h4>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href={`/${locale}/search`} className="hover:text-white transition">
                {isAr ? 'ابحث عن سكن' : 'Search Housing'}
              </Link>
            </li>
            <li>
              <Link href={`/${locale}/about`} className="hover:text-white transition">
                {isAr ? 'عن المنصة' : 'About Us'}
              </Link>
            </li>
            <li>
              <Link href={`/${locale}/contact`} className="hover:text-white transition">
                {isAr ? 'تواصل معنا' : 'Contact Support'}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-white text-sm font-semibold mb-3">
            {isAr ? 'حسابات المستخدمين' : 'Portals'}
          </h4>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href={`/${locale}/student/dashboard`} className="hover:text-white transition">
                {isAr ? 'بوابة الطلاب' : 'Student Portal'}
              </Link>
            </li>
            <li>
              <Link href={`/${locale}/owner/dashboard`} className="hover:text-white transition">
                {isAr ? 'بوابة أصحاب السكن' : 'Owner Portal'}
              </Link>
            </li>
            <li>
              <Link href={`/${locale}/admin/dashboard`} className="hover:text-white transition">
                {isAr ? 'لوحة تحكم الإدارة' : 'Admin Dashboard'}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-white text-sm font-semibold mb-3">
            {isAr ? 'الأمان والثقة' : 'Security & Trust'}
          </h4>
          <p className="text-xs text-slate-400">
            {isAr
              ? 'جميع العقود والملاك يخضعون للمراجعة والتحقق وفقاً لأعلى معايير الأمان وحماية خصوصية بيانات الطلاب.'
              : 'All listings and owners undergo strict verification adhering to Egyptian data privacy regulations.'}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-8 pt-8 border-t border-slate-800 text-center text-xs">
        <p>
          &copy; {new Date().getFullYear()}{' '}
          {isAr
            ? 'جميع الحقوق محفوظة - منصة سكن الطلاب'
            : 'All rights reserved - Student Housing Platform'}
        </p>
      </div>
    </footer>
  );
}
