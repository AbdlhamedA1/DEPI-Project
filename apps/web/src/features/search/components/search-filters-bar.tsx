'use client';

import React from 'react';
import { SearchFiltersState } from '../types';
import { PropertyType, GenderPolicy, DurationUnit, SearchSortOption } from '@repo/shared-types';
import { Search, SlidersHorizontal, RotateCcw } from 'lucide-react';

interface SearchFiltersBarProps {
  filters: SearchFiltersState;
  onChange: (newFilters: SearchFiltersState) => void;
  onApply: () => void;
  onReset: () => void;
  locale?: string;
}

export function SearchFiltersBar({
  filters,
  onChange,
  onApply,
  onReset,
  locale = 'ar',
}: SearchFiltersBarProps) {
  const isAr = locale === 'ar';

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
    {
      id: 'u4444444-4444-4444-4444-444444444444',
      name: isAr ? 'جامعة المنصورة' : 'Mansoura University',
    },
    {
      id: 'u5555555-5555-5555-5555-555555555555',
      name: isAr ? 'جامعة أسيوط' : 'Assiut University',
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 md:p-6 mb-8">
      {/* Top row: Keyword Search & University & Sorting */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* Keyword Search */}
        <div className="relative">
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            {isAr ? 'البحث بالمنطقة أو الكلمة الدلالية' : 'Search by area or keyword'}
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder={
                isAr ? 'مثال: الدقي، بين السرايات، العباسية...' : 'e.g. Dokki, Shatby...'
              }
              value={filters.query || ''}
              onChange={e => onChange({ ...filters, query: e.target.value })}
              className="w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
          </div>
        </div>

        {/* University Filter */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            {isAr ? 'الجامعة المستهدفة' : 'Target University'}
          </label>
          <select
            value={filters.universityId || ''}
            onChange={e => onChange({ ...filters, universityId: e.target.value || undefined })}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
          >
            <option value="">{isAr ? 'كل الجامعات' : 'All Universities'}</option>
            {universities.map(u => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>

        {/* Transparent Sorting */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            {isAr ? 'ترتيب النتائج' : 'Sort Results'}
          </label>
          <select
            value={filters.sortBy || SearchSortOption.SUITABILITY}
            onChange={e => onChange({ ...filters, sortBy: e.target.value as SearchSortOption })}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white font-medium text-slate-800"
          >
            <option value={SearchSortOption.SUITABILITY}>
              {isAr
                ? 'الأكثر ملاءمة للطالب (الموثق ثم الأقرب)'
                : 'Suitability (Verified & Closest)'}
            </option>
            <option value={SearchSortOption.DISTANCE_ASC}>
              {isAr ? 'الأقرب إلى مقر الجامعة الرئيسي' : 'Closest to Main Campus'}
            </option>
            <option value={SearchSortOption.PRICE_ASC}>
              {isAr ? 'السعر: من الأقل إلى الأعلى' : 'Price: Low to High'}
            </option>
            <option value={SearchSortOption.PRICE_DESC}>
              {isAr ? 'السعر: من الأعلى إلى الأقل' : 'Price: High to Low'}
            </option>
            <option value={SearchSortOption.NEWEST}>
              {isAr ? 'أحدث العروض المضافة' : 'Newest First'}
            </option>
          </select>
        </div>
      </div>

      {/* Second row: Radius Slider, Budget Range, Gender & Type */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-3 border-t border-slate-100">
        {/* Distance Radius */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs font-semibold text-slate-700">
              {isAr ? 'الحد الأقصى للمسافة' : 'Max Campus Distance'}
            </label>
            <span className="text-xs font-bold text-emerald-700">
              {filters.maxDistanceKm
                ? `${filters.maxDistanceKm} ${isAr ? 'كم' : 'km'}`
                : isAr
                  ? 'أي مسافة'
                  : 'Any'}
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="15"
            step="0.5"
            value={filters.maxDistanceKm || 15}
            onChange={e => onChange({ ...filters, maxDistanceKm: Number(e.target.value) })}
            className="w-full accent-emerald-600 cursor-pointer"
          />
        </div>

        {/* Budget Range */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            {isAr ? 'نطاق الميزانية (ج.م / شهر)' : 'Budget Range (EGP)'}
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder={isAr ? 'من' : 'Min'}
              value={filters.minPrice || ''}
              onChange={e =>
                onChange({
                  ...filters,
                  minPrice: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              className="w-1/2 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            />
            <span className="text-slate-400">-</span>
            <input
              type="number"
              placeholder={isAr ? 'إلى' : 'Max'}
              value={filters.maxPrice || ''}
              onChange={e =>
                onChange({
                  ...filters,
                  maxPrice: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              className="w-1/2 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            />
          </div>
        </div>

        {/* Gender Policy */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            {isAr ? 'سياسة السكن والجنس' : 'Gender Policy'}
          </label>
          <select
            value={filters.genderPolicy || ''}
            onChange={e =>
              onChange({
                ...filters,
                genderPolicy: (e.target.value as GenderPolicy) || undefined,
              })
            }
            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
          >
            <option value="">{isAr ? 'الكل' : 'All'}</option>
            <option value={GenderPolicy.FEMALE_ONLY}>{isAr ? 'طالبات فقط' : 'Female Only'}</option>
            <option value={GenderPolicy.MALE_ONLY}>{isAr ? 'طلاب فقط' : 'Male Only'}</option>
            <option value={GenderPolicy.MIXED_FAMILY}>
              {isAr ? 'عوائل / مشترك' : 'Mixed / Family'}
            </option>
          </select>
        </div>

        {/* Property Type */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            {isAr ? 'نوع السكن' : 'Property Type'}
          </label>
          <select
            value={filters.propertyType || ''}
            onChange={e =>
              onChange({
                ...filters,
                propertyType: (e.target.value as PropertyType) || undefined,
              })
            }
            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
          >
            <option value="">{isAr ? 'الكل' : 'All Types'}</option>
            <option value={PropertyType.BUILDING}>{isAr ? 'مبنى كامل' : 'Full Building'}</option>
            <option value={PropertyType.APARTMENT}>{isAr ? 'شقة مستقلة' : 'Apartment'}</option>
            <option value={PropertyType.ROOM}>{isAr ? 'غرفة خاصة' : 'Private Room'}</option>
            <option value={PropertyType.BED}>
              {isAr ? 'سرير في غرفة مشتركة' : 'Bed in Shared Room'}
            </option>
          </select>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex justify-end items-center gap-3 mt-4 pt-3 border-t border-slate-100">
        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{isAr ? 'إعادة ضبط' : 'Reset'}</span>
        </button>

        <button
          type="button"
          onClick={onApply}
          className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>{isAr ? 'تطبيق الفلاتر' : 'Apply Filters'}</span>
        </button>
      </div>
    </div>
  );
}
