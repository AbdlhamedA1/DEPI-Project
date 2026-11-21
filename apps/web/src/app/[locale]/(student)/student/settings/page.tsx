import React from 'react';
import { Locale } from '../../../../../i18n/config';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../components/ui/card';
import { Button } from '../../../../../components/ui/button';

export default function StudentSettingsPage({ params }: { params: { locale: Locale } }) {
  const isAr = params.locale === 'ar';

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-extrabold text-slate-900">
          {isAr ? 'إعدادات الحساب' : 'Account Settings'}
        </h1>

        <Card>
          <CardHeader>
            <CardTitle>
              {isAr ? 'تفضيلات الإشعارات والخصوصية' : 'Notification & Privacy Preferences'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-900">
                  {isAr ? 'إشعارات الرسائل عبر SMS' : 'SMS Notifications'}
                </p>
                <p className="text-xs text-slate-500">
                  {isAr
                    ? 'استلام تنبيه عند وصول رسالة جديدة من مالك'
                    : 'Receive SMS when an owner messages you'}
                </p>
              </div>
              <input type="checkbox" defaultChecked className="h-5 w-5 rounded text-orange-600" />
            </div>

            <div className="pt-4 border-t border-slate-100">
              <Button>{isAr ? 'حفظ الإعدادات' : 'Save Settings'}</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
