import React from 'react';
import { Locale } from '../../../../../i18n/config';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../components/ui/card';
import { Input } from '../../../../../components/ui/input';
import { Button } from '../../../../../components/ui/button';

export default function AdminSettingsPage({ params }: { params: { locale: Locale } }) {
  const isAr = params.locale === 'ar';

  return (
    <div className="min-h-screen bg-slate-100 p-6 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-extrabold text-slate-900">
          {isAr ? 'إعدادات المنصة العامة' : 'Platform System Settings'}
        </h1>

        <Card>
          <CardHeader>
            <CardTitle>
              {isAr ? 'حدود وسياسات التشغيل' : 'Operational Policies & Thresholds'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1 text-slate-700">
                {isAr ? 'صلاحية رمز OTP بالدقائق' : 'OTP Expiry (Minutes)'}
              </label>
              <Input defaultValue="5" />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1 text-slate-700">
                {isAr ? 'الحد الأقصى لمحاولات OTP الخاطئة' : 'Max OTP Attempts'}
              </label>
              <Input defaultValue="3" />
            </div>

            <Button>{isAr ? 'حفظ إعدادات المنصة' : 'Save System Settings'}</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
