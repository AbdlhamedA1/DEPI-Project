import React from 'react';
import Link from 'next/link';
import { Locale } from '../../../../i18n/config';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';

export default function AccountTypePage({ params }: { params: { locale: Locale } }) {
  const isAr = params.locale === 'ar';

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2">
            {isAr ? 'اختر نوع الحساب' : 'Select Account Type'}
          </h1>
          <p className="text-slate-600">
            {isAr
              ? 'حدد صفتك على المنصة لتخصيص تجربتك والخدمات المتاحة لك'
              : 'Choose your role to customize your experience on the platform'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href={`/${params.locale}/register?role=student`} className="group">
            <Card className="h-full p-6 border-2 border-slate-200 group-hover:border-orange-500 transition-all hover:shadow-lg">
              <CardHeader className="p-0 mb-4">
                <div className="w-14 h-14 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center text-3xl mb-3">
                  🎓
                </div>
                <CardTitle className="text-xl font-bold">
                  {isAr ? 'أنا طالب / طالبة' : "I'm a Student"}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 text-slate-600 text-sm">
                {isAr
                  ? 'ابحث عن سكن طلابي مفروش بجوار جامعتك، تواصل مع الملاك، واحجز بأمان وبدون سماسرة.'
                  : 'Search verified student housing near your campus, chat directly with owners, and book securely.'}
              </CardContent>
            </Card>
          </Link>

          <Link href={`/${params.locale}/register?role=owner`} className="group">
            <Card className="h-full p-6 border-2 border-slate-200 group-hover:border-orange-500 transition-all hover:shadow-lg">
              <CardHeader className="p-0 mb-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center text-3xl mb-3">
                  🏢
                </div>
                <CardTitle className="text-xl font-bold">
                  {isAr ? 'أنا مالك سكن / مدير عقار' : "I'm a Property Owner"}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 text-slate-600 text-sm">
                {isAr
                  ? 'اعرض وحداتك وغرفك السكنية أمام آلاف الطلاب الموثقين، وقم بإدارة الحجوزات والتحصيلات بسهولة.'
                  : 'List your rooms and apartments to verified university students, manage requests, and increase occupancy.'}
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="text-center text-sm text-slate-600 mt-8">
          <Link href={`/${params.locale}/login`} className="text-orange-600 hover:underline">
            {isAr ? '← العودة لتسجيل الدخول' : '← Back to Login'}
          </Link>
        </div>
      </div>
    </div>
  );
}
