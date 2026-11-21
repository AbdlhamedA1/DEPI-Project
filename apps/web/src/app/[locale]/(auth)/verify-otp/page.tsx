import React from 'react';
import { Locale } from '../../../../i18n/config';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Input } from '../../../../components/ui/input';
import { Button } from '../../../../components/ui/button';

export default function VerifyOtpPage({ params }: { params: { locale: Locale } }) {
  const isAr = params.locale === 'ar';

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
      <Card className="max-w-md w-full shadow-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-extrabold text-slate-900">
            {isAr ? 'تأكيد رمز التحقق (OTP)' : 'Verify OTP Code'}
          </CardTitle>
          <p className="text-sm text-slate-500 mt-1">
            {isAr
              ? 'تم إرسال رمز تأكيد مكون من 6 أرقام إلى هاتفك المحمول'
              : 'A 6-digit confirmation code was sent via SMS to your mobile phone'}
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1 text-slate-700 text-center">
              {isAr ? 'رمز التحقق (6 أرقام)' : 'Verification Code (6 digits)'}
            </label>
            <Input
              className="text-center tracking-widest text-2xl font-mono font-bold"
              placeholder="123456"
              maxLength={6}
            />
          </div>

          <Button className="w-full">{isAr ? 'تأكيد ومتابعة' : 'Verify & Continue'}</Button>

          <div className="text-center text-xs text-slate-500">
            {isAr ? 'لم يصلك الرمز؟' : "Didn't receive the code?"}{' '}
            <button type="button" className="text-orange-600 font-semibold hover:underline">
              {isAr ? 'إعادة الإرسال بعد 60 ثانية' : 'Resend code in 60s'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
