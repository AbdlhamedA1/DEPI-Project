import React from 'react';
import { Locale } from '../../../../../i18n/config';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../components/ui/card';
import { Badge } from '../../../../../components/ui/badge';

export default function OwnerNotificationsPage({ params }: { params: { locale: Locale } }) {
  const isAr = params.locale === 'ar';

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-extrabold text-slate-900">
          {isAr ? 'إشعارات المالك' : 'Owner Notifications'}
        </h1>

        <Card>
          <CardHeader>
            <CardTitle>{isAr ? 'مركز التنبيهات' : 'Notifications Center'}</CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-slate-100">
            <div className="py-4 flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-900">
                  {isAr ? 'تم استلام طلب حجز جديد' : 'New booking request received'}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isAr
                    ? 'قدم الطالب أحمد محمد طلباً لحجز سرير في شقة 1.'
                    : 'Ahmed Mohamed requested a bed in Flat 1.'}
                </p>
              </div>
              <Badge variant="warning">{isAr ? 'مهم' : 'Important'}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
