import React from 'react';
import { Locale } from '../../../../../i18n/config';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../components/ui/card';
import { Button } from '../../../../../components/ui/button';

export default function AdminNotificationsPage({ params }: { params: { locale: Locale } }) {
  const isAr = params.locale === 'ar';

  return (
    <div className="min-h-screen bg-slate-100 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-3xl font-extrabold text-slate-900">
          {isAr ? 'مركز الإشعارات الجماعية' : 'Broadcast Notifications'}
        </h1>

        <Card>
          <CardHeader>
            <CardTitle>{isAr ? 'إرسال تنبيه جماعي للمستخدمين' : 'Send System Broadcast'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600">
              {isAr
                ? 'إرسال إشعار فوري لجميع الطلاب أو الملاك المسجلين.'
                : 'Send system-wide broadcast message to all users or target groups.'}
            </p>
            <Button>{isAr ? '+ إنشاء إشعار جديد' : '+ Create Broadcast'}</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
