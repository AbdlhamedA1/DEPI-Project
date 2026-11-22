'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Locale } from '../../../../i18n/config';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Input } from '../../../../components/ui/input';
import { Button } from '../../../../components/ui/button';
import { Smartphone, Lock } from 'lucide-react';

export default function LoginPage({ params }: { params: { locale: Locale } }) {
  const isAr = params.locale === 'ar';
  const router = useRouter();

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [usePassword, setUsePassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!phone || phone.trim().length < 10) {
      setError(
        isAr
          ? 'يرجى إدخال رقم هاتف مصري صحيح (مثال: 01012345678)'
          : 'Please enter a valid Egyptian phone number (e.g. 01012345678)',
      );
      return;
    }

    setLoading(true);
    try {
      if (usePassword) {
        // Direct password login
        router.push(`/${params.locale}/student/dashboard`);
      } else {
        // OTP login flow
        router.push(`/${params.locale}/verify-otp?phone=${encodeURIComponent(phone.trim())}`);
      }
    } catch (err: any) {
      setError(
        err.message || (isAr ? 'حدث خطأ أثناء تسجيل الدخول' : 'An error occurred during sign in'),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
      <Card className="max-w-md w-full shadow-lg border border-slate-200/80 rounded-3xl">
        <CardHeader className="text-center pb-2">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
            <Smartphone className="w-6 h-6" />
          </div>
          <CardTitle className="text-2xl font-black text-slate-900">
            {isAr ? 'تسجيل الدخول' : 'Sign In'}
          </CardTitle>
          <p className="text-xs text-slate-500 mt-1">
            {isAr
              ? 'أدخل رقم الهاتف لتسجيل الدخول أو استلام رمز التحقق (OTP)'
              : 'Enter your phone number to sign in or receive an OTP'}
          </p>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold mb-1 text-slate-700">
                {isAr ? 'رقم الهاتف المحمول (مصر)' : 'Mobile Phone Number (Egypt)'}
              </label>
              <div className="relative">
                <Input
                  type="tel"
                  placeholder="01012345678"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="pl-3 pr-10 py-2.5 rounded-xl text-sm font-medium"
                  required
                />
                <span className="absolute right-3 top-3 text-xs font-bold text-slate-400">+20</span>
              </div>
            </div>

            {usePassword && (
              <div>
                <label className="block text-xs font-bold mb-1 text-slate-700">
                  {isAr ? 'كلمة المرور' : 'Password'}
                </label>
                <div className="relative">
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="pl-3 pr-10 py-2.5 rounded-xl text-sm"
                    required
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-3.5" />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between text-xs pt-1">
              <button
                type="button"
                onClick={() => setUsePassword(!usePassword)}
                className="text-emerald-700 hover:text-emerald-800 font-bold underline transition-colors"
              >
                {usePassword
                  ? isAr
                    ? 'الدخول عبر رمز التحقق (OTP)'
                    : 'Sign in with OTP instead'
                  : isAr
                    ? 'الدخول بكلمة المرور'
                    : 'Sign in with Password instead'}
              </button>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl shadow-md transition-all"
            >
              {loading
                ? isAr
                  ? 'جاري المعالجة...'
                  : 'Processing...'
                : usePassword
                  ? isAr
                    ? 'تسجيل الدخول'
                    : 'Sign In'
                  : isAr
                    ? 'إرسال رمز التحقق (OTP)'
                    : 'Send Verification Code'}
            </Button>

            <div className="text-center text-xs text-slate-500 pt-4 border-t border-slate-100">
              {isAr ? 'ليس لديك حساب بعد؟' : "Don't have an account yet?"}{' '}
              <Link
                href={`/${params.locale}/register/student`}
                className="font-bold text-emerald-700 hover:underline"
              >
                {isAr ? 'سجل حسابك كطالب' : 'Register as Student'}
              </Link>{' '}
              {isAr ? 'أو' : 'or'}{' '}
              <Link
                href={`/${params.locale}/register/owner`}
                className="font-bold text-emerald-700 hover:underline"
              >
                {isAr ? 'كمالك عقار' : 'as Owner'}
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
