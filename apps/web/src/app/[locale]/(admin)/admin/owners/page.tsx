import React from 'react';
import { Locale } from '../../../../../i18n/config';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../components/ui/card';
import { Badge } from '../../../../../components/ui/badge';

export default function AdminOwnersPage({ params }: { params: { locale: Locale } }) {
  const isAr = params.locale === 'ar';

  return (
    <div className="min-h-screen bg-slate-100 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-3xl font-extrabold text-slate-900">
          {isAr ? 'إدارة الملاك ومديري العقارات' : 'Property Owners & Managers'}
        </h1>

        <Card>
          <CardHeader>
            <CardTitle>{isAr ? 'قائمة الملاك المسجلين' : 'Registered Owners'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 border border-slate-200 rounded-lg flex items-center justify-between">
              <div>
                <h4 className="font-bold">محمود إبراهيم</h4>
                <p className="text-xs text-slate-500">مالك فردي • 4 عقارات مدرجة</p>
              </div>
              <Badge variant="success">{isAr ? 'موثق' : 'Verified'}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
