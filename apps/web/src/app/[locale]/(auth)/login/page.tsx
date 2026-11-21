import React from 'react';
import Link from 'next/link';
import { Locale } from '../../../../i18n/config';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Input } from '../../../../components/ui/input';
import { Button } from '../../../../components/ui/button';

export default function LoginPage({ params }: { params: { locale: Locale } }) {
  const isAr = params.locale === 'ar';

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
      <Card className="max-w-md w-full shadow-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-extrabold text-slate-900">
            {isAr ? 'تسجيل الدخول' : 'Sign In'}
          </CardTitle>
          <p className="text-sm text-slate-500 mt-1">
            {isAr
              ? 'أدخل رقم الهاتف للوصول إلى حسابك'
              : 'Enter your mobile number to access your account'}
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1 text-slate-700">
              {isAr ? 'رقم الهاتف المحمول' : 'Mobile Phone Number'}
            </label>
            <Input placeholder="01xxxxxxxxx" />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1 text-slate-700">
              {isAr ? 'كلمة المرور' : 'Password'}
            </label>
            <Input type="password" placeholder="••••••••" />
          </div>

          <div className="flex items-center justify-between text-xs">
            <Link href={`/${params.locale}/verify-otp`} className="text-orange-600 hover:underline">
              {isAr ? 'الدخول عبر رمز التحقق (OTP)' : 'Login via OTP'}
            </Link>
          </div>

          <Button className="w-full">{isAr ? 'تسجيل الدخول' : 'Sign In'}</Button>

          <div className="text-center text-sm text-slate-600 pt-4 border-t border-slate-100">
            {isAr ? 'ليس لديك حساب بعد؟' : "Don't have an account yet?"}{' '}
            <Link
              href={`/${params.locale}/account-type`}
              className="font-bold text-orange-600 hover:underline"
            >
              {isAr ? 'إنشاء حساب جديد' : 'Register now'}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
