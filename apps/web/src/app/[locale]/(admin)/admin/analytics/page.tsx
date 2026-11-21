import React from 'react';
import { Locale } from '../../../../../i18n/config';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../components/ui/card';

export default function AdminAnalyticsPage({ params }: { params: { locale: Locale } }) {
  const isAr = params.locale === 'ar';

  return (
    <div className="min-h-screen bg-slate-100 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-3xl font-extrabold text-slate-900">
          {isAr ? 'التحليلات والمؤشرات الإحصائية' : 'Platform Analytics & KPIs'}
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {isAr ? 'معدل نمو الطلاب الجدد' : 'Student Growth'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">+24.5%</div>
              <p className="text-xs text-slate-500 mt-1">
                {isAr ? 'مقارنة بالشهر السابق' : 'vs last month'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {isAr ? 'متوسط سعر السرير شهرياً' : 'Avg Bed Price/mo'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">2,450 ج.م</div>
              <p className="text-xs text-slate-500 mt-1">
                {isAr ? 'في نطاق الجامعات الحكومية' : 'Public universities radius'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {isAr ? 'معدل إتمام الاتفاقيات' : 'Agreement Conversion'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-600">78.2%</div>
              <p className="text-xs text-slate-500 mt-1">
                {isAr ? 'من إجمالي طلبات الحجز المعتمدة' : 'of accepted requests'}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
