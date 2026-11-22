import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Building2, AlertTriangle, BarChart3 } from 'lucide-react';
import { Locale } from '../../../../../i18n/config';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../components/ui/card';
import { Badge } from '../../../../../components/ui/badge';

export default function AdminDashboardPage({ params }: { params: { locale: Locale } }) {
  const isAr = params.locale === 'ar';

  return (
    <div className="min-h-screen bg-slate-100 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">
              {isAr ? 'لوحة تحكم الإدارة العامة' : 'Central Admin Dashboard'}
            </h1>
            <p className="text-slate-600">
              {isAr
                ? 'نظرة شاملة على مؤشرات المنصة والتحقق والعمليات'
                : 'Overview of platform metrics, verifications, and operations'}
            </p>
          </div>
          <Badge variant="destructive">{isAr ? 'صلاحيات المشرف العام' : 'Super Admin Mode'}</Badge>
        </div>

        {/* Top KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">
                {isAr ? 'إجمالي الطلاب' : 'Total Students'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,420</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">
                {isAr ? 'الملاك الموثقون' : 'Verified Owners'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">312</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">
                {isAr ? 'عقارات معتمدة' : 'Approved Properties'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">580</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">
                {isAr ? 'طلبات توثيق معلقة' : 'Pending Verifications'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">18</div>
            </CardContent>
          </Card>
        </div>

        {/* Admin Navigation Hub */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href={`/${params.locale}/admin/verifications`}>
            <Card className="hover:border-orange-500 transition">
              <CardContent className="p-4 text-center">
                <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center mx-auto mb-2">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <span className="font-bold text-sm">
                  {isAr ? 'مراجعة التوثيق' : 'KYC Verification'}
                </span>
              </CardContent>
            </Card>
          </Link>

          <Link href={`/${params.locale}/admin/properties`}>
            <Card className="hover:border-orange-500 transition">
              <CardContent className="p-4 text-center">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-2">
                  <Building2 className="w-5 h-5" />
                </div>
                <span className="font-bold text-sm">
                  {isAr ? 'اعتماد العقارات' : 'Property Approvals'}
                </span>
              </CardContent>
            </Card>
          </Link>

          <Link href={`/${params.locale}/admin/reports`}>
            <Card className="hover:border-orange-500 transition">
              <CardContent className="p-4 text-center">
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-2">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <span className="font-bold text-sm">
                  {isAr ? 'إدارة البلاغات' : 'Reports & Safety'}
                </span>
              </CardContent>
            </Card>
          </Link>

          <Link href={`/${params.locale}/admin/analytics`}>
            <Card className="hover:border-orange-500 transition">
              <CardContent className="p-4 text-center">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <span className="font-bold text-sm">
                  {isAr ? 'التحليلات والتقارير' : 'Analytics & Insights'}
                </span>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
