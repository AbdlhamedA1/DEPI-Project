'use client';

import React, { useState } from 'react';
import { Locale } from '../../../../i18n/config';
import { Header } from '../../../../components/layout/header';
import { Footer } from '../../../../components/layout/footer';
import {
  SearchFiltersBar,
  SearchResultsContainer,
  SearchFiltersState,
} from '../../../../features/search';
import {
  PropertyType,
  GenderPolicy,
  DurationUnit,
  SearchSortOption,
  SearchPropertyCardDto,
} from '@repo/shared-types';

const INITIAL_PROPERTIES: SearchPropertyCardDto[] = [
  {
    id: 'prop-1',
    titleAr: 'سكن الهدى للطالبات بين السرايات أمام جامعة القاهرة',
    titleEn: 'Al-Huda Girls Residence Dokki near Cairo University',
    propertyType: PropertyType.BUILDING,
    genderPolicy: GenderPolicy.FEMALE_ONLY,
    governorate: 'الجيزة',
    city: 'الدقي',
    district: 'بين السرايات',
    streetAddress: '15 شارع بين السرايات الرئيسي',
    latitude: 30.035,
    longitude: 31.205,
    nearestUniversity: 'جامعة القاهرة',
    distanceToCampusKm: 0.8,
    minPriceEgp: 3500,
    durationUnit: DurationUnit.MONTHLY,
    isVerified: true,
    coverImage:
      'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1200&q=80',
    totalAvailableUnits: 2,
    amenities: ['WIFI', 'AIR_CONDITIONING', 'ELEVATOR', 'BALCONY'],
  },
  {
    id: 'prop-2',
    titleAr: 'سكن الشباب بالعباسية بجوار جامعة عين شمس ومحطة المترو',
    titleEn: 'Ain Shams Youth Residence Abbaseya near Metro',
    propertyType: PropertyType.APARTMENT,
    genderPolicy: GenderPolicy.MALE_ONLY,
    governorate: 'القاهرة',
    city: 'القاهرة',
    district: 'العباسية',
    streetAddress: '42 شارع العباسية الرئيسي',
    latitude: 30.075,
    longitude: 31.282,
    nearestUniversity: 'جامعة عين شمس',
    distanceToCampusKm: 0.5,
    minPriceEgp: 2800,
    durationUnit: DurationUnit.MONTHLY,
    isVerified: true,
    coverImage:
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
    totalAvailableUnits: 1,
    amenities: ['WIFI', 'ELEVATOR', 'WASHING_MACHINE'],
  },
  {
    id: 'prop-3',
    titleAr: 'شقة فاخرة للطلاب بالشاطبي الإسكندرية خطوات من مجمع الكليات',
    titleEn: 'Alexandria Shatby Student Flat steps from campus',
    propertyType: PropertyType.APARTMENT,
    genderPolicy: GenderPolicy.MALE_ONLY,
    governorate: 'الإسكندرية',
    city: 'الإسكندرية',
    district: 'الشاطبي',
    streetAddress: '10 طريق الكورنيش - الشاطبي',
    latitude: 31.207,
    longitude: 29.918,
    nearestUniversity: 'جامعة الإسكندرية',
    distanceToCampusKm: 0.2,
    minPriceEgp: 3200,
    durationUnit: DurationUnit.MONTHLY,
    isVerified: true,
    coverImage:
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
    totalAvailableUnits: 3,
    amenities: ['WIFI', 'AIR_CONDITIONING', 'BALCONY'],
  },
];

export default function SearchPage({ params }: { params: { locale: Locale } }) {
  const isAr = params.locale === 'ar';

  const [filters, setFilters] = useState<SearchFiltersState>({
    query: '',
    universityId: undefined,
    sortBy: SearchSortOption.SUITABILITY,
    maxDistanceKm: 15,
  });

  const [filteredProperties, setFilteredProperties] =
    useState<SearchPropertyCardDto[]>(INITIAL_PROPERTIES);

  const handleApplyFilters = () => {
    let result = [...INITIAL_PROPERTIES];

    if (filters.query) {
      const q = filters.query.toLowerCase();
      result = result.filter(
        p =>
          p.titleAr.toLowerCase().includes(q) ||
          p.titleEn.toLowerCase().includes(q) ||
          p.district.toLowerCase().includes(q),
      );
    }

    if (filters.genderPolicy) {
      result = result.filter(p => p.genderPolicy === filters.genderPolicy);
    }

    if (filters.propertyType) {
      result = result.filter(p => p.propertyType === filters.propertyType);
    }

    if (filters.minPrice) {
      result = result.filter(p => p.minPriceEgp >= (filters.minPrice || 0));
    }

    if (filters.maxPrice) {
      result = result.filter(p => p.minPriceEgp <= (filters.maxPrice || 99999));
    }

    if (filters.maxDistanceKm) {
      result = result.filter(p => (p.distanceToCampusKm ?? 0) <= (filters.maxDistanceKm || 15));
    }

    // Apply Sorting
    if (filters.sortBy === SearchSortOption.PRICE_ASC) {
      result.sort((a, b) => a.minPriceEgp - b.minPriceEgp);
    } else if (filters.sortBy === SearchSortOption.PRICE_DESC) {
      result.sort((a, b) => b.minPriceEgp - a.minPriceEgp);
    } else if (filters.sortBy === SearchSortOption.DISTANCE_ASC) {
      result.sort((a, b) => (a.distanceToCampusKm ?? 99) - (b.distanceToCampusKm ?? 99));
    } else {
      // Suitability
      result.sort((a, b) => (a.isVerified === b.isVerified ? 0 : a.isVerified ? -1 : 1));
    }

    setFilteredProperties(result);
  };

  const handleResetFilters = () => {
    setFilters({
      query: '',
      universityId: undefined,
      sortBy: SearchSortOption.SUITABILITY,
      maxDistanceKm: 15,
    });
    setFilteredProperties(INITIAL_PROPERTIES);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header locale={params.locale} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold text-slate-900 mb-1 tracking-tight">
            {isAr ? 'البحث عن سكن الطلاب في مصر' : 'Student Housing Discovery Engine'}
          </h1>
          <p className="text-sm text-slate-600">
            {isAr
              ? 'تصفح الخيارات المتاحة بالقرب من جامعتك مع مقارنة الأسعار وحساب المسافة بدقة'
              : 'Browse verified accommodations near campus with transparent pricing and exact distance'}
          </p>
        </div>

        {/* Filter Controls Bar */}
        <SearchFiltersBar
          filters={filters}
          onChange={setFilters}
          onApply={handleApplyFilters}
          onReset={handleResetFilters}
          locale={params.locale}
        />

        {/* Dual View Results Container with Synchronized Map */}
        <SearchResultsContainer initialProperties={filteredProperties} locale={params.locale} />
      </main>

      <Footer locale={params.locale} />
    </div>
  );
}
