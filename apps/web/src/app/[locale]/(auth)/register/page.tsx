import React from 'react';
import Link from 'next/link';
import { Locale } from '../../../../i18n/config';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Input } from '../../../../components/ui/input';
import { Button } from '../../../../components/ui/button';

export default function RegisterPage({ params }: { params: { locale: Locale } }) {
  const isAr = params.locale === 'ar';

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
      <Card className="max-w-md w-full shadow-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-extrabold text-slate-900">
            {isAr ? 'إنشاء حساب جديد' : 'Create Account'}
          </CardTitle>
          <p className="text-sm text-slate-500 mt-1">
            {isAr
              ? 'سجل بياناتك للبدء في استخدام المنصة'
              : 'Fill in your details to start using the platform'}
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1 text-slate-700">
              {isAr ? 'الاسم بالكامل (رباعي)' : 'Full Legal Name'}
            </label>
            <Input placeholder={isAr ? 'الاسم مطابق للرقم القومي' : 'Name as per National ID'} />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1 text-slate-700">
              {isAr ? 'رقم الهاتف المحمول المصري' : 'Egyptian Mobile Number'}
            </label>
            <Input placeholder="01xxxxxxxxx" />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1 text-slate-700">
              {isAr ? 'الرقم القومي (14 رقم)' : 'National ID (14 digits)'}
            </label>
            <Input placeholder="2xxxxxxxxxxxxx" maxLength={14} />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1 text-slate-700">
              {isAr ? 'كلمة المرور' : 'Password'}
            </label>
            <Input type="password" placeholder="••••••••" />
          </div>

          <Button className="w-full">
            {isAr ? 'المتابعة للتحقق من الهاتف' : 'Proceed to OTP Verification'}
          </Button>

          <div className="text-center text-sm text-slate-600 pt-4 border-t border-slate-100">
            {isAr ? 'لديك حساب بالفعل؟' : 'Already have an account?'}{' '}
            <Link
              href={`/${params.locale}/login`}
              className="font-bold text-orange-600 hover:underline"
            >
              {isAr ? 'تسجيل الدخول' : 'Sign In'}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
