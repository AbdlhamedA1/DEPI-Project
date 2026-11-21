import React from 'react';
import { Locale } from '../../../../../i18n/config';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../components/ui/card';
import { Input } from '../../../../../components/ui/input';
import { Button } from '../../../../../components/ui/button';

export default function OwnerProfilePage({ params }: { params: { locale: Locale } }) {
  const isAr = params.locale === 'ar';

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-3xl font-extrabold text-slate-900">
          {isAr ? 'الملف الشخصي للمالك' : 'Owner Profile'}
        </h1>

        <Card>
          <CardHeader>
            <CardTitle>{isAr ? 'بيانات المالك / المشرف' : 'Owner / Manager Details'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1 text-slate-700">
                {isAr ? 'الاسم بالكامل' : 'Full Name'}
              </label>
              <Input defaultValue={isAr ? 'الحاج محمود إبراهيم' : 'Mahmoud Ibrahim'} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1 text-slate-700">
                  {isAr ? 'نوع المزود' : 'Provider Type'}
                </label>
                <Input defaultValue={isAr ? 'مالك فردي مباشر' : 'Individual Owner'} disabled />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1 text-slate-700">
                  {isAr ? 'رقم الهاتف الأساسي' : 'Primary Phone'}
                </label>
                <Input defaultValue="01012345678" />
              </div>
            </div>

            <Button>{isAr ? 'حفظ التعديلات' : 'Save Changes'}</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
