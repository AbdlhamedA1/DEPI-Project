import React from 'react';
import { Locale } from '../../../../i18n/config';
import { Header } from '../../../../components/layout/header';
import { Footer } from '../../../../components/layout/footer';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';

export default function ContactPage({ params }: { params: { locale: Locale } }) {
  const isAr = params.locale === 'ar';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header locale={params.locale} />

      <main className="flex-1 max-w-2xl w-full mx-auto px-6 py-12">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-4">
          {isAr ? 'تواصل مع فريق الدعم والمساعدة' : 'Contact Support'}
        </h1>
        <p className="text-slate-600 mb-8">
          {isAr
            ? 'فريق الدعم الفني وخدمة العملاء متواجد على مدار الساعة لمساعدتك.'
            : 'Our dedicated customer care and support team is available 24/7 to assist you.'}
        </p>

        <form className="space-y-4 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <label className="block text-sm font-semibold mb-1 text-slate-700">
              {isAr ? 'الاسم بالكامل' : 'Full Name'}
            </label>
            <Input placeholder={isAr ? 'أدخل اسمك' : 'Enter your name'} />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1 text-slate-700">
              {isAr ? 'رقم الهاتف المحمول' : 'Phone Number'}
            </label>
            <Input placeholder="01xxxxxxxxx" />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1 text-slate-700">
              {isAr ? 'نص الرسالة أو الاستفسار' : 'Your Message'}
            </label>
            <textarea
              rows={4}
              className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder={isAr ? 'اكتب استفسارك هنا...' : 'Type your inquiry here...'}
            />
          </div>

          <Button type="button" className="w-full">
            {isAr ? 'إرسال الرسالة' : 'Send Message'}
          </Button>
        </form>
      </main>

      <Footer locale={params.locale} />
    </div>
  );
}
