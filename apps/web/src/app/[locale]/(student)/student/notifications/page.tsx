import React from 'react';
import { Locale } from '../../../../../i18n/config';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../components/ui/card';
import { Badge } from '../../../../../components/ui/badge';

export default function StudentNotificationsPage({ params }: { params: { locale: Locale } }) {
  const isAr = params.locale === 'ar';

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-extrabold text-slate-900">
          {isAr ? 'الإشعارات والتنبيهات' : 'Notifications'}
        </h1>

        <Card>
          <CardHeader>
            <CardTitle>{isAr ? 'سجل الإشعارات' : 'Notification Feed'}</CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-slate-100">
            <div className="py-4 flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-900">
                  {isAr ? 'تم قبول طلب الحجز المبدئي' : 'Initial booking request accepted'}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isAr
                    ? 'قام المالك بالموافقة على طلبك. يمكنك الآن استكمال تأكيد العقد.'
                    : 'Owner accepted your request. You can now confirm agreement.'}
                </p>
              </div>
              <Badge variant="success">{isAr ? 'جديد' : 'New'}</Badge>
            </div>

            <div className="py-4 flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-900">
                  {isAr ? 'رسالة جديدة من المالك' : 'New message from owner'}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isAr
                    ? 'تم استلام رد على استفسارك بخصوص موعد المعاينة.'
                    : 'Reply received regarding inspection schedule.'}
                </p>
              </div>
              <span className="text-xs text-slate-400">منذ ساعتين</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
