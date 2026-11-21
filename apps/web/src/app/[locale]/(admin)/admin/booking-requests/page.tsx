import React from 'react';
import { Locale } from '../../../../../i18n/config';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../components/ui/card';
import { Badge } from '../../../../../components/ui/badge';

export default function AdminBookingRequestsPage({ params }: { params: { locale: Locale } }) {
  const isAr = params.locale === 'ar';

  return (
    <div className="min-h-screen bg-slate-100 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-3xl font-extrabold text-slate-900">
          {isAr ? 'متابعة طلبات الحجز والنزاعات' : 'Booking Requests & Agreements'}
        </h1>

        <Card>
          <CardHeader>
            <CardTitle>{isAr ? 'سجل الطلبات الحالية' : 'Live Booking Feed'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 border border-slate-200 rounded-lg flex items-center justify-between">
              <div>
                <p className="font-bold">طلب #101: أحمد علي ↔ محمود إبراهيم</p>
                <p className="text-xs text-slate-500">عمارة النخيل - سرير في غرفة ثنائية</p>
              </div>
              <Badge variant="warning">قيد المراجعة</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
