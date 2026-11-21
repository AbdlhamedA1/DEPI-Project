import React from 'react';
import Link from 'next/link';
import { Locale } from '../../../../../../i18n/config';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../../components/ui/card';
import { Input } from '../../../../../../components/ui/input';
import { Button } from '../../../../../../components/ui/button';

export default function NewPropertyPage({ params }: { params: { locale: Locale } }) {
  const isAr = params.locale === 'ar';

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <Link
            href={`/${params.locale}/owner/properties`}
            className="text-sm font-semibold text-orange-600 hover:underline"
          >
            {isAr ? '← العودة للعقارات' : '← Back to Properties'}
          </Link>
          <h1 className="text-3xl font-extrabold text-slate-900 mt-2">
            {isAr ? 'إضافة عقار طلابي جديد' : 'Add New Student Property'}
          </h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {isAr ? 'البيانات الأساسية للعقار' : 'Basic Property Information'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1 text-slate-700">
                {isAr ? 'عنوان أو اسم العقار' : 'Property Title / Name'}
              </label>
              <Input
                placeholder={
                  isAr
                    ? 'مثال: سكن الهدى للطالبات بجوار كلية الهندسة'
                    : 'e.g. Al-Huda Girls Residence'
                }
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1 text-slate-700">
                  {isAr ? 'نوع العقار' : 'Property Type'}
                </label>
                <select className="w-full border border-slate-300 rounded-lg p-2.5 text-sm bg-white">
                  <option value="BUILDING">{isAr ? 'عمارة كاملة' : 'Full Building'}</option>
                  <option value="APARTMENT">{isAr ? 'شقة مستقلة' : 'Apartment'}</option>
                  <option value="ROOM">{isAr ? 'غرفة مستقلة' : 'Independent Room'}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1 text-slate-700">
                  {isAr ? 'سياسة النوع (الجندر)' : 'Gender Policy'}
                </label>
                <select className="w-full border border-slate-300 rounded-lg p-2.5 text-sm bg-white">
                  <option value="MALE_ONLY">{isAr ? 'طلاب (بنين فقط)' : 'Male Only'}</option>
                  <option value="FEMALE_ONLY">{isAr ? 'طالبات (بنات فقط)' : 'Female Only'}</option>
                  <option value="MIXED_FAMILY">{isAr ? 'مشترك / عائلي' : 'Mixed / Family'}</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1 text-slate-700">
                {isAr ? 'الجامعة الأقرب' : 'Nearest University'}
              </label>
              <select className="w-full border border-slate-300 rounded-lg p-2.5 text-sm bg-white">
                <option value="cairo">جامعة القاهرة</option>
                <option value="ain-shams">جامعة عين شمس</option>
                <option value="alexandria">جامعة الإسكندرية</option>
              </select>
            </div>

            <Button className="w-full">
              {isAr ? 'حفظ ومتابعة لإضافة الوحدات' : 'Save & Proceed to Units'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
