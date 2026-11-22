'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Locale } from '../../../../../../i18n/config';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../../components/ui/card';
import { Input } from '../../../../../../components/ui/input';
import { Button } from '../../../../../../components/ui/button';
import { Badge } from '../../../../../../components/ui/badge';

interface ChatMessage {
  id: string;
  sender: 'STUDENT' | 'OWNER';
  body: string;
  time: string;
}

export default function StudentConversationPage({
  params,
}: {
  params: { locale: Locale; conversationId: string };
}) {
  const isAr = params.locale === 'ar';
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      sender: 'OWNER',
      body: isAr
        ? 'أهلاً بك يا أحمد، الغرفة متاحة للمعاينة غداً بعد الظهر إن شاء الله.'
        : 'Hello Ahmed, the room is available for viewing tomorrow afternoon.',
      time: '10:00 ص',
    },
    {
      id: 'msg-2',
      sender: 'STUDENT',
      body: isAr
        ? 'شكراً لحضرتك، سأحضر في تمام الساعة الخامسة للمعاينة.'
        : 'Thank you, I will be there at 5:00 PM for viewing.',
      time: '10:15 ص',
    },
  ]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'STUDENT',
      body: inputText.trim(),
      time: isAr ? 'الآن' : 'Now',
    };
    setMessages(prev => [...prev, newMsg]);
    setInputText('');
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="max-w-4xl mx-auto space-y-4">
        <Link
          href={`/${params.locale}/student/messages`}
          className="text-sm font-semibold text-orange-600 hover:underline inline-block mb-1"
        >
          {isAr ? '← العودة للمحادثات' : '← Back to Conversations'}
        </Link>

        {/* Counterparty Contact Disclosure Card (BR-CNT-001 / F23) */}
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900">أ/ محمود حسن عبدالرحمن</h3>
              <Badge variant="outline" className="text-xs text-orange-600 border-orange-200">
                {isAr ? 'مالك العقار' : 'Property Owner'}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {isAr
                ? 'عقار: سكن طالبات متميز - الدقي'
                : 'Property: Premium Girls Residence - Dokki'}
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div>
              <span className="block text-slate-400 font-medium">{isAr ? 'الهاتف' : 'Phone'}</span>
              <span className="font-bold text-slate-800 dir-ltr inline-block">
                +20 101 234 5678
              </span>
            </div>
            <div>
              <span className="block text-slate-400 font-medium">{isAr ? 'البريد' : 'Email'}</span>
              <span className="font-bold text-slate-800">mahmoud.owner@sakany.eg</span>
            </div>
          </div>
        </div>

        {/* Chat Box */}
        <Card className="flex flex-col h-[65vh]">
          <CardHeader className="py-3 px-6 border-b border-slate-100 flex flex-row items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">
              {isAr ? 'محادثة مشفرة مرتبطة بطلب الحجز' : 'Encrypted conversation linked to booking'}
            </span>
            {/* Permanent Retention Badge (BR-MSG-002) */}
            <Badge variant="secondary" className="text-[10px]">
              {isAr ? 'أرشيف دائم غير قابل للحذف' : 'Permanently Retained Thread'}
            </Badge>
          </CardHeader>

          <CardContent className="flex-1 p-4 overflow-y-auto space-y-3">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`max-w-md p-3.5 rounded-2xl text-sm ${
                  msg.sender === 'STUDENT'
                    ? 'ms-auto bg-orange-600 text-white rounded-br-xs'
                    : 'self-start bg-slate-100 text-slate-900 rounded-bl-xs'
                }`}
              >
                <p className="leading-relaxed">{msg.body}</p>
                <span
                  className={`block text-[10px] mt-1 text-right ${
                    msg.sender === 'STUDENT' ? 'text-orange-200' : 'text-slate-400'
                  }`}
                >
                  {msg.time}
                </span>
              </div>
            ))}
          </CardContent>

          <div className="p-3 border-t border-slate-200 flex gap-2 bg-white">
            <Input
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder={isAr ? 'اكتب رسالتك للمالك...' : 'Type your message...'}
              className="flex-1"
            />
            <Button
              variant="primary"
              onClick={handleSend}
              className="bg-orange-600 hover:bg-orange-700 text-white font-bold"
            >
              {isAr ? 'إرسال' : 'Send'}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
