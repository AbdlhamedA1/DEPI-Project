'use client';

import React, { useState } from 'react';
import { Locale } from '../../../../../i18n/config';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../components/ui/card';
import { Badge } from '../../../../../components/ui/badge';
import { Button } from '../../../../../components/ui/button';

interface NotificationFeedItem {
  id: string;
  type: string;
  titleAr: string;
  titleEn: string;
  bodyAr: string;
  bodyEn: string;
  timeAgoAr: string;
  timeAgoEn: string;
  isRead: boolean;
}

export default function OwnerNotificationsPage({ params }: { params: { locale: Locale } }) {
  const isAr = params.locale === 'ar';
  const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL');

  const [notifications, setNotifications] = useState<NotificationFeedItem[]>([
    {
      id: 'notif-1',
      type: 'BOOKING_REQUEST',
      titleAr: 'طلب حجز جديد لعقارك',
      titleEn: 'New booking request for your property',
      bodyAr: 'تلقيت طلب حجز جديد من الطالب أحمد محمد علي لعقارك بالدقي.',
      bodyEn: 'New booking request from Ahmed Mohamed for your Dokki property.',
      timeAgoAr: 'منذ 15 دقيقة',
      timeAgoEn: '15m ago',
      isRead: false,
    },
    {
      id: 'notif-2',
      type: 'NEW_MESSAGE',
      titleAr: 'رسالة جديدة من طالب',
      titleEn: 'New message from applicant',
      bodyAr: 'شكراً لحضرتك، سأحضر في تمام الساعة الخامسة للمعاينة.',
      bodyEn: 'Thank you, I will be there at 5:00 PM for viewing.',
      timeAgoAr: 'منذ ساعة',
      timeAgoEn: '1h ago',
      isRead: false,
    },
    {
      id: 'notif-3',
      type: 'AGREEMENT_CONFIRMED',
      titleAr: 'اعتماد عقد الإيجار',
      titleEn: 'Rental agreement confirmed',
      bodyAr: 'قام الطالب بتأكيد العقد الثنائي. أصبح الحجز سارياً وتم قفل التزامن.',
      bodyEn: 'Student confirmed the mutual agreement. Unit locked.',
      timeAgoAr: 'منذ يوم',
      timeAgoEn: '1d ago',
      isRead: true,
    },
  ]);

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const filtered = filter === 'UNREAD' ? notifications.filter(n => !n.isRead) : notifications;

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">
              {isAr ? 'تنبيهات المالك' : 'Owner Notifications'}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {isAr
                ? 'إشعارات لحظية بطلبات الحجز الجديدة، محادثات الطلاب، والاعتمادات الثنائية'
                : 'Instant alerts on new booking requests, student messages, and bilateral confirmations'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  filter === 'ALL'
                    ? 'bg-white shadow-sm text-slate-900'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {isAr ? 'الكل' : 'All'}
              </button>
              <button
                onClick={() => setFilter('UNREAD')}
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 ${
                  filter === 'UNREAD'
                    ? 'bg-white shadow-sm text-orange-600'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <span>{isAr ? 'غير المقروءة' : 'Unread'}</span>
                {unreadCount > 0 && (
                  <span className="h-4 w-4 rounded-full bg-orange-600 text-white text-[10px] flex items-center justify-center font-bold">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>

            {unreadCount > 0 && (
              <Button variant="outline" className="text-xs" onClick={handleMarkAllAsRead}>
                {isAr ? 'تحديد الكل كمقروء' : 'Mark all read'}
              </Button>
            )}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-800">
              {isAr ? 'سجل التنبيهات' : 'Notification Stream'}
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-slate-100 p-0">
            {filtered.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                {isAr ? 'لا توجد إشعارات حالياً' : 'No notifications found'}
              </div>
            ) : (
              filtered.map(item => (
                <div
                  key={item.id}
                  className={`p-4 flex items-center justify-between gap-4 transition-colors ${
                    !item.isRead ? 'bg-orange-50/40' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm text-slate-900">
                        {isAr ? item.titleAr : item.titleEn}
                      </p>
                      {!item.isRead && (
                        <Badge variant="primary" className="text-[10px] bg-orange-600 text-white">
                          {isAr ? 'جديد' : 'New'}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {isAr ? item.bodyAr : item.bodyEn}
                    </p>
                    <span className="text-[10px] text-slate-400 block pt-0.5">
                      {isAr ? item.timeAgoAr : item.timeAgoEn}
                    </span>
                  </div>

                  {!item.isRead && (
                    <Button
                      variant="outline"
                      className="text-xs shrink-0"
                      onClick={() => handleMarkAsRead(item.id)}
                    >
                      {isAr ? 'تمت القراءة' : 'Mark Read'}
                    </Button>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
