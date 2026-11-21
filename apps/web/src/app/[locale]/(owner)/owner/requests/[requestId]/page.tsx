import React from 'react';
import Link from 'next/link';
import { Locale } from '../../../../../../i18n/config';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../../components/ui/card';
import { Badge } from '../../../../../../components/ui/badge';
import { Button } from '../../../../../../components/ui/button';

export default function OwnerRequestDetailPage({
  params,
}: {
  params: { locale: Locale; requestId: string };
}) {
  const isAr = params.locale === 'ar';

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Link
          href={`/${params.locale}/owner/dashboard`}
          className="text-sm font-semibold text-orange-600 hover:underline"
        >
          {isAr ? '← العودة للوحة التحكم' : '← Back to Dashboard'}
        </Link>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl">
                {isAr
                  ? `طلب حجز جديد من طالب #${params.requestId}`
                  : `Student Booking Request #${params.requestId}`}
              </CardTitle>
              <p className="text-sm text-slate-500 mt-1">
                {isAr
                  ? 'اسم الطالب: أحمد محمد علي (جامعة القاهرة - كلية الهندسة)'
                  : 'Student: Ahmed Mohamed Ali (Cairo Univ)'}
              </p>
            </div>
            <Badge variant="warning">{isAr ? 'بانتظار قرارك' : 'Action Required'}</Badge>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <h4 className="font-bold text-slate-900 mb-1">
                {isAr ? 'الوحدة المطلوبة: غرفة مفردة (شقة 1)' : 'Requested: Single Room (Flat 1)'}
              </h4>
              <p className="text-sm text-slate-600">
                {isAr
                  ? 'مدة الإيجار: عام دراسي كامل (10 شهور)'
                  : 'Duration: Full Academic Year (10 months)'}
              </p>
            </div>

            <div className="flex gap-3">
              <Button>{isAr ? 'الموافقة على الطلب' : 'Accept Request'}</Button>
              <Button variant="danger">{isAr ? 'رفض الطلب' : 'Reject Request'}</Button>
              <Link href={`/${params.locale}/owner/messages/conv-1`}>
                <Button variant="outline">{isAr ? 'محادثة الطالب' : 'Chat with Student'}</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
