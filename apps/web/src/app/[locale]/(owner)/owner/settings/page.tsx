import React from 'react';
import { Locale } from '../../../../../i18n/config';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../components/ui/card';
import { Button } from '../../../../../components/ui/button';

export default function OwnerSettingsPage({ params }: { params: { locale: Locale } }) {
  const isAr = params.locale === 'ar';

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-extrabold text-slate-900">
          {isAr ? 'إعدادات حساب المالك' : 'Owner Settings'}
        </h1>

        <Card>
          <CardHeader>
            <CardTitle>
              {isAr ? 'تفضيلات الحجوزات والتنبيهات' : 'Booking & Payout Preferences'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-900">
                  {isAr ? 'تلقي إشعارات الحجز عبر واتساب / SMS' : 'WhatsApp / SMS Instant Alerts'}
                </p>
                <p className="text-xs text-slate-500">
                  {isAr
                    ? 'تنبيه فوري بمجرد إرسال أي طالب لطلب حجز جديد'
                    : 'Get instant alerts when a student sends a request'}
                </p>
              </div>
              <input type="checkbox" defaultChecked className="h-5 w-5 rounded text-orange-600" />
            </div>

            <div className="pt-4 border-t border-slate-100">
              <Button>{isAr ? 'حفظ التفضيلات' : 'Save Preferences'}</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
