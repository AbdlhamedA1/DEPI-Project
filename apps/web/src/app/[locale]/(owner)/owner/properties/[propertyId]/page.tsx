import React from 'react';
import Link from 'next/link';
import { Locale } from '../../../../../../i18n/config';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../../components/ui/card';
import { Badge } from '../../../../../../components/ui/badge';
import { Button } from '../../../../../../components/ui/button';

export default function OwnerPropertyDetailPage({
  params,
}: {
  params: { locale: Locale; propertyId: string };
}) {
  const isAr = params.locale === 'ar';

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <Link
          href={`/${params.locale}/owner/properties`}
          className="text-sm font-semibold text-orange-600 hover:underline"
        >
          {isAr ? '← العودة لقائمة العقارات' : '← Back to Properties'}
        </Link>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl">
                {isAr
                  ? `إدارة العقار: عمارة النخيل #${params.propertyId}`
                  : `Manage Property: Al-Nakheel #${params.propertyId}`}
              </CardTitle>
              <p className="text-sm text-slate-500 mt-1">
                {isAr ? 'الموقع: بين السرايات - الدقي' : 'Location: Dokki, Giza'}
              </p>
            </div>
            <Badge variant="success">{isAr ? 'نشط ومعتمد' : 'Active & Verified'}</Badge>
          </CardHeader>

          <CardContent className="space-y-6">
            <div>
              <h3 className="font-bold text-slate-900 mb-3">
                {isAr ? 'الوحدات والشقق التابعة' : 'Associated Units & Flats'}
              </h3>
              <div className="space-y-3">
                <div className="p-4 border border-slate-200 rounded-lg flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">
                      {isAr ? 'شقة رقم 1 (الدور الأول)' : 'Flat 1 (1st Floor)'}
                    </h4>
                    <p className="text-xs text-slate-500">
                      {isAr
                        ? '3 غرف • 6 أسرة (4 محجوزة، 2 متاحة)'
                        : '3 Rooms • 6 Beds (4 booked, 2 vacant)'}
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    {isAr ? 'تعديل الوحدات' : 'Edit Unit'}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
