'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Locale } from '../../../../../../i18n/config';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../../components/ui/card';
import { Badge } from '../../../../../../components/ui/badge';
import { Button } from '../../../../../../components/ui/button';
import { AgreementModal } from '../../../../../../components/agreements/agreement-modal';

export default function OwnerRequestDetailPage({
  params,
}: {
  params: { locale: Locale; requestId: string };
}) {
  const isAr = params.locale === 'ar';
  const [status, setStatus] = useState<'PENDING' | 'ACCEPTED' | 'CONFIRMED' | 'REJECTED'>(
    'PENDING',
  );
  const [isAgreementModalOpen, setIsAgreementModalOpen] = useState(false);
  const [studentConfirmed, setStudentConfirmed] = useState(false);
  const [ownerConfirmed, setOwnerConfirmed] = useState(false);

  const handleAccept = () => {
    setStatus('ACCEPTED');
  };

  const handleReject = () => {
    setStatus('REJECTED');
  };

  const handleConfirmAgreement = () => {
    setOwnerConfirmed(true);
    setStatus('CONFIRMED');
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Link
          href={`/${params.locale}/owner/requests`}
          className="text-sm font-semibold text-orange-600 hover:underline"
        >
          {isAr ? '← العودة لقائمة طلبات الحجز' : '← Back to Requests'}
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
                    : status === 'REJECTED'
                      ? 'danger'
                      : 'warning'
              }
            >
              {status === 'CONFIRMED'
                ? isAr
                  ? 'عقد مؤكد'
                  : 'Confirmed'
                : status === 'ACCEPTED'
                  ? isAr
                    ? 'تم القبول مبدئياً'
                    : 'Accepted'
                  : status === 'REJECTED'
                    ? isAr
                      ? 'تم الرفض'
                      : 'Rejected'
                    : isAr
                      ? 'قيد انتظار قرارك'
                      : 'Pending Decision'}
            </Badge>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Student Contact Disclosure (BR-CNT-001 / F23) */}
            <div className="p-4 bg-orange-50/60 border border-orange-200 rounded-xl space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-orange-600 font-bold text-sm">
                  {isAr ? 'بيانات الطالب المتقدم بالحجز' : 'Student Applicant Contact Info'}
                </span>
                <Badge variant="outline" className="text-[10px] text-orange-700 border-orange-300">
                  {isAr ? 'شفافية فورية' : 'Instant Transparency'}
                </Badge>
              </div>
              <p className="text-xs text-slate-600">
                {isAr
                  ? 'يتم عرض بيانات الطالب وهاتفه والجامعة المقيد بها فور إرساله طلب الحجز.'
                  : 'Student name, phone, email, and university are disclosed immediately upon booking request.'}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-sm pt-1">
                <div>
                  <span className="block text-xs text-slate-400 font-medium">
                    {isAr ? 'الاسم بالكامل' : 'Full Name'}
                  </span>
                  <span className="font-bold text-slate-900">أحمد محمد علي إبراهيم</span>
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
                    {isAr ? 'الجامعة والكلية' : 'University'}
                  </span>
                  <span className="font-bold text-slate-900">جامعة القاهرة - هندسة</span>
                </div>
                <div>
                  <span className="block text-xs text-slate-400 font-medium">
                    {isAr ? 'البريد الإلكتروني' : 'Email'}
                  </span>
                  <span className="font-bold text-slate-900">ahmed.student@cu.edu.eg</span>
                </div>
              </div>
            </div>

            {/* Portion and pricing details */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <h4 className="font-bold text-slate-900 text-lg">
                {isAr
                  ? 'غرفة مفردة في سكن طالبات بين السرايات - الدقي'
                  : 'Single Room in Girls Apartment - Dokki'}
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm text-slate-600 pt-2">
                <div>
                  <span className="block text-xs text-slate-400 font-medium">
                    {isAr ? 'الإيجار المقترح' : 'Agreed Rent'}
                  </span>
                  <span className="font-bold text-slate-900">3,500 {isAr ? 'ج.م' : 'EGP'}</span>
                </div>
                <div>
                  <span className="block text-xs text-slate-400 font-medium">
                    {isAr ? 'مبلغ التأمين' : 'Deposit'}
                  </span>
                  <span className="font-bold text-slate-900">3,500 {isAr ? 'ج.م' : 'EGP'}</span>
                </div>
                <div>
                  <span className="block text-xs text-slate-400 font-medium">
                    {isAr ? 'مدة العقد' : 'Duration'}
                  </span>
                  <span className="font-medium text-slate-800">
                    {isAr ? '10 أشهر (عام دراسي)' : '10 Months (Academic Year)'}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 pt-2">
              <Link href={`/${params.locale}/owner/messages/conv-1`}>
                <Button variant="outline" className="font-medium">
                  {isAr ? 'محادثة الطالب مباشرة' : 'Direct Chat with Student'}
                </Button>
              </Link>

              {status === 'PENDING' && (
                <>
                  <Button
                    variant="primary"
                    className="bg-green-600 hover:bg-green-700 text-white font-bold"
                    onClick={handleAccept}
                  >
                    {isAr ? 'قبول طلب الحجز' : 'Accept Request'}
                  </Button>
                  <Button variant="danger" onClick={handleReject}>
                    {isAr ? 'رفض الطلب' : 'Reject Request'}
                  </Button>
                </>
              )}

              {status === 'ACCEPTED' && (
                <Button
                  variant="primary"
                  className="bg-orange-600 hover:bg-orange-700 text-white font-bold"
                  onClick={() => setIsAgreementModalOpen(true)}
                >
                  {isAr ? 'اعتماد وتأكيد العقد الثنائي' : 'Confirm Bilateral Agreement'}
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
          userRole="OWNER"
          locale={params.locale}
          onConfirm={handleConfirmAgreement}
        />
      </div>
    </div>
  );
}
