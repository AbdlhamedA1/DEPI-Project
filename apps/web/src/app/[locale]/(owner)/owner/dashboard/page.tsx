import React from 'react';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { Locale } from '../../../../../i18n/config';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../components/ui/card';
import { Badge } from '../../../../../components/ui/badge';

export default function OwnerDashboardPage({ params }: { params: { locale: Locale } }) {
  const isAr = params.locale === 'ar';

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">
              {isAr ? 'لوحة تحكم المالك' : 'Owner Dashboard'}
            </h1>
            <p className="text-slate-600">
              {isAr
                ? 'إدارة العقارات، متابعة طلبات الطلاب، وتحديث الإشغال'
                : 'Manage properties, student booking requests, and occupancy'}
            </p>
          </div>
          <Link
            href={`/${params.locale}/owner/properties/new`}
            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2 rounded-lg text-sm transition"
          >
            {isAr ? '+ إضافة عقار جديد' : '+ Add New Property'}
          </Link>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">
                {isAr ? 'العقارات المدرجة' : 'Listed Properties'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">4</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">
                {isAr ? 'طلبات الحجز المعلقة' : 'Pending Requests'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">3</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">
                {isAr ? 'نسبة الإشغال الحالية' : 'Occupancy Rate'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">85%</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">
                {isAr ? 'حالة التوثيق (KYC)' : 'Verification Status'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="success" className="flex items-center gap-1 font-semibold w-fit">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isAr ? 'مالك موثق' : 'Verified Owner'}</span>
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href={`/${params.locale}/owner/properties`}>
            <Card className="hover:shadow-md transition">
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-1">
                  {isAr ? 'إدارة العقارات والوحدات' : 'Manage Properties & Units'}
                </h3>
                <p className="text-sm text-slate-500">
                  {isAr
                    ? 'تعديل الأسعار والأسرة المتاحة وتفاصيل الغرف'
                    : 'Update prices, availability, and room details'}
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href={`/${params.locale}/owner/verification`}>
            <Card className="hover:shadow-md transition">
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-1">
                  {isAr ? 'ملف التوثيق والمستندات' : 'KYC Verification & Deeds'}
                </h3>
                <p className="text-sm text-slate-500">
                  {isAr
                    ? 'مستندات ملكية العقارات وعقد الإدارة'
                    : 'Ownership documents and property deeds'}
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href={`/${params.locale}/owner/settings`}>
            <Card className="hover:shadow-md transition">
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-1">
                  {isAr ? 'إعدادات الحساب' : 'Account Settings'}
                </h3>
                <p className="text-sm text-slate-500">
                  {isAr ? 'بيانات التواصل والتحويلات المالية' : 'Contact info and payout details'}
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
