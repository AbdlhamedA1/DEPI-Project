'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Locale } from '../../../../../i18n/config';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../../components/ui/card';
import { Badge } from '../../../../../components/ui/badge';
import { Button } from '../../../../../components/ui/button';

interface BookingItem {
  id: string;
  propertyTitleAr: string;
  propertyTitleEn: string;
  portionLabelAr: string;
  portionLabelEn: string;
  status: 'PENDING' | 'ACCEPTED' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED' | 'CLOSED_CONFLICT';
  monthlyRentEgp: number;
  startDate: string;
  endDate: string;
  ownerName: string;
  ownerPhone: string;
  conversationId: string;
}

export default function StudentRequestsPage({ params }: { params: { locale: Locale } }) {
  const isAr = params.locale === 'ar';

  const [requests, setRequests] = useState<BookingItem[]>([
    {
      id: 'req-101',
      propertyTitleAr: 'سكن طالبات متميز - الدقي',
      propertyTitleEn: 'Premium Girls Residence - Dokki',
      portionLabelAr: 'غرفة مفردة (حمام خاص)',
      portionLabelEn: 'Single Room (Private Bath)',
      status: 'PENDING',
      monthlyRentEgp: 3500,
      startDate: '2026-09-01',
      endDate: '2027-06-30',
      ownerName: 'أ/ محمود حسن',
      ownerPhone: '+201012345678',
      conversationId: 'conv-1',
    },
  ]);

  const openCount = requests.filter(r => r.status === 'PENDING' || r.status === 'ACCEPTED').length;

  const getStatusBadge = (status: BookingItem['status']) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="warning">{isAr ? 'قيد المراجعة' : 'Pending Review'}</Badge>;
      case 'ACCEPTED':
        return <Badge variant="primary">{isAr ? 'مقبول مبدئياً' : 'Accepted'}</Badge>;
      case 'CONFIRMED':
        return <Badge variant="success">{isAr ? 'حجز مؤكد' : 'Confirmed'}</Badge>;
      case 'CLOSED_CONFLICT':
        return <Badge variant="secondary">{isAr ? 'مغلق لعدم التوفر' : 'Closed Conflict'}</Badge>;
      case 'CANCELLED':
        return <Badge variant="secondary">{isAr ? 'ملغي من قبلك' : 'Cancelled'}</Badge>;
      case 'REJECTED':
        return <Badge variant="danger">{isAr ? 'مرفوض' : 'Rejected'}</Badge>;
    }
  };

  const handleCancel = (id: string) => {
    setRequests(prev => prev.map(r => (r.id === id ? { ...r, status: 'CANCELLED' as const } : r)));
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header with quota indicator */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {isAr ? 'طلبات الحجز الخاصة بي' : 'My Booking Requests'}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {isAr
                ? 'متابعة حالة طلبات الحجز والتأكيد المتبادل للعقود'
                : 'Track booking requests status and mutual agreement confirmation'}
            </p>
          </div>

          {/* Quota Counter (BR-BKG-001) */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-medium text-slate-500">
              {isAr ? 'الطلبات المفتوحة:' : 'Open Requests:'}
            </span>
            <span className="text-sm font-bold text-orange-600">{openCount} / 3</span>
          </div>
        </div>

        {/* Requests List */}
        <div className="space-y-4">
          {requests.map(item => (
            <Card key={item.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-lg font-bold text-slate-900">
                    {isAr ? item.propertyTitleAr : item.propertyTitleEn}
                  </CardTitle>
                  <p className="text-xs font-semibold text-orange-600 mt-0.5">
                    {isAr ? item.portionLabelAr : item.portionLabelEn}
                  </p>
                </div>
                {getStatusBadge(item.status)}
              </CardHeader>

              <CardContent className="space-y-4 pt-0">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-lg text-xs text-slate-600">
                  <div>
                    <span className="block text-slate-400 font-medium">
                      {isAr ? 'القيمة الشهرية' : 'Monthly Rent'}
                    </span>
                    <span className="font-bold text-slate-900">
                      {item.monthlyRentEgp.toLocaleString()} {isAr ? 'ج.م' : 'EGP'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-slate-400 font-medium">
                      {isAr ? 'تاريخ البدء' : 'Start Date'}
                    </span>
                    <span className="font-semibold text-slate-800">{item.startDate}</span>
                  </div>
                  <div>
                    <span className="block text-slate-400 font-medium">
                      {isAr ? 'مالك العقار' : 'Property Owner'}
                    </span>
                    <span className="font-semibold text-slate-800">{item.ownerName}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  <Link href={`/${params.locale}/student/requests/${item.id}`}>
                    <Button variant="outline" className="text-xs">
                      {isAr ? 'تفاصيل الطلب والعقد' : 'Details & Agreement'}
                    </Button>
                  </Link>

                  <Link href={`/${params.locale}/student/messages/${item.conversationId}`}>
                    <Button variant="outline" className="text-xs">
                      {isAr ? 'محادثة المالك' : 'Chat with Owner'}
                    </Button>
                  </Link>

                  {(item.status === 'PENDING' || item.status === 'ACCEPTED') && (
                    <Button
                      variant="danger"
                      className="text-xs"
                      onClick={() => handleCancel(item.id)}
                    >
                      {isAr ? 'إلغاء الطلب' : 'Cancel Request'}
                    </Button>
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
