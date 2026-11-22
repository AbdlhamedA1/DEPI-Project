'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Locale } from '../../../../i18n/config';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Input } from '../../../../components/ui/input';
import { Button } from '../../../../components/ui/button';
import { ShieldCheck, RotateCcw, CheckCircle2 } from 'lucide-react';

function VerifyOtpContent({ locale }: { locale: Locale }) {
  const isAr = locale === 'ar';
  const router = useRouter();
  const searchParams = useSearchParams();
  const phone = searchParams?.get('phone') || '+201012345678';

  const [code, setCode] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (code.length < 6) {
      setError(
        isAr
          ? 'يرجى إدخال رمز التحقق المكون من 6 أرقام كاملاً'
          : 'Please enter the complete 6-digit code',
      );
      return;
    }

    setLoading(true);
    try {
      setSuccessMsg(
        isAr ? 'تم التحقق بنجاح! جاري تحويلك...' : 'Verified successfully! Redirecting...',
      );
      setTimeout(() => {
        router.push(`/${locale}/student/dashboard`);
      }, 800);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : undefined;
      setError(
        msg || (isAr ? 'رمز التحقق غير صحيح أو منتهي الصلاحية' : 'Invalid or expired OTP code'),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend || resending) return;
    setResending(true);
    setError(null);

    try {
      setCountdown(60);
      setCanResend(false);
      setSuccessMsg(isAr ? 'تم إعادة إرسال رمز التحقق بنجاح' : 'New code sent successfully');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : undefined;
      setError(msg || (isAr ? 'فشل إعادة إرسال الرمز' : 'Failed to resend code'));
    } finally {
      setResending(false);
    }
  };

  return (
    <Card className="max-w-md w-full shadow-lg border border-slate-200/80 rounded-3xl">
      <CardHeader className="text-center pb-2">
        <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <CardTitle className="text-2xl font-black text-slate-900">
          {isAr ? 'تأكيد رمز التحقق (OTP)' : 'Verify OTP Code'}
        </CardTitle>
        <p className="text-xs text-slate-500 mt-1">
          {isAr
            ? `تم إرسال رمز تأكيد مكون من 6 أرقام إلى هاتفك (${phone})`
            : `A 6-digit confirmation code was sent via SMS to ${phone}`}
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="block text-xs font-bold mb-1 text-slate-700 text-center">
              {isAr ? 'أدخل الرمز (6 أرقام)' : 'Enter 6-digit code'}
            </label>
            <Input
              className="text-center tracking-widest text-3xl font-mono font-bold py-3 rounded-2xl bg-slate-50 border-slate-300 focus:bg-white"
              placeholder="••••••"
              maxLength={6}
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
              autoFocus
            />
          </div>

          <Button
            type="submit"
            disabled={loading || code.length < 6}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl shadow-md transition-all"
          >
            {loading
              ? isAr
                ? 'جاري التحقق...'
                : 'Verifying...'
              : isAr
                ? 'تأكيد ومتابعة'
                : 'Verify & Continue'}
          </Button>

          <div className="text-center text-xs text-slate-500 pt-2 flex items-center justify-center gap-1.5">
            {canResend ? (
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-bold underline transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{isAr ? 'إعادة إرسال الرمز الآن' : 'Resend code now'}</span>
              </button>
            ) : (
              <span className="text-slate-400">
                {isAr
                  ? `يمكنك إعادة طلب الرمز خلال ${countdown} ثانية`
                  : `You can resend code in ${countdown}s`}
              </span>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default function VerifyOtpPage({ params }: { params: { locale: Locale } }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
      <Suspense
        fallback={<div className="text-center p-6 text-sm text-slate-500">جاري التحميل...</div>}
      >
        <VerifyOtpContent locale={params.locale} />
      </Suspense>
    </div>
  );
}
