import React from 'react';
import { Locale } from '../../../../../../i18n/config';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../../components/ui/card';
import { Input } from '../../../../../../components/ui/input';
import { Button } from '../../../../../../components/ui/button';

export default function StudentConversationPage({
  params,
}: {
  params: { locale: Locale; conversationId: string };
}) {
  const isAr = params.locale === 'ar';

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="flex flex-col h-[75vh]">
          <CardHeader className="border-b border-slate-200">
            <CardTitle className="text-lg">
              {isAr ? 'محادثة مباشرة مع مالك السكن' : 'Direct Conversation with Owner'}
            </CardTitle>
            <p className="text-xs text-slate-500">
              {isAr ? 'عقار: شقة بين السرايات - الدقي' : 'Property: Dokki Apartment'}
            </p>
          </CardHeader>

          <CardContent className="flex-1 p-4 overflow-y-auto space-y-4">
            <div className="bg-slate-100 p-3 rounded-xl max-w-md self-start text-sm">
              <p className="font-semibold text-xs text-slate-500 mb-1">
                {isAr ? 'المالك' : 'Owner'}
              </p>
              <p>
                {isAr
                  ? 'أهلاً بك يا أحمد، الغرفة متاحة للمعاينة غداً بعد الظهر إن شاء الله.'
                  : 'Hello Ahmed, the room is available for viewing tomorrow afternoon.'}
              </p>
            </div>

            <div className="bg-orange-500 text-white p-3 rounded-xl max-w-md ms-auto text-sm">
              <p className="font-semibold text-xs text-orange-200 mb-1">{isAr ? 'أنت' : 'You'}</p>
              <p>
                {isAr
                  ? 'شكراً لحضرتك، سأحضر في تمام الساعة الخامسة.'
                  : 'Thank you, I will be there at 5:00 PM.'}
              </p>
            </div>
          </CardContent>

          <div className="p-4 border-t border-slate-200 flex gap-2">
            <Input placeholder={isAr ? 'اكتب رسالتك للمالك...' : 'Type your message...'} />
            <Button>{isAr ? 'إرسال' : 'Send'}</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
