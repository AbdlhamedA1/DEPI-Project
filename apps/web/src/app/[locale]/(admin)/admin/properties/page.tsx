import React from 'react';
import { Locale } from '../../../../../i18n/config';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../components/ui/card';
import { Button } from '../../../../../components/ui/button';

export default function AdminPropertiesPage({ params }: { params: { locale: Locale } }) {
  const isAr = params.locale === 'ar';

  return (
    <div className="min-h-screen bg-slate-100 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-3xl font-extrabold text-slate-900">
          {isAr ? 'إدارة العقارات والوحدات' : 'Properties Management'}
        </h1>

        <Card>
          <CardHeader>
            <CardTitle>
              {isAr ? 'عقارات بانتظار الاعتماد والنشر' : 'Properties Pending Publication Approval'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 border border-slate-200 rounded-lg flex flex-wrap items-center justify-between gap-4">
              <div>
                <h4 className="font-bold">سكن الهدى للطالبات</h4>
                <p className="text-xs text-slate-500">
                  المالك: محمود إبراهيم • بين السرايات - الجيزة
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm">{isAr ? 'موافقة ونشر' : 'Approve & Publish'}</Button>
                <Button variant="outline" size="sm">
                  {isAr ? 'معاينة' : 'Preview'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
