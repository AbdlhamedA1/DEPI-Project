'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Locale } from '../../../../../i18n/config';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../../components/ui/card';
import { Badge } from '../../../../../components/ui/badge';
import { Button } from '../../../../../components/ui/button';

interface OwnerRequestItem {
  id: string;
  studentName: string;
  studentPhone: string;
  universityName: string;
  propertyTitleAr: string;
  propertyTitleEn: string;
  portionLabelAr: string;
  portionLabelEn: string;
  status: 'PENDING' | 'ACCEPTED' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED' | 'CLOSED_CONFLICT';
  monthlyRentEgp: number;
  startDate: string;
  endDate: string;
  conversationId: string;
}

export default function OwnerRequestsPage({ params }: { params: { locale: Locale } }) {
  const isAr = params.locale === 'ar';

  const [requests, setRequests] = useState<OwnerRequestItem[]>([
    {
      id: 'req-101',
      studentName: 'أحمد محمد علي',
      studentPhone: '+201012345678',
      universityName: 'جامعة القاهرة - كلية الهندسة',
      propertyTitleAr: 'سكن طالبات متميز - الدقي',
      propertyTitleEn: 'Premium Girls Residence - Dokki',
      portionLabelAr: 'غرفة مفردة (حمام خاص)',
      portionLabelEn: 'Single Room (Private Bath)',
      status: 'PENDING',
      monthlyRentEgp: 3500,
      startDate: '2026-09-01',
      endDate: '2027-06-30',
      conversationId: 'conv-1',
    },
  ]);

  const handleAccept = (id: string) => {
    setRequests(prev => prev.map(r => (r.id === id ? { ...r, status: 'ACCEPTED' as const } : r)));
  };

  const handleReject = (id: string) => {
    setRequests(prev => prev.map(r => (r.id === id ? { ...r, status: 'REJECTED' as const } : r)));
  };

  const getStatusBadge = (status: OwnerRequestItem['status']) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="warning">{isAr ? 'طلب جديد معلق' : 'New Pending'}</Badge>;
      case 'ACCEPTED':
        return <Badge variant="primary">{isAr ? 'تم قبولك للطلب' : 'Accepted'}</Badge>;
      case 'CONFIRMED':
        return <Badge variant="success">{isAr ? 'عقد مؤكد' : 'Confirmed'}</Badge>;
      case 'CLOSED_CONFLICT':
        return <Badge variant="secondary">{isAr ? 'مغلق تلقائياً' : 'Auto-closed'}</Badge>;
      case 'CANCELLED':
        return (
          <Badge variant="secondary">{isAr ? 'ملغي من الطالب' : 'Cancelled by Student'}</Badge>
        );
      case 'REJECTED':
        return <Badge variant="danger">{isAr ? 'مرفوض' : 'Rejected'}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {isAr ? 'إدارة طلبات الحجز الواردة' : 'Incoming Booking Requests'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {isAr
              ? 'مراجعة طلبات الطلاب، والقبول المبدئي، وتأكيد العقود الثنائية'
              : 'Review student requests, accept or reject, and confirm bilateral rental agreements'}
          </p>
        </div>

        <div className="space-y-4">
          {requests.map(item => (
            <Card key={item.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg font-bold text-slate-900">
                      {item.studentName}
                    </CardTitle>
                    <span className="text-xs text-slate-500">({item.universityName})</span>
                  </div>
                  <p className="text-xs font-semibold text-orange-600 mt-0.5">
                    {isAr ? item.propertyTitleAr : item.propertyTitleEn} —{' '}
                    {isAr ? item.portionLabelAr : item.portionLabelEn}
                  </p>
                </div>
                {getStatusBadge(item.status)}
              </CardHeader>

              <CardContent className="space-y-4 pt-0">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-lg text-xs text-slate-600">
                  <div>
                    <span className="block text-slate-400 font-medium">
                      {isAr ? 'الإيجار الشهري' : 'Monthly Rent'}
                    </span>
                    <span className="font-bold text-slate-900">
                      {item.monthlyRentEgp.toLocaleString()} {isAr ? 'ج.م' : 'EGP'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-slate-400 font-medium">
                      {isAr ? 'فترة الإقامة' : 'Period'}
                    </span>
                    <span className="font-semibold text-slate-800">
                      {item.startDate} — {item.endDate}
                    </span>
                  </div>
                  <div>
                    <span className="block text-slate-400 font-medium">
                      {isAr ? 'هاتف الطالب' : 'Student Phone'}
                    </span>
                    <span className="font-semibold text-slate-900 dir-ltr inline-block">
                      {item.studentPhone}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  <Link href={`/${params.locale}/owner/requests/${item.id}`}>
                    <Button variant="outline" className="text-xs">
                      {isAr ? 'تفاصيل الطلب والعقد' : 'Details & Agreement'}
                    </Button>
                  </Link>

                  <Link href={`/${params.locale}/owner/messages/${item.conversationId}`}>
                    <Button variant="outline" className="text-xs">
                      {isAr ? 'محادثة الطالب' : 'Chat with Student'}
                    </Button>
                  </Link>

                  {item.status === 'PENDING' && (
                    <>
                      <Button
                        variant="primary"
                        className="text-xs bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => handleAccept(item.id)}
                      >
                        {isAr ? 'قبول الطلب' : 'Accept Request'}
                      </Button>
                      <Button
                        variant="danger"
                        className="text-xs"
                        onClick={() => handleReject(item.id)}
                      >
                        {isAr ? 'رفض الطلب' : 'Reject Request'}
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
