'use client';

import React from 'react';
import Link from 'next/link';
import { Locale } from '../../../../../i18n/config';
import { Card, CardContent } from '../../../../../components/ui/card';
import { Badge } from '../../../../../components/ui/badge';

interface ConversationListItem {
  id: string;
  bookingRequestId: string;
  ownerName: string;
  propertyTitleAr: string;
  propertyTitleEn: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

export default function StudentMessagesPage({ params }: { params: { locale: Locale } }) {
  const isAr = params.locale === 'ar';

  const conversations: ConversationListItem[] = [
    {
      id: 'conv-1',
      bookingRequestId: 'req-101',
      ownerName: 'أ/ محمود حسن (مالك العقار)',
      propertyTitleAr: 'سكن طالبات متميز - الدقي',
      propertyTitleEn: 'Premium Girls Residence - Dokki',
      lastMessage: 'أهلاً بك يا أحمد، الغرفة متاحة للمعاينة غداً إن شاء الله.',
      lastMessageTime: '10:00 ص',
      unreadCount: 0,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {isAr ? 'المحادثات والرسائل' : 'Messages & Chat'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {isAr
              ? 'محادثاتك المباشرة المرتبطة بطلبات الحجز مع مالكي العقارات'
              : 'Direct conversations tied to booking requests with property owners'}
          </p>
        </div>

        <div className="space-y-3">
          {conversations.map(conv => (
            <Link
              key={conv.id}
              href={`/${params.locale}/student/messages/${conv.id}`}
              className="block group"
            >
              <Card className="hover:border-orange-300 hover:shadow-md transition-all">
                <CardContent className="p-5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="h-12 w-12 rounded-full bg-orange-100 text-orange-600 font-bold flex items-center justify-center shrink-0 text-base">
                      {conv.ownerName.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 truncate">{conv.ownerName}</h4>
                        <span className="text-xs text-slate-400">
                          • {isAr ? conv.propertyTitleAr : conv.propertyTitleEn}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 truncate mt-1">{conv.lastMessage}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0 space-y-1">
                    <span className="text-xs text-slate-400">{conv.lastMessageTime}</span>
                    {conv.unreadCount > 0 && (
                      <div>
                        <Badge variant="primary" className="bg-orange-600 text-white text-[10px]">
                          {conv.unreadCount}
                        </Badge>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
