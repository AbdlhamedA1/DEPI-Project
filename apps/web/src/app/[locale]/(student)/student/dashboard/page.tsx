import React from 'react';
import Link from 'next/link';
import { Locale } from '../../../../../i18n/config';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../components/ui/card';
import { Badge } from '../../../../../components/ui/badge';

export default function StudentDashboardPage({ params }: { params: { locale: Locale } }) {
  const isAr = params.locale === 'ar';

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">
              {isAr ? 'لوحة تحكم الطالب' : 'Student Dashboard'}
            </h1>
            <p className="text-slate-600">
              {isAr
                ? 'أهلاً بك! إليك ملخص طلبات الحجز والرسائل والإشعارات'
                : 'Welcome back! Here is a summary of your housing requests and messages'}
            </p>
          </div>
          <Link
            href={`/${params.locale}/search`}
            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2 rounded-lg text-sm transition"
          >
            {isAr ? 'ابحث عن سكن جديد' : 'Search New Housing'}
          </Link>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">
                {isAr ? 'الطلبات النشطة' : 'Active Requests'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">
                {isAr ? 'عقود الإيجار المؤكدة' : 'Confirmed Agreements'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">
                {isAr ? 'الرسائل غير المقروءة' : 'Unread Messages'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">
                {isAr ? 'حالة التوثيق' : 'KYC Status'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="success">{isAr ? 'موثق رسمياً' : 'Verified'}</Badge>
            </CardContent>
          </Card>
        </div>

        {/* Recent Requests Section */}
        <Card>
          <CardHeader>
            <CardTitle>{isAr ? 'أحدث طلبات الحجز' : 'Recent Booking Requests'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
              <div>
                <h4 className="font-bold text-slate-900">
                  {isAr ? 'غرفة مفردة - سكن طالبات بين السرايات' : 'Single Room - Bayn Al-Sarayat'}
                </h4>
                <p className="text-sm text-slate-500">
                  {isAr ? 'تاريخ البدء: 1 سبتمبر 2026' : 'Start Date: 1 Sep 2026'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="warning">
                  {isAr ? 'قيد مراجعة المالك' : 'Pending Owner Review'}
                </Badge>
                <Link
                  href={`/${params.locale}/student/requests/req-101`}
                  className="text-sm font-semibold text-orange-600 hover:underline"
                >
                  {isAr ? 'التفاصيل ←' : 'Details →'}
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
