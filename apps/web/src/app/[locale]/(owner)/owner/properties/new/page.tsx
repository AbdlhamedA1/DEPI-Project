'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Locale } from '../../../../../../i18n/config';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../../components/ui/card';
import { Input } from '../../../../../../components/ui/input';
import { Button } from '../../../../../../components/ui/button';
import {
  Building2,
  MapPin,
  Layers,
  Banknote,
  Camera,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
} from 'lucide-react';
import { PropertyType, GenderPolicy, DurationUnit } from '@repo/shared-types';

export default function NewPropertyPage({ params }: { params: { locale: Locale } }) {
  const isAr = params.locale === 'ar';
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    titleAr: '',
    titleEn: '',
    descriptionAr: '',
    descriptionEn: '',
    propertyType: PropertyType.APARTMENT,
    genderPolicy: GenderPolicy.MALE_ONLY,
    governorate: 'الجيزة',
    city: 'الدقي',
    district: 'بين السرايات',
    streetAddress: '',
    buildingNumber: '',
    floorNumber: 2,
    latitude: 30.035,
    longitude: 31.205,
    universityId: 'u1111111-1111-1111-1111-111111111111',
    // Hierarchy
    unitsCount: 1,
    roomsCount: 2,
    bedsPerRoom: 2,
    hasAc: true,
    hasWifi: true,
    hasElevator: false,
    // Pricing
    priceAmountEgp: 3000,
    durationUnit: DurationUnit.MONTHLY,
    depositAmountEgp: 1500,
    // Expenses
    expenses: [
      { nameAr: 'المياه والصيانة', amount: 200, isMandatory: true },
      { nameAr: 'خدمة الغرف الأسبوعية', amount: 300, isMandatory: false },
    ],
    // Images
    imageUrls: [
      'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1200&q=80',
    ],
  });

  const universities = [
    {
      id: 'u1111111-1111-1111-1111-111111111111',
      name: isAr ? 'جامعة القاهرة' : 'Cairo University',
    },
    {
      id: 'u2222222-2222-2222-2222-222222222222',
      name: isAr ? 'جامعة عين شمس' : 'Ain Shams University',
    },
    {
      id: 'u3333333-3333-3333-3333-333333333333',
      name: isAr ? 'جامعة الإسكندرية' : 'Alexandria University',
    },
  ];

  const handleAddExpense = () => {
    setFormData({
      ...formData,
      expenses: [...formData.expenses, { nameAr: '', amount: 100, isMandatory: true }],
    });
  };

  const handleRemoveExpense = (index: number) => {
    setFormData({
      ...formData,
      expenses: formData.expenses.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create listing API simulation
      setSuccess(true);
      setTimeout(() => {
        router.push(`/${params.locale}/owner/properties`);
      }, 1500);
    } catch {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <Link
            href={`/${params.locale}/owner/properties`}
            className="text-xs font-bold text-emerald-700 hover:underline inline-flex items-center gap-1 mb-2"
          >
            <span>{isAr ? '← العودة لإدارة العقارات' : '← Back to Properties'}</span>
          </Link>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            {isAr ? 'معالج إضافة عقار طلابي جديد' : 'New Student Property Listing Wizard'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {isAr
              ? 'اتبع الخطوات الـ 5 لإدخال تفاصيل العقار، الهيكل الداخلي، الأسعار، ومرفقات الصور'
              : 'Follow the 5 steps to define accommodation hierarchy, flexible pricing, and media'}
          </p>
        </div>

        {/* Wizard Step Progress Pills */}
        <div className="grid grid-cols-5 gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm text-xs font-bold text-center">
          {[
            { num: 1, label: isAr ? 'البيانات' : 'Details', icon: Building2 },
            { num: 2, label: isAr ? 'الموقع' : 'Location', icon: MapPin },
            { num: 3, label: isAr ? 'الهيكل' : 'Hierarchy', icon: Layers },
            { num: 4, label: isAr ? 'الأسعار' : 'Pricing', icon: Banknote },
            { num: 5, label: isAr ? 'الصور' : 'Photos', icon: Camera },
          ].map(({ num, label, icon: Icon }) => (
            <button
              key={num}
              type="button"
              onClick={() => setStep(num)}
              className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl transition-all ${
                step === num
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : step > num
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* Step 1: Basic Info */}
        {step === 1 && (
          <Card className="rounded-3xl border border-slate-200 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-600" />
                <span>
                  {isAr ? 'الخطوة 1: البيانات العامة للعقار' : 'Step 1: Basic Property Info'}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isAr ? 'اسم أو عنوان العقار (بالعربية)' : 'Property Title (Arabic)'} *
                </label>
                <Input
                  value={formData.titleAr}
                  onChange={e => setFormData({ ...formData, titleAr: e.target.value })}
                  placeholder={
                    isAr
                      ? 'مثال: سكن طالبات متميز بالقرب من جامعة القاهرة'
                      : 'e.g. Al-Huda Residence'
                  }
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isAr ? 'اسم أو عنوان العقار (بالإنجليزية)' : 'Property Title (English)'} *
                </label>
                <Input
                  value={formData.titleEn}
                  onChange={e => setFormData({ ...formData, titleEn: e.target.value })}
                  placeholder="e.g. Premium Female Student Housing near Cairo University"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isAr ? 'نوع العقار' : 'Property Type'}
                  </label>
                  <select
                    value={formData.propertyType}
                    onChange={e =>
                      setFormData({ ...formData, propertyType: e.target.value as PropertyType })
                    }
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-xs bg-white font-medium"
                  >
                    <option value={PropertyType.BUILDING}>
                      {isAr ? 'عمارة سكنية كاملة' : 'Full Building'}
                    </option>
                    <option value={PropertyType.APARTMENT}>
                      {isAr ? 'شقة مستقلة' : 'Apartment'}
                    </option>
                    <option value={PropertyType.ROOM}>
                      {isAr ? 'غرفة مستقلة' : 'Independent Room'}
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isAr ? 'سياسة النوع (الجندر)' : 'Gender Policy'}
                  </label>
                  <select
                    value={formData.genderPolicy}
                    onChange={e =>
                      setFormData({ ...formData, genderPolicy: e.target.value as GenderPolicy })
                    }
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-xs bg-white font-medium"
                  >
                    <option value={GenderPolicy.MALE_ONLY}>
                      {isAr ? 'طلاب (بنين فقط)' : 'Male Only'}
                    </option>
                    <option value={GenderPolicy.FEMALE_ONLY}>
                      {isAr ? 'طالبات (بنات فقط)' : 'Female Only'}
                    </option>
                    <option value={GenderPolicy.MIXED_FAMILY}>
                      {isAr ? 'مشترك / عائلي' : 'Mixed / Family'}
                    </option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <Button
                  onClick={() => setStep(2)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl px-6"
                >
                  <span>{isAr ? 'التالي: الموقع الجغرافي →' : 'Next: Location →'}</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Location */}
        {step === 2 && (
          <Card className="rounded-3xl border border-slate-200 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg font-black text-slate-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-600" />
                <span>
                  {isAr ? 'الخطوة 2: الموقع والجامعة الأقرب' : 'Step 2: Location & Proximity'}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isAr ? 'المحافظة' : 'Governorate'}
                  </label>
                  <Input
                    value={formData.governorate}
                    onChange={e => setFormData({ ...formData, governorate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isAr ? 'المدينة' : 'City'}
                  </label>
                  <Input
                    value={formData.city}
                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isAr ? 'الحي / المنطقة' : 'District / Area'}
                  </label>
                  <Input
                    value={formData.district}
                    onChange={e => setFormData({ ...formData, district: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isAr ? 'العنوان بالتفصيل' : 'Street Address'}
                </label>
                <Input
                  value={formData.streetAddress}
                  onChange={e => setFormData({ ...formData, streetAddress: e.target.value })}
                  placeholder="15 شارع بين السرايات الرئيسي"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isAr ? 'الجامعة الأقرب لحساب المسافة' : 'Nearest University'}
                </label>
                <select
                  value={formData.universityId}
                  onChange={e => setFormData({ ...formData, universityId: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs bg-white font-medium"
                >
                  {universities.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-between pt-3">
                <Button variant="outline" onClick={() => setStep(1)} className="rounded-xl">
                  {isAr ? '← السابق' : '← Previous'}
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl px-6"
                >
                  {isAr ? 'التالي: الهيكل الداخلي →' : 'Next: Hierarchy →'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Accommodation Hierarchy */}
        {step === 3 && (
          <Card className="rounded-3xl border border-slate-200 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-600" />
                <span>
                  {isAr
                    ? 'الخطوة 3: هيكل الإقامة (الوحدات والغرف والأسِرّة)'
                    : 'Step 3: Accommodation Hierarchy'}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isAr ? 'عدد الوحدات / الشقق' : 'Units Count'}
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.unitsCount}
                    onChange={e => setFormData({ ...formData, unitsCount: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isAr ? 'عدد الغرف لكل وحدة' : 'Rooms per Unit'}
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.roomsCount}
                    onChange={e => setFormData({ ...formData, roomsCount: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isAr ? 'عدد الأسِرّة في الغرفة' : 'Beds per Room'}
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.bedsPerRoom}
                    onChange={e =>
                      setFormData({ ...formData, bedsPerRoom: Number(e.target.value) })
                    }
                  />
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-2">
                <span className="font-bold text-slate-800 block mb-1">
                  {isAr ? 'المرافق والتجهيزات المتوفرة:' : 'Amenities:'}
                </span>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.hasWifi}
                      onChange={e => setFormData({ ...formData, hasWifi: e.target.checked })}
                      className="accent-emerald-600"
                    />
                    <span>{isAr ? 'إنترنت فائق السرعة Wi-Fi' : 'High-Speed Wi-Fi'}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.hasAc}
                      onChange={e => setFormData({ ...formData, hasAc: e.target.checked })}
                      className="accent-emerald-600"
                    />
                    <span>{isAr ? 'تكييف هواء' : 'Air Conditioning'}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.hasElevator}
                      onChange={e => setFormData({ ...formData, hasElevator: e.target.checked })}
                      className="accent-emerald-600"
                    />
                    <span>{isAr ? 'مصعد كهربائي' : 'Elevator'}</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-between pt-3">
                <Button variant="outline" onClick={() => setStep(2)} className="rounded-xl">
                  {isAr ? '← السابق' : '← Previous'}
                </Button>
                <Button
                  onClick={() => setStep(4)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl px-6"
                >
                  {isAr ? 'التالي: الأسعار والمصروفات →' : 'Next: Pricing →'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Pricing & Additional Expenses */}
        {step === 4 && (
          <Card className="rounded-3xl border border-slate-200 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Banknote className="w-5 h-5 text-emerald-600" />
                <span>
                  {isAr
                    ? 'الخطوة 4: خطة الأسعار والمصروفات الإضافية بالجنيه المصري'
                    : 'Step 4: Pricing in EGP & Expenses'}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isAr ? 'السعر الأساسي (ج.م)' : 'Base Rent (EGP)'} *
                  </label>
                  <Input
                    type="number"
                    value={formData.priceAmountEgp}
                    onChange={e =>
                      setFormData({ ...formData, priceAmountEgp: Number(e.target.value) })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isAr ? 'مبلغ التأمين المسترد (ج.م)' : 'Security Deposit (EGP)'}
                  </label>
                  <Input
                    type="number"
                    value={formData.depositAmountEgp}
                    onChange={e =>
                      setFormData({ ...formData, depositAmountEgp: Number(e.target.value) })
                    }
                  />
                </div>
              </div>

              <div className="pt-2">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-slate-700">
                    {isAr
                      ? 'بند المصروفات الإضافية (خدمات / صيانة / فواتير)'
                      : 'Itemized Additional Expenses'}
                  </span>
                  <button
                    type="button"
                    onClick={handleAddExpense}
                    className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:underline"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isAr ? 'إضافة بند جديد' : 'Add Expense Item'}</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {formData.expenses.map((exp, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs"
                    >
                      <Input
                        value={exp.nameAr}
                        onChange={e => {
                          const updated = [...formData.expenses];
                          updated[idx].nameAr = e.target.value;
                          setFormData({ ...formData, expenses: updated });
                        }}
                        placeholder={isAr ? 'اسم البند (مثال: كهرباء وإنترنت)' : 'Expense Name'}
                        className="w-1/2 bg-white"
                      />
                      <Input
                        type="number"
                        value={exp.amount}
                        onChange={e => {
                          const updated = [...formData.expenses];
                          updated[idx].amount = Number(e.target.value);
                          setFormData({ ...formData, expenses: updated });
                        }}
                        placeholder="ج.م"
                        className="w-24 bg-white"
                      />
                      <label className="flex items-center gap-1.5 cursor-pointer whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={exp.isMandatory}
                          onChange={e => {
                            const updated = [...formData.expenses];
                            updated[idx].isMandatory = e.target.checked;
                            setFormData({ ...formData, expenses: updated });
                          }}
                          className="accent-emerald-600"
                        />
                        <span>{isAr ? 'إلزامي' : 'Mandatory'}</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => handleRemoveExpense(idx)}
                        className="text-rose-500 hover:text-rose-700 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between pt-3">
                <Button variant="outline" onClick={() => setStep(3)} className="rounded-xl">
                  {isAr ? '← السابق' : '← Previous'}
                </Button>
                <Button
                  onClick={() => setStep(5)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl px-6"
                >
                  {isAr ? 'التالي: صور العقار →' : 'Next: Photos →'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 5: Photos & Submission */}
        {step === 5 && (
          <Card className="rounded-3xl border border-slate-200 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Camera className="w-5 h-5 text-emerald-600" />
                <span>
                  {isAr ? 'الخطوة 5: صور العقار وتأكيد النشر' : 'Step 5: Photos & Submission'}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-slate-300 rounded-3xl p-8 text-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer">
                <Camera className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <span className="text-xs font-bold text-slate-700 block mb-1">
                  {isAr
                    ? 'اضغط لرفع صور العقار عبر Cloudinary'
                    : 'Upload Property Photos via Cloudinary'}
                </span>
                <span className="text-[11px] text-slate-500">
                  JPG, PNG (بحد أقصى 10MB لكل صورة)
                </span>
              </div>

              {success && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>
                    {isAr
                      ? 'تم إرسال العقار للمراجعة الإدارية بنجاح! سيتم اعتماده ونشره فوراً'
                      : 'Listing submitted for admin review successfully!'}
                  </span>
                </div>
              )}

              <div className="flex justify-between pt-3">
                <Button variant="outline" onClick={() => setStep(4)} className="rounded-xl">
                  {isAr ? '← السابق' : '← Previous'}
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl px-8 shadow-md"
                >
                  {loading
                    ? isAr
                      ? 'جاري الإرسال...'
                      : 'Submitting...'
                    : isAr
                      ? 'إرسال العقار للمراجعة والنشر'
                      : 'Submit Listing for Review'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
