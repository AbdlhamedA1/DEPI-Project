import React from 'react';
import { Locale } from '../../../../i18n/config';
import { Header } from '../../../../components/layout/header';
import { Footer } from '../../../../components/layout/footer';

export default function AboutPage({ params }: { params: { locale: Locale } }) {
  const isAr = params.locale === 'ar';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header locale={params.locale} />

      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-12">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-6">
          {isAr ? 'عن منصة سكن الطلاب المصري' : 'About Egyptian Student Housing Platform'}
        </h1>

        <div className="prose prose-slate max-w-none space-y-4 text-slate-700 leading-relaxed">
          <p>
            {isAr
              ? 'تأسست المنصة بهدف القضاء على معاناة الطلاب المغتربين وأسرهم في البحث عن سكن جامعي آمن ولائق في جمهورية مصر العربية.'
              : 'Our platform was founded to eliminate the hardships faced by expat and out-of-governorate students in finding safe, verified housing near universities across Egypt.'}
          </p>
          <p>
            {isAr
              ? 'نحن نربط بين الطلاب والملاك مباشرة بدون وسطاء أو سماسرة، مع توفير التحقق الرقمي من هوية الطرفين وعقود الإيجار الرقمية الموثقة.'
              : 'We directly connect students with verified property owners without intermediary brokers, ensuring full digital KYC verification and authentic rental agreements.'}
          </p>
        </div>
      </main>

      <Footer locale={params.locale} />
    </div>
  );
}
