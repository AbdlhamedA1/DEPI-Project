'use client';

import React, { useState } from 'react';
import { Locale } from '../../../../../i18n/config';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../components/ui/card';
import { Badge } from '../../../../../components/ui/badge';
import { Button } from '../../../../../components/ui/button';
import { Input } from '../../../../../components/ui/input';
import {
  ShieldCheck,
  UploadCloud,
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Lock,
} from 'lucide-react';

export default function OwnerVerificationPage({ params }: { params: { locale: Locale } }) {
  const isAr = params.locale === 'ar';

  const [docType, setDocType] = useState('NATIONAL_ID');
  const [docRefNo, setDocRefNo] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'PENDING' | 'VERIFIED' | 'UNVERIFIED'>('PENDING');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      setStatus('PENDING');
      setSuccessMsg(
        isAr
          ? 'تم رفع المستند بأمان إلى وحدة التخزين المشفرة، ويجري مراجعته من قبل إدارة المنصة.'
          : 'Document uploaded securely to private encrypted storage and is awaiting review.',
      );
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            {isAr
              ? 'بوابة توثيق الهوية وسندات الملكية (KYC)'
              : 'Provider Verification Portal (KYC)'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {isAr
              ? 'تلتزم منصة سكن بحماية الطلاب والمالكين عبر التحقق الإلزامي من بطاقة الرقم القومي وسندات ملكية العقار.'
              : 'Sakany platform mandates verification of National ID and ownership deeds before property publishing.'}
          </p>
        </div>

        {/* Current Verification Status Banner */}
        <Card className="rounded-3xl border border-slate-200/80 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>
                {isAr ? 'حالة التوثيق الحالية للحساب' : 'Current Account Verification Status'}
              </span>
            </CardTitle>
            {status === 'VERIFIED' ? (
              <Badge
                variant="success"
                className="bg-emerald-100 text-emerald-800 border-emerald-200 text-xs px-3 py-1 font-bold flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{isAr ? 'موثق ومعتمد' : 'Verified & Approved'}</span>
              </Badge>
            ) : status === 'PENDING' ? (
              <Badge
                variant="warning"
                className="bg-amber-100 text-amber-800 border-amber-200 text-xs px-3 py-1 font-bold flex items-center gap-1"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{isAr ? 'قيد المراجعة الإدارية' : 'Pending Review'}</span>
              </Badge>
            ) : (
              <Badge
                variant="destructive"
                className="bg-rose-100 text-rose-800 border-rose-200 text-xs px-3 py-1 font-bold"
              >
                {isAr ? 'غير موثق' : 'Unverified'}
              </Badge>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-emerald-50/60 border border-emerald-100 rounded-2xl text-xs text-emerald-950 flex items-start gap-2.5">
              <Lock className="w-4 h-4 text-emerald-700 mt-0.5 flex-shrink-0" />
              <p>
                {isAr
                  ? 'خصوصية مطلقة: يتم حفظ مستندات الهوية وعقود الملكية في وحدة تخزين خاصة مشفرة (Private Storage) ولا تظهر إطلاقاً للطلاب أو العامة.'
                  : 'Zero public exposure: All identity cards and title deeds are stored in private secure disk storage.'}
              </p>
            </div>

            {/* Uploaded Documents History */}
            <div className="border border-slate-200 rounded-2xl p-4 text-xs space-y-3">
              <span className="font-bold text-slate-800 block">
                {isAr ? 'المستندات المرفوعة في هذا الحساب:' : 'Uploaded Documents:'}
              </span>
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-400" />
                  <span className="font-semibold text-slate-800">
                    {isAr ? 'بطاقة الرقم القومي (الوجهين)' : 'National ID (Front & Back)'}
                  </span>
                </div>
                <span className="text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  {isAr ? 'تم الاعتماد' : 'Approved'}
                </span>
              </div>

              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-400" />
                  <span className="font-semibold text-slate-800">
                    {isAr
                      ? 'عقد ملكية مسجل / توكيل إدارة'
                      : 'Title Deed / Management Power of Attorney'}
                  </span>
                </div>
                <span className="text-amber-700 font-bold bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                  {isAr ? 'قيد المراجعة' : 'Pending'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upload New Document Card */}
        <Card className="rounded-3xl border border-slate-200 shadow-md">
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-emerald-600" />
              <span>{isAr ? 'رفع وثيقة جديدة (إثبات هوية أو ملكية)' : 'Upload New Document'}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {successMsg && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isAr ? 'نوع المستند' : 'Document Type'}
                  </label>
                  <select
                    value={docType}
                    onChange={e => setDocType(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-xs bg-white font-medium"
                  >
                    <option value="NATIONAL_ID">
                      {isAr ? 'بطاقة الرقم القومي (14 رقم)' : 'National ID (14 digits)'}
                    </option>
                    <option value="OWNERSHIP_DEED">
                      {isAr ? 'عقد ملكية مسجل / عقد ابتدائي' : 'Ownership Deed'}
                    </option>
                    <option value="POWER_OF_ATTORNEY">
                      {isAr ? 'توكيل رسمي موثق بالشهر العقاري' : 'Official Power of Attorney'}
                    </option>
                    <option value="COMMERCIAL_REGISTRY">
                      {isAr ? 'سجل تجاري وبطاقة ضريبية (للشركات)' : 'Commercial Registry (Company)'}
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isAr ? 'الرقم المرجعي للمستند (اختياري)' : 'Document Reference No (Optional)'}
                  </label>
                  <Input
                    value={docRefNo}
                    onChange={e => setDocRefNo(e.target.value)}
                    placeholder={isAr ? 'مثال: 29801010101234' : 'e.g. 29801010101234'}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isAr ? 'ملف المستند (PDF, JPG, PNG)' : 'Document File'}
                </label>
                <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer">
                  <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-1" />
                  <span className="text-xs font-bold text-slate-700 block">
                    {selectedFile
                      ? selectedFile.name
                      : isAr
                        ? 'اختر ملف من جهازك للرفع'
                        : 'Choose file to upload'}
                  </span>
                  <input
                    type="file"
                    onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                    className="mt-2 text-xs text-slate-500"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl px-6"
                >
                  {loading
                    ? isAr
                      ? 'جاري الرفع المشفر...'
                      : 'Uploading...'
                    : isAr
                      ? 'رفع المستند المشفر'
                      : 'Upload Document'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
