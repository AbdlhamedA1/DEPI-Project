import React from 'react';
import { Locale } from '../../../../../i18n/config';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../components/ui/card';
import { Input } from '../../../../../components/ui/input';
import { Button } from '../../../../../components/ui/button';
import { Badge } from '../../../../../components/ui/badge';

export default function StudentProfilePage({ params }: { params: { locale: Locale } }) {
  const isAr = params.locale === 'ar';

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-extrabold text-slate-900">
            {isAr ? 'الملف الشخصي للطالب' : 'Student Profile'}
          </h1>
          <Badge variant="success">{isAr ? 'حساب موثق' : 'Verified Student'}</Badge>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {isAr ? 'البيانات الشخصية والأكاديمية' : 'Personal & Academic Details'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1 text-slate-700">
                {isAr ? 'الاسم بالكامل' : 'Full Name'}
              </label>
              <Input defaultValue={isAr ? 'أحمد محمد علي' : 'Ahmed Mohamed Ali'} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1 text-slate-700">
                  {isAr ? 'الجامعة المقيد بها' : 'University'}
                </label>
                <Input defaultValue={isAr ? 'جامعة القاهرة' : 'Cairo University'} />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1 text-slate-700">
                  {isAr ? 'الكلية والتخصص' : 'Faculty / Major'}
                </label>
                <Input defaultValue={isAr ? 'كلية الهندسة' : 'Faculty of Engineering'} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1 text-slate-700">
                  {isAr ? 'السنة الدراسية' : 'Academic Year'}
                </label>
                <Input defaultValue={isAr ? 'الفرقة الثالثة' : '3rd Year'} />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1 text-slate-700">
                  {isAr ? 'المحافظة الأصلية' : 'Home Governorate'}
                </label>
                <Input defaultValue={isAr ? 'المنيا' : 'Minya'} />
              </div>
            </div>

            <Button>{isAr ? 'حفظ التعديلات' : 'Save Changes'}</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
