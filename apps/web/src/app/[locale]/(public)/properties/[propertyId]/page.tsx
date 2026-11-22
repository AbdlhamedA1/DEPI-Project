'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Flag, CheckCircle2, Check, Star, X } from 'lucide-react';
import { Locale } from '../../../../../i18n/config';
import { Header } from '../../../../../components/layout/header';
import { Footer } from '../../../../../components/layout/footer';
import { Badge } from '../../../../../components/ui/badge';
import { Button } from '../../../../../components/ui/button';
import { Card, CardContent } from '../../../../../components/ui/card';

interface ReviewItem {
  id: string;
  studentName: string;
  rating: number;
  date: string;
  comment: string;
  response?: {
    ownerName: string;
    comment: string;
    date: string;
  };
}

export default function PropertyDetailPage({
  params,
}: {
  params: { locale: Locale; propertyId: string };
}) {
  const isAr = params.locale === 'ar';

  const [reviews, setReviews] = useState<ReviewItem[]>([
    {
      id: 'rev-1',
      studentName: 'أحمد م. (طالب موثق)',
      rating: 5,
      date: 'أغسطس 2026',
      comment:
        'سكن ممتاز جداً وقريب من الجامعة والمالك محترم ومتعاون. الشقة نظيفة وجميع الأجهزة تعمل بحالة ممتازة.',
      response: {
        ownerName: 'أ/ محمود حسن (مالك العقار)',
        comment: 'شكراً جزيلاً يا أحمد، شرفتنا ونتمنى لك دوام التوفيق والنجاح في دراستك.',
        date: 'أغسطس 2026',
      },
    },
  ]);

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('MISLEADING_INFO');
  const [reportDescription, setReportDescription] = useState('');
  const [reportSubmitted, setReportSubmitted] = useState(false);

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportDescription.trim()) return;
    setReportSubmitted(true);
    setTimeout(() => {
      setIsReportModalOpen(false);
      setReportSubmitted(false);
      setReportDescription('');
    }, 1500);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header locale={params.locale} />

      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <Link
            href={`/${params.locale}/search`}
            className="text-sm font-semibold text-orange-600 hover:text-orange-700"
          >
            {isAr ? '← العودة لنتائج البحث' : '← Back to search'}
          </Link>

          {/* Report Listing Button */}
          <button
            onClick={() => setIsReportModalOpen(true)}
            className="text-xs font-semibold text-slate-400 hover:text-rose-600 transition-colors flex items-center gap-1.5"
          >
            <Flag className="w-3.5 h-3.5" />
            <span>{isAr ? 'الإبلاغ عن هذا العقار' : 'Report this listing'}</span>
          </button>
        </div>

        {/* Main Property Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="h-72 bg-slate-800 flex items-center justify-center text-slate-400 font-medium">
            {isAr
              ? 'معرض صور العقار الموثقة (Cloudinary CDN)'
              : 'Verified Property Gallery (Cloudinary CDN)'}
          </div>

          <div className="p-8">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="success" className="flex items-center gap-1 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isAr ? 'عقار موثق' : 'Verified Listing'}</span>
                  </Badge>
                  <Badge variant="outline">{isAr ? 'سكن طالبات' : 'Girls Housing'}</Badge>
                  <span className="text-xs font-bold text-amber-600 flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    <span>5.0 ({isAr ? 'تقييم واحد' : '1 review'})</span>
                  </span>
                </div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">
                  {isAr
                    ? 'غرفة مفروشة ومكيفة داخل شقة طالبات راقية'
                    : 'Furnished AC Room in Premium Girls Student Apartment'}
                </h1>
                <p className="text-slate-500 mt-1">
                  {isAr
                    ? 'بين السرايات، الجيزة (500 متر من جامعة القاهرة)'
                    : 'Bayn Al-Sarayat, Giza (500m from Cairo University)'}
                </p>
              </div>

              <div className="text-end">
                <div className="text-3xl font-extrabold text-orange-600">3,500</div>
                <div className="text-xs text-slate-500">
                  {isAr ? 'ج.م / شهرياً شامل الفواتير' : 'EGP / month incl. bills'}
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-6 mt-6">
              <h2 className="text-lg font-bold mb-3">
                {isAr ? 'مواصفات السكن والمرافق' : 'Housing Amenities & Rules'}
              </h2>
              <ul className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm text-slate-700">
                <li className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-600 flex-shrink-0" /> {isAr ? 'إنترنت عالي السرعة (واي فاي)' : 'High-speed Wi-Fi'}</li>
                <li className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-600 flex-shrink-0" /> {isAr ? 'تكييف هواء' : 'Air Conditioning'}</li>
                <li className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-600 flex-shrink-0" /> {isAr ? 'غسالة ملابس ومطبخ مجهز' : 'Washing machine & equipped kitchen'}</li>
                <li className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-600 flex-shrink-0" /> {isAr ? 'أمن وحراسة على مدار الساعة' : '24/7 Building Security'}</li>
                <li className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-600 flex-shrink-0" /> {isAr ? 'بدون عمولة سمسار' : 'Zero Broker Fees'}</li>
              </ul>
            </div>

            <div className="border-t border-slate-200 pt-6 mt-8 flex flex-wrap gap-4">
              <Link href={`/${params.locale}/student/requests/new?propertyId=${params.propertyId}`}>
                <Button
                  size="lg"
                  className="bg-orange-600 hover:bg-orange-700 text-white font-bold"
                >
                  {isAr ? 'إرسال طلب حجز مباشر' : 'Send Booking Request'}
                </Button>
              </Link>
              <Link href={`/${params.locale}/student/messages/conv-1`}>
                <Button variant="outline" size="lg">
                  {isAr ? 'محادثة المالك المباشر' : 'Message Owner'}
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Reviews & Ratings Section (Phase 10: BR-REV-001..003) */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {isAr ? 'تقييمات الطلاب المقيمين' : 'Verified Tenant Reviews'}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {isAr
                  ? 'التقييمات حصرية للطلاب الذين أتموا حجزاً مؤكداً فعلياً داخل السكن.'
                  : 'Reviews are exclusive to verified students who completed a confirmed booking.'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-center px-4 py-2 bg-amber-50 rounded-xl border border-amber-200">
                <span className="text-2xl font-black text-amber-600">5.0</span>
                <div className="flex items-center justify-center gap-0.5 mt-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3 h-3 fill-amber-500 text-amber-500" />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Reviews List */}
          <div className="space-y-4">
            {reviews.map(rev => (
              <Card key={rev.id} className="border-slate-100 shadow-none bg-slate-50/50">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 text-sm">{rev.studentName}</span>
                      <span className="text-xs text-slate-400 ms-2">{rev.date}</span>
                    </div>
                    <div className="flex items-center gap-0.5">
                      {[...Array(rev.rating)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">{rev.comment}</p>

                  {/* Owner Single Rebuttal Response (BR-REV-003) */}
                  {rev.response && (
                    <div className="ms-4 p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-orange-600">
                          {rev.response.ownerName}
                        </span>
                        <span className="text-[10px] text-slate-400">{rev.response.date}</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {rev.response.comment}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Reporting Modal (Phase 10: BR-REP-001) */}
        {isReportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg text-slate-900">
                  {isAr ? 'تقديم بلاغ عن العقار' : 'Report Property Listing'}
                </h3>
                <button
                  onClick={() => setIsReportModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {reportSubmitted ? (
                <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-center text-green-700 text-sm font-semibold flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span>
                    {isAr
                      ? 'تم استلام بلاغك وسيقوم فريق الإشراف بفحصه واتخاذ الإجراء اللازم.'
                      : 'Report submitted. Our moderation team will investigate.'}
                  </span>
                </div>
              ) : (
                <form onSubmit={handleReportSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {isAr ? 'سبب البلاغ' : 'Reason'}
                    </label>
                    <select
                      value={reportReason}
                      onChange={e => setReportReason(e.target.value)}
                      className="w-full text-sm p-2.5 rounded-lg border border-slate-300 bg-white"
                    >
                      <option value="MISLEADING_INFO">
                        {isAr ? 'معلومات أو صور مضللة' : 'Misleading information or photos'}
                      </option>
                      <option value="FRAUD">
                        {isAr ? 'احتيال أو طلب مبالغ خارج المنصة' : 'Fraud or off-platform payment'}
                      </option>
                      <option value="INAPPROPRIATE_BEHAVIOR">
                        {isAr ? 'سلوك غير لائق من المالك' : 'Inappropriate owner behavior'}
                      </option>
                      <option value="SAFETY_CONCERN">
                        {isAr ? 'مخاوف تتعلق بالأمن والسلامة' : 'Safety or security concern'}
                      </option>
                      <option value="OTHER">{isAr ? 'سبب آخر' : 'Other'}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {isAr ? 'تفاصيل البلاغ (نص فقط)' : 'Complaint Details (Text only)'}
                    </label>
                    <textarea
                      rows={4}
                      value={reportDescription}
                      onChange={e => setReportDescription(e.target.value)}
                      placeholder={
                        isAr
                          ? 'يرجى توضيح المشكلة بدقة لمساعدة فريق الإدارة في التحقيق...'
                          : 'Please describe the issue in detail...'
                      }
                      className="w-full text-sm p-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      required
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => setIsReportModalOpen(false)}
                    >
                      {isAr ? 'إلغاء' : 'Cancel'}
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold"
                    >
                      {isAr ? 'إرسال البلاغ' : 'Submit Report'}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </main>

      <Footer locale={params.locale} />
    </div>
  );
}
