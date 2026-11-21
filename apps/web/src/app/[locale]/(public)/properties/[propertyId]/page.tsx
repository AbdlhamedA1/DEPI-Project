import React from 'react';
import Link from 'next/link';
import { Locale } from '../../../../../i18n/config';
import { Header } from '../../../../../components/layout/header';
import { Footer } from '../../../../../components/layout/footer';
import { Badge } from '../../../../../components/ui/badge';
import { Button } from '../../../../../components/ui/button';

export default function PropertyDetailPage({
  params,
}: {
  params: { locale: Locale; propertyId: string };
}) {
  const isAr = params.locale === 'ar';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header locale={params.locale} />

      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-8">
        <div className="mb-4">
          <Link
            href={`/${params.locale}/search`}
            className="text-sm font-semibold text-orange-600 hover:text-orange-700"
          >
            {isAr ? '← العودة لنتائج البحث' : '← Back to search'}
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="h-72 bg-slate-300 flex items-center justify-center text-slate-500 font-medium">
            {isAr ? 'معرض صور العقار' : 'Property Image Gallery'}
          </div>

          <div className="p-8">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="success">{isAr ? 'عقار موثق ✓' : 'Verified Listing ✓'}</Badge>
                  <Badge variant="outline">{isAr ? 'سكن طالبات' : 'Girls Housing'}</Badge>
                </div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">
                  {isAr
                    ? 'غرفة مفروشة ومكيفة داخل شقة طالبات راقية'
                    : 'Furnished AC Room in Premium Girls Student Apartment'}
                </h1>
                <p className="text-slate-500 mt-1">
                  {isAr
                    ? 'بين السرايات، الجيزة (500 متر من جامعة القاهرة)'
                    : 'Bayn Al-Sarayat, Giza (500m from Cairo University)'}
                </p>
              </div>

              <div className="text-end">
                <div className="text-3xl font-extrabold text-orange-600">3,500</div>
                <div className="text-xs text-slate-500">
                  {isAr ? 'ج.م / شهرياً شامل الفواتير' : 'EGP / month incl. bills'}
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-6 mt-6">
              <h2 className="text-lg font-bold mb-3">
                {isAr ? 'مواصفات السكن والمرافق' : 'Housing Amenities & Rules'}
              </h2>
              <ul className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm text-slate-700">
                <li>✓ {isAr ? 'إنترنت عالي السرعة (واي فاي)' : 'High-speed Wi-Fi'}</li>
                <li>✓ {isAr ? 'تكييف هواء' : 'Air Conditioning'}</li>
                <li>✓ {isAr ? 'غسالة ملابس ومطبخ مجهز' : 'Washing machine & equipped kitchen'}</li>
                <li>✓ {isAr ? 'أمن وحراسة على مدار الساعة' : '24/7 Building Security'}</li>
                <li>✓ {isAr ? 'بدون عمولة سمسار' : 'Zero Broker Fees'}</li>
              </ul>
            </div>

            <div className="border-t border-slate-200 pt-6 mt-8 flex flex-wrap gap-4">
              <Link href={`/${params.locale}/student/requests/new?propertyId=${params.propertyId}`}>
                <Button size="lg">{isAr ? 'إرسال طلب حجز مباشر' : 'Send Booking Request'}</Button>
              </Link>
              <Link
                href={`/${params.locale}/student/messages/conv-new?propertyId=${params.propertyId}`}
              >
                <Button variant="outline" size="lg">
                  {isAr ? 'محادثة المالك المباشر' : 'Message Owner'}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer locale={params.locale} />
    </div>
  );
}
