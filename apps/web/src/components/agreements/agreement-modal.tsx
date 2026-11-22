'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

interface AgreementModalProps {
  isOpen: boolean;
  onClose: () => void;
  requestId: string;
  propertyTitle: string;
  monthlyRentEgp: number;
  depositEgp: number;
  studentConfirmed: boolean;
  ownerConfirmed: boolean;
  userRole: 'STUDENT' | 'OWNER';
  locale?: string;
  onConfirm: () => Promise<void> | void;
}

export const AgreementModal: React.FC<AgreementModalProps> = ({
  isOpen,
  onClose,
  requestId,
  propertyTitle,
  monthlyRentEgp,
  depositEgp,
  studentConfirmed,
  ownerConfirmed,
  userRole,
  locale = 'ar',
  onConfirm,
}) => {
  const isAr = locale === 'ar';
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (!acceptedTerms) return;
    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const isBilateral = studentConfirmed && ownerConfirmed;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="max-w-lg w-full bg-white shadow-2xl rounded-2xl overflow-hidden border-0">
        <CardHeader className="bg-slate-900 text-white p-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold">
              {isAr ? 'عقد الإيجار الإلكتروني المتبادل' : 'Mutual Rental Agreement'}
            </CardTitle>
            <Badge variant={isBilateral ? 'success' : 'warning'}>
              {isBilateral
                ? isAr
                  ? 'مؤكد من الطرفين'
                  : 'Bilateral Confirmed'
                : isAr
                  ? 'قيد استكمال التأكيد'
                  : 'Pending Bilateral'}
            </Badge>
          </div>
          <p className="text-sm text-slate-300 mt-1">{propertyTitle}</p>
        </CardHeader>

        <CardContent className="p-6 space-y-5">
          {/* Financial Breakdown */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-500 font-medium">
                {isAr ? 'القيمة الإيجارية الشهرية' : 'Monthly Rent'}
              </p>
              <p className="text-lg font-bold text-slate-900">
                {monthlyRentEgp.toLocaleString()} {isAr ? 'ج.م' : 'EGP'}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">
                {isAr ? 'مبلغ التأمين المسترد' : 'Refundable Deposit'}
              </p>
              <p className="text-lg font-bold text-slate-900">
                {depositEgp.toLocaleString()} {isAr ? 'ج.م' : 'EGP'}
              </p>
            </div>
          </div>

          {/* Bilateral Confirmation Status */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-800">
              {isAr ? 'حالة اعتماد الطرفين للعقد' : 'Bilateral Approvals Status'}
            </h4>
            <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50/50">
              <span className="text-sm text-slate-700">
                {isAr ? 'موافقة الطالب المستأجر' : 'Student Approval'}
              </span>
              <Badge variant={studentConfirmed ? 'success' : 'secondary'}>
                {studentConfirmed
                  ? isAr
                    ? 'تمت الموافقة'
                    : 'Approved'
                  : isAr
                    ? 'بانتظار الموافقة'
                    : 'Pending'}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50/50">
              <span className="text-sm text-slate-700">
                {isAr ? 'موافقة مالك العقار' : 'Property Owner Approval'}
              </span>
              <Badge variant={ownerConfirmed ? 'success' : 'secondary'}>
                {ownerConfirmed
                  ? isAr
                    ? 'تمت الموافقة'
                    : 'Approved'
                  : isAr
                    ? 'بانتظار الموافقة'
                    : 'Pending'}
              </Badge>
            </div>
          </div>

          {/* Terms checkbox */}
          <label className="flex items-start gap-3 cursor-pointer pt-2">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={e => setAcceptedTerms(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
            />
            <span className="text-xs text-slate-600 leading-relaxed">
              {isAr
                ? 'أقر بأنني اطلعت على الشروط والأحكام ووافق على التزامات السكن والإخلاء ودفع الإيجار الشهري وتأمين التلفيات وفق بنود المنصة.'
                : 'I acknowledge that I have read the terms and agree to accommodation rules, payments, and conditions.'}
            </span>
          </label>

          {/* Action buttons */}
          <div className="flex gap-3 pt-3 border-t border-slate-100">
            <Button variant="outline" onClick={onClose} className="flex-1">
              {isAr ? 'إغلاق' : 'Close'}
            </Button>
            <Button
              variant="primary"
              disabled={!acceptedTerms || loading}
              onClick={handleConfirm}
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold"
            >
              {loading
                ? isAr
                  ? 'جاري التأكيد...'
                  : 'Confirming...'
                : isAr
                  ? 'تأكيد العقد رسمياً'
                  : 'Confirm Agreement'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
