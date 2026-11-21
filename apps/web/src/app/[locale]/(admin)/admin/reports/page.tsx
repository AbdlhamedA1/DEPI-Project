import React from 'react';
import { Locale } from '../../../../../i18n/config';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../components/ui/card';
import { Badge } from '../../../../../components/ui/badge';
import { Button } from '../../../../../components/ui/button';

export default function AdminReportsPage({ params }: { params: { locale: Locale } }) {
  const isAr = params.locale === 'ar';

  return (
    <div className="min-h-screen bg-slate-100 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-3xl font-extrabold text-slate-900">
          {isAr ? 'البلاغات والنزاعات التشغيلية' : 'Incident Reports & Safety'}
        </h1>

        <Card>
          <CardHeader>
            <CardTitle>{isAr ? 'قائمة البلاغات المفتوحة' : 'Open Dispute Reports'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 border border-slate-200 rounded-lg flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold">بلاغ #44: بيانات عقار غير مطابقة</span>
                  <Badge variant="destructive">أولوية عالية</Badge>
                </div>
                <p className="text-xs text-slate-500">مقدم من الطالب: مصطفى سالم ضد عمارة 4</p>
              </div>
              <Button size="sm" variant="outline">
                {isAr ? 'فتح التحقيق' : 'Investigate'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
