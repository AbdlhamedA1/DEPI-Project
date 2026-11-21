import React from 'react';
import Link from 'next/link';
import { Locale } from '../../../../../../i18n/config';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../../components/ui/card';
import { Badge } from '../../../../../../components/ui/badge';
import { Button } from '../../../../../../components/ui/button';

export default function StudentRequestDetailPage({
  params,
}: {
  params: { locale: Locale; requestId: string };
}) {
  const isAr = params.locale === 'ar';

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Link
          href={`/${params.locale}/student/dashboard`}
          className="text-sm font-semibold text-orange-600 hover:underline"
        >
          {isAr ? '← العودة للوحة التحكم' : '← Back to Dashboard'}
        </Link>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl">
                {isAr
                  ? `تفاصيل طلب الحجز #${params.requestId}`
                  : `Booking Request Details #${params.requestId}`}
              </CardTitle>
              <p className="text-sm text-slate-500 mt-1">
                {isAr ? 'تاريخ التقديم: 15 أغسطس 2026' : 'Submitted: 15 Aug 2026'}
              </p>
            </div>
            <Badge variant="warning">
              {isAr ? 'قيد انتظار موافقة المالك' : 'Pending Owner Review'}
            </Badge>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <h4 className="font-bold text-slate-900 mb-1">
                {isAr
                  ? 'غرفة مفردة في سكن طالبات بين السرايات'
                  : 'Single Room in Girls Apartment - Dokki'}
              </h4>
              <p className="text-sm text-slate-600">
                {isAr ? 'القيمة الشهرية: 3,500 ج.م' : 'Monthly Rent: 3,500 EGP'}
              </p>
            </div>

            <div className="flex gap-3">
              <Link href={`/${params.locale}/student/messages/conv-1`}>
                <Button variant="outline">{isAr ? 'محادثة المالك' : 'Chat with Owner'}</Button>
              </Link>
              <Button variant="danger">{isAr ? 'إلغاء الطلب' : 'Cancel Request'}</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
