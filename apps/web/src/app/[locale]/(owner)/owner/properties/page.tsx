import React from 'react';
import Link from 'next/link';
import { Locale } from '../../../../../i18n/config';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../components/ui/card';
import { Badge } from '../../../../../components/ui/badge';
import { Button } from '../../../../../components/ui/button';

export default function OwnerPropertiesPage({ params }: { params: { locale: Locale } }) {
  const isAr = params.locale === 'ar';

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-extrabold text-slate-900">
            {isAr ? 'عقاراتي ووحداتي السكنية' : 'My Properties & Housing Units'}
          </h1>
          <Link href={`/${params.locale}/owner/properties/new`}>
            <Button>{isAr ? '+ إضافة عقار جديد' : '+ Add Property'}</Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{isAr ? 'قائمة العقارات المسجلة' : 'Registered Properties List'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center justify-between p-4 border border-slate-200 rounded-lg gap-4">
              <div>
                <h4 className="font-bold text-slate-900 text-lg">
                  {isAr
                    ? 'عمارة النخيل - سكن طالبات بين السرايات'
                    : 'Al-Nakheel Residence - Girls Dormitory'}
                </h4>
                <p className="text-sm text-slate-500">
                  {isAr
                    ? '3 شقق • 9 غرف • 18 سريراً • 500 متر من جامعة القاهرة'
                    : '3 Flats • 9 Rooms • 18 Beds • 500m to Cairo University'}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Badge variant="success">{isAr ? 'معتمد ومنشور' : 'Approved & Active'}</Badge>
                <Link
                  href={`/${params.locale}/owner/properties/prop-1`}
                  className="text-sm font-semibold text-orange-600 hover:underline"
                >
                  {isAr ? 'إدارة الوحدات والأسرة ←' : 'Manage Units & Beds →'}
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
