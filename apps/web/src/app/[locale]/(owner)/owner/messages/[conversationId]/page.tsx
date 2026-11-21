import React from 'react';
import { Locale } from '../../../../../../i18n/config';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../../components/ui/card';
import { Input } from '../../../../../../components/ui/input';
import { Button } from '../../../../../../components/ui/button';

export default function OwnerConversationPage({
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
              {isAr
                ? 'محادثة مباشرة مع الطالب: أحمد محمد'
                : 'Conversation with Student: Ahmed Mohamed'}
            </CardTitle>
            <p className="text-xs text-slate-500">
              {isAr ? 'طلب حجز: غرفة مفردة (شقة 1)' : 'Booking Request: Single Room (Flat 1)'}
            </p>
          </CardHeader>

          <CardContent className="flex-1 p-4 overflow-y-auto space-y-4">
            <div className="bg-slate-100 p-3 rounded-xl max-w-md self-start text-sm">
              <p className="font-semibold text-xs text-slate-500 mb-1">
                {isAr ? 'الطالب' : 'Student'}
              </p>
              <p>
                {isAr
                  ? 'السلام عليكم يا حاج محمود، هل السعر شامل الإنترنت والكهرباء؟'
                  : 'Hello Mr. Mahmoud, does the rent include electricity and internet?'}
              </p>
            </div>

            <div className="bg-orange-500 text-white p-3 rounded-xl max-w-md ms-auto text-sm">
              <p className="font-semibold text-xs text-orange-200 mb-1">
                {isAr ? 'أنت (المالك)' : 'You (Owner)'}
              </p>
              <p>
                {isAr
                  ? 'وعليكم السلام يا ابني، نعم شامل الإنترنت والمياه والغاز، الكهرباء بنظام العداد الكودي مقسم بالتساوي.'
                  : 'Yes, high-speed Wi-Fi and water are included.'}
              </p>
            </div>
          </CardContent>

          <div className="p-4 border-t border-slate-200 flex gap-2">
            <Input placeholder={isAr ? 'اكتب رسالتك للطالب...' : 'Type message to student...'} />
            <Button>{isAr ? 'إرسال' : 'Send'}</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
