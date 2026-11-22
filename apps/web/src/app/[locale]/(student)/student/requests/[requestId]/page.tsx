'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Locale } from '../../../../../../i18n/config';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../../components/ui/card';
import { Badge } from '../../../../../../components/ui/badge';
import { Button } from '../../../../../../components/ui/button';
import { AgreementModal } from '../../../../../../components/agreements/agreement-modal';

export default function StudentRequestDetailPage({
  params,
}: {
  params: { locale: Locale; requestId: string };
}) {
  const isAr = params.locale === 'ar';
  const [status, setStatus] = useState<'PENDING' | 'ACCEPTED' | 'CONFIRMED' | 'CANCELLED'>(
    'PENDING',
  );
  const [isAgreementModalOpen, setIsAgreementModalOpen] = useState(false);
  const [studentConfirmed, setStudentConfirmed] = useState(false);
  const [ownerConfirmed, setOwnerConfirmed] = useState(false);

  const handleConfirmAgreement = () => {
    setStudentConfirmed(true);
    setStatus('CONFIRMED');
  };

  const handleCancel = () => {
    setStatus('CANCELLED');
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Link
          href={`/${params.locale}/student/requests`}
          className="text-sm font-semibold text-orange-600 hover:underline"
        >
          {isAr ? '← العودة لجميع طلبات الحجز' : '← Back to Requests'}
        </Link>

        {/* Main Request Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold">
                {isAr
                  ? `تفاصيل طلب الحجز #${params.requestId}`
                  : `Booking Request Details #${params.requestId}`}
              </CardTitle>
              <p className="text-sm text-slate-500 mt-1">
                {isAr ? 'تاريخ التقديم: 15 أغسطس 2026' : 'Submitted: 15 Aug 2026'}
              </p>
            </div>
            <Badge
              variant={
                status === 'CONFIRMED'
                  ? 'success'
                  : status === 'ACCEPTED'
                    ? 'primary'
                    : status === 'CANCELLED'
                      ? 'secondary'
                      : 'warning'
              }
            >
              {status === 'CONFIRMED'
                ? isAr
                  ? 'حجز مؤكد'
                  : 'Confirmed'
                : status === 'ACCEPTED'
                  ? isAr
                    ? 'مقبول من المالك'
                    : 'Accepted'
                  : status === 'CANCELLED'
                    ? isAr
                      ? 'تم الإلغاء'
                      : 'Cancelled'
                    : isAr
                      ? 'قيد انتظار موافقة المالك'
                      : 'Pending Owner Review'}
            </Badge>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Property and Portion details */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <h4 className="font-bold text-slate-900 text-lg">
                {isAr
                  ? 'غرفة مفردة في سكن طالبات بين السرايات - الدقي'
                  : 'Single Room in Girls Apartment - Dokki'}
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm text-slate-600 pt-2">
                <div>
                  <span className="block text-xs text-slate-400 font-medium">
                    {isAr ? 'القيمة الشهرية' : 'Monthly Rent'}
                  </span>
                  <span className="font-bold text-slate-900">3,500 {isAr ? 'ج.م' : 'EGP'}</span>
                </div>
                <div>
                  <span className="block text-xs text-slate-400 font-medium">
                    {isAr ? 'مبلغ التأمين المسترد' : 'Security Deposit'}
                  </span>
                  <span className="font-bold text-slate-900">3,500 {isAr ? 'ج.م' : 'EGP'}</span>
                </div>
                <div>
                  <span className="block text-xs text-slate-400 font-medium">
                    {isAr ? 'فترة الحجز' : 'Booking Period'}
                  </span>
                  <span className="font-medium text-slate-800">
                    {isAr ? 'سبتمبر 2026 - يونيو 2027' : 'Sep 2026 - Jun 2027'}
                  </span>
                </div>
              </div>
            </div>

            {/* Instant Mutual Contact Disclosure (BR-CNT-001 / F23) */}
            <div className="p-4 bg-orange-50/60 border border-orange-200 rounded-xl space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-orange-600 font-bold text-sm">
                  {isAr ? 'بيانات التواصل المباشر مع المالك' : 'Direct Owner Contact Details'}
                </span>
                <Badge variant="outline" className="text-[10px] text-orange-700 border-orange-300">
                  {isAr ? 'شفافية فورية' : 'Instant Transparency'}
                </Badge>
              </div>
              <p className="text-xs text-slate-600">
                {isAr
                  ? 'تتيح المنصة بيانات التواصل فور تقديم الطلب لسهولة التنسيق والمعاينة.'
                  : 'Contact details are revealed immediately upon request submission for seamless communication.'}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm pt-1">
                <div>
                  <span className="block text-xs text-slate-400 font-medium">
                    {isAr ? 'الاسم' : 'Name'}
                  </span>
                  <span className="font-bold text-slate-900">أ/ محمود حسن عبدالرحمن</span>
                </div>
                <div>
                  <span className="block text-xs text-slate-400 font-medium">
                    {isAr ? 'رقم الهاتف' : 'Phone'}
                  </span>
                  <span className="font-bold text-slate-900 dir-ltr inline-block">
                    +20 101 234 5678
                  </span>
                </div>
                <div>
                  <span className="block text-xs text-slate-400 font-medium">
                    {isAr ? 'البريد الإلكتروني' : 'Email'}
                  </span>
                  <span className="font-bold text-slate-900">mahmoud.owner@sakany.eg</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 pt-2">
              <Link href={`/${params.locale}/student/messages/conv-1`}>
                <Button variant="outline" className="font-medium">
                  {isAr ? 'محادثة المالك مباشرة' : 'Direct Chat with Owner'}
                </Button>
              </Link>

              {status !== 'CONFIRMED' && status !== 'CANCELLED' && (
                <Button
                  variant="primary"
                  className="bg-orange-600 hover:bg-orange-700 text-white font-bold"
                  onClick={() => setIsAgreementModalOpen(true)}
                >
                  {isAr ? 'تأكيد العقد الإلكتروني' : 'Confirm Rental Agreement'}
                </Button>
              )}

              {status !== 'CANCELLED' && status !== 'CONFIRMED' && (
                <Button variant="danger" onClick={handleCancel}>
                  {isAr ? 'إلغاء طلب الحجز' : 'Cancel Request'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Bilateral Agreement Modal */}
        <AgreementModal
          isOpen={isAgreementModalOpen}
          onClose={() => setIsAgreementModalOpen(false)}
          requestId={params.requestId}
          propertyTitle={
            isAr
              ? 'غرفة مفردة في سكن طالبات بين السرايات - الدقي'
              : 'Single Room in Girls Apartment - Dokki'
          }
          monthlyRentEgp={3500}
          depositEgp={3500}
          studentConfirmed={studentConfirmed}
          ownerConfirmed={ownerConfirmed}
          userRole="STUDENT"
          locale={params.locale}
          onConfirm={handleConfirmAgreement}
        />
      </div>
    </div>
  );
}
