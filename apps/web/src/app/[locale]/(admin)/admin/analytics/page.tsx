'use client';

import React, { useState } from 'react';
import { BarChart3, Download, FileText, RefreshCw, Lock, Users, MapPin, Shield, Star } from 'lucide-react';
import { Locale } from '../../../../../i18n/config';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../components/ui/card';
import { Badge } from '../../../../../components/ui/badge';
import { Button } from '../../../../../components/ui/button';

export default function AdminAnalyticsPage({ params }: { params: { locale: Locale } }) {
  const isAr = params.locale === 'ar';
  const [timeRange, setTimeRange] = useState<'30d' | '90d' | '1y' | 'all'>('30d');
  const [downloadingFormat, setDownloadingFormat] = useState<string | null>(null);

  const handleExport = (format: 'csv' | 'json', reportType = 'overview') => {
    setDownloadingFormat(format);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
    const exportUrl = `${apiUrl}/analytics/export?reportType=${reportType}&format=${format}`;
    window.open(exportUrl, '_blank');
    setTimeout(() => setDownloadingFormat(null), 1000);
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header and Controls */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">
                {isAr ? 'لوحة التحليلات والمؤشرات التشغيلية' : 'Platform Analytics & KPIs'}
              </h1>
            </div>
            <p className="text-sm text-slate-500">
              {isAr
                ? 'مراقبة حية للعرض والطلب ومسار الحجوزات ونسب الإشغال في المدن الجامعية المصرية'
                : 'Real-time supply, demand, booking funnels, and occupancy across Egyptian universities'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Time Filter Pills */}
            <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setTimeRange('30d')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  timeRange === '30d'
                    ? 'bg-white shadow text-orange-600 font-bold'
                    : 'text-slate-600'
                }`}
              >
                {isAr ? 'آخر 30 يوم' : 'Last 30d'}
              </button>
              <button
                type="button"
                onClick={() => setTimeRange('90d')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  timeRange === '90d'
                    ? 'bg-white shadow text-orange-600 font-bold'
                    : 'text-slate-600'
                }`}
              >
                {isAr ? 'آخر 90 يوم' : 'Last 90d'}
              </button>
              <button
                type="button"
                onClick={() => setTimeRange('1y')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  timeRange === '1y'
                    ? 'bg-white shadow text-orange-600 font-bold'
                    : 'text-slate-600'
                }`}
              >
                {isAr ? 'السنة الحالية' : 'This Year'}
              </button>
            </div>

            {/* Export Buttons */}
            <Button
              variant="outline"
              size="sm"
              disabled={downloadingFormat === 'csv'}
              onClick={() => handleExport('csv')}
              className="gap-1.5 border-slate-300"
            >
              <Download className="w-3.5 h-3.5" />
              <span>
                {downloadingFormat === 'csv'
                  ? isAr
                    ? 'جاري التصدير...'
                    : 'Exporting...'
                  : isAr
                    ? 'تصدير CSV'
                    : 'Export CSV'}
              </span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={downloadingFormat === 'json'}
              onClick={() => handleExport('json')}
              className="gap-1.5 border-slate-300"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>
                {downloadingFormat === 'json'
                  ? isAr
                    ? 'جاري التصدير...'
                    : 'Exporting...'
                  : 'JSON'}
              </span>
            </Button>
          </div>
        </div>

        {/* 1. Platform Overview KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {isAr ? 'المستخدمون النشطون شهرياً (MAU)' : 'Monthly Active Users'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-slate-900">3,400</span>
                <Badge variant="success" className="text-xs">
                  +18.4%
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                {isAr ? '1,100 طالب و 320 مزود خدمة' : '1,100 students & 320 providers'}
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {isAr ? 'متوسط سعر السرير شهرياً' : 'Avg Monthly Bed Rent'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-orange-600">
                  2,450 <span className="text-base font-normal">ج.م</span>
                </span>
                <Badge variant="primary" className="text-xs">
                  {isAr ? 'مستقر' : 'Stable'}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                {isAr ? 'في نطاق محيط الجامعات الحكومية' : 'Public universities radius'}
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {isAr ? 'معدل إتمام الحجوزات' : 'Booking Conversion Rate'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-emerald-600">78.2%</span>
                <Badge variant="success" className="text-xs">
                  +4.1%
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                {isAr ? '975 حجز مؤكد من 1,250 طلب' : '975 confirmed of 1,250 requests'}
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {isAr ? 'نسبة الإشغال الإجمالية' : 'Overall Occupancy Rate'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-blue-600">78.0%</span>
                <Badge variant="secondary" className="text-xs">
                  1,287 / 1,650
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                {isAr ? '363 سريراً متاحاً حالياً' : '363 beds currently available'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 2. User Growth & Booking Funnel Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Booking Lifecycle Funnel */}
          <Card className="border-slate-200">
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-orange-600" />
                  <span>
                    {isAr
                      ? 'مسار دورة حياة الحجز (4 مراحل)'
                      : 'Booking Lifecycle Funnel (4 Stages)'}
                  </span>
                </CardTitle>
                <Badge variant="outline">
                  {isAr ? 'متوسط الرد: 14.5 ساعة' : 'Avg Turnaround: 14.5h'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {/* Stage 1: Submitted */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-700">
                    {isAr ? '1. طلبات الحجز المقدمة من الطلاب' : '1. Submissions by Students'}
                  </span>
                  <span className="text-slate-900">1,250 (100%)</span>
                </div>
                <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500 rounded-full" style={{ width: '100%' }} />
                </div>
              </div>

              {/* Stage 2: Owner Approved */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-700">
                    {isAr ? '2. موافقة الملاك (قبول الطلب)' : '2. Provider Approvals'}
                  </span>
                  <span className="text-emerald-700">1,050 (84.0%)</span>
                </div>
                <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '84%' }} />
                </div>
              </div>

              {/* Stage 3: Confirmed Agreements */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-700">
                    {isAr ? '3. التأكيد الثنائي وعقد الاتفاق' : '3. Bilateral Confirmations'}
                  </span>
                  <span className="text-blue-700 font-bold">975 (78.2%)</span>
                </div>
                <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full" style={{ width: '78.2%' }} />
                </div>
              </div>

              {/* Stage 4: Dropoffs & Cancellations */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-700">
                    {isAr
                      ? '4. الطلبات الملغاة أو المتنازع عليها'
                      : '4. Dropped / Cancelled / Conflicts'}
                  </span>
                  <span className="text-red-600">275 (22.0%)</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-red-400 rounded-full" style={{ width: '22%' }} />
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-600 mt-4 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-700" />
                  {isAr
                    ? 'قفل التزامن الذري يمنع الحجز المزدوج'
                    : 'Atomic concurrency lock prevents double booking'}
                </span>
                <Badge variant="success">{isAr ? 'مُفعّل' : 'Active'}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* User Growth & Provider Breakdown */}
          <Card className="border-slate-200">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span>
                  {isAr
                    ? 'توزيع المستخدمين والملاك والجامعات'
                    : 'User Demographics & Classifications'}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {/* Classification Grid */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-orange-50 border border-orange-100 rounded-xl">
                  <div className="text-xl font-extrabold text-orange-600">182</div>
                  <div className="text-xs text-slate-600 mt-1">
                    {isAr ? 'ملاك أفراد' : 'Individuals'}
                  </div>
                </div>
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl">
                  <div className="text-xl font-extrabold text-blue-600">56</div>
                  <div className="text-xs text-slate-600 mt-1">
                    {isAr ? 'وكلاء عقاريين' : 'Agents'}
                  </div>
                </div>
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                  <div className="text-xl font-extrabold text-emerald-600">42</div>
                  <div className="text-xs text-slate-600 mt-1">
                    {isAr ? 'شركات إدارة' : 'Companies'}
                  </div>
                </div>
              </div>

              {/* University Distribution */}
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {isAr ? 'أعلى الجامعات حسب طلب الطلاب' : 'Top Universities by Student Demand'}
                </h4>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span>جامعة القاهرة (الجيزة)</span>
                    <span className="font-semibold">520 طالب (37%)</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-orange-500 rounded-full" style={{ width: '37%' }} />
                  </div>

                  <div className="flex justify-between pt-1">
                    <span>جامعة عين شمس (العباسية)</span>
                    <span className="font-semibold">340 طالب (24%)</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: '24%' }} />
                  </div>

                  <div className="flex justify-between pt-1">
                    <span>جامعة الإسكندرية (الشاطبي)</span>
                    <span className="font-semibold">240 طالب (17%)</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: '17%' }} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 3. Geographic Supply vs Demand Breakdown */}
        <Card className="border-slate-200">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span>
                {isAr
                  ? 'مؤشرات العرض والطلب حسب المدن والمناطق'
                  : 'Supply & Demand by City & Student District'}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-start">
                <thead className="bg-slate-50 text-slate-700 uppercase">
                  <tr>
                    <th className="p-3 text-start">
                      {isAr ? 'المدينة / المنطقة' : 'City / District'}
                    </th>
                    <th className="p-3 text-start">{isAr ? 'إجمالي العقارات' : 'Listings'}</th>
                    <th className="p-3 text-start">{isAr ? 'الأسرة المتاحة' : 'Available Beds'}</th>
                    <th className="p-3 text-start">{isAr ? 'متوسط الإيجار' : 'Avg Rent'}</th>
                    <th className="p-3 text-start">{isAr ? 'مؤشر الطلب' : 'Demand Index'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-semibold text-slate-900">
                      الجيزة (الدقي، المهندسين، جامعة القاهرة)
                    </td>
                    <td className="p-3">260 عقار</td>
                    <td className="p-3 text-emerald-600 font-semibold">145 سرير</td>
                    <td className="p-3 font-bold text-orange-600">2,600 ج.م</td>
                    <td className="p-3">
                      <Badge variant="destructive">
                        {isAr ? 'مرتفع جداً (94%)' : 'Very High (94%)'}
                      </Badge>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-semibold text-slate-900">
                      القاهرة (العباسية، مدينة نصر، عين شمس)
                    </td>
                    <td className="p-3">195 عقار</td>
                    <td className="p-3 text-emerald-600 font-semibold">120 سرير</td>
                    <td className="p-3 font-bold text-orange-600">2,400 ج.م</td>
                    <td className="p-3">
                      <Badge variant="warning">{isAr ? 'مرتفع (88%)' : 'High (88%)'}</Badge>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-semibold text-slate-900">
                      الإسكندرية (الشاطبي، سموحة، سيدي جابر)
                    </td>
                    <td className="p-3">85 عقار</td>
                    <td className="p-3 text-emerald-600 font-semibold">62 سرير</td>
                    <td className="p-3 font-bold text-orange-600">2,200 ج.م</td>
                    <td className="p-3">
                      <Badge variant="primary">{isAr ? 'متوسط (79%)' : 'Medium (79%)'}</Badge>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-semibold text-slate-900">
                      المنصورة (حي الجامعة، المشاية)
                    </td>
                    <td className="p-3">40 عقار</td>
                    <td className="p-3 text-emerald-600 font-semibold">36 سرير</td>
                    <td className="p-3 font-bold text-orange-600">1,800 ج.م</td>
                    <td className="p-3">
                      <Badge variant="secondary">{isAr ? 'مستقر (72%)' : 'Moderate (72%)'}</Badge>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* 4. Trust & Safety KPIs */}
        <Card className="border-slate-200">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Shield className="w-4 h-4 text-orange-600" />
              <span>
                {isAr ? 'مؤشرات الثقة والسلامة وجودة التقييمات' : 'Trust, Safety & Quality Metrics'}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-center gap-1.5 text-2xl font-extrabold text-amber-500">
                  <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
                  <span>4.7 / 5.0</span>
                </div>
                <div className="text-xs text-slate-600 mt-1">
                  {isAr ? 'متوسط تقييم السكن' : 'Average Rating'}
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-2xl font-extrabold text-emerald-600">98.5%</div>
                <div className="text-xs text-slate-600 mt-1">
                  {isAr ? 'تطابق بيانات الإعلان' : 'Listing Accuracy'}
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-2xl font-extrabold text-blue-600">4</div>
                <div className="text-xs text-slate-600 mt-1">
                  {isAr ? 'شكاوى قيد التحقيق' : 'Open Disputes'}
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-2xl font-extrabold text-slate-900">
                  18.2 {isAr ? 'ساعة' : 'hrs'}
                </div>
                <div className="text-xs text-slate-600 mt-1">
                  {isAr ? 'متوسط زمن حل النزاع' : 'Avg Resolution Time'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
