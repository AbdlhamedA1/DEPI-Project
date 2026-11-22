'use client';

import React, { useState, useRef } from 'react';
import { SearchPropertyCardDto } from '@repo/shared-types';
import { SearchViewMode } from '../types';
import { InteractiveMapView } from './interactive-map-view';
import { PropertyCard } from '../../../components/data-display/property-card';
import { SearchViewToggle } from './search-view-toggle';
import { Building2 } from 'lucide-react';

interface SearchResultsContainerProps {
  initialProperties: SearchPropertyCardDto[];
  locale?: string;
}

export function SearchResultsContainer({
  initialProperties,
  locale = 'ar',
}: SearchResultsContainerProps) {
  const isAr = locale === 'ar';
  const [viewMode, setViewMode] = useState<SearchViewMode>('split');
  const [hoveredPropertyId, setHoveredPropertyId] = useState<string | null>(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);

  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const handleSelectPropertyFromMap = (id: string) => {
    setSelectedPropertyId(id);
    if (cardRefs.current[id]) {
      cardRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Controls: Result Count & Dual View Toggle */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">
            {isAr ? 'عقارات سكن الطلاب المتاحة' : 'Available Student Properties'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isAr
              ? `تم العثور على ${initialProperties.length} خيار سكن مطابق لمعايير البحث`
              : `Found ${initialProperties.length} matching accommodation options`}
          </p>
        </div>

        <SearchViewToggle viewMode={viewMode} onChange={setViewMode} locale={locale} />
      </div>

      {/* Main Dual View Content */}
      {initialProperties.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 mb-1">
            {isAr ? 'لم يتم العثور على عقارات مطابقة' : 'No properties matched your criteria'}
          </h3>
          <p className="text-xs text-slate-500">
            {isAr
              ? 'يرجى تجربة تعديل فلاتر البحث أو توسيع نطاق المسافة من الجامعة'
              : 'Try broadening your search radius or adjusting your budget filters'}
          </p>
        </div>
      ) : (
        <div className="w-full">
          {/* 1. Cards View Only */}
          {viewMode === 'cards' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {initialProperties.map(prop => (
                <div
                  key={prop.id}
                  ref={el => {
                    cardRefs.current[prop.id] = el;
                  }}
                  onMouseEnter={() => setHoveredPropertyId(prop.id)}
                  onMouseLeave={() => setHoveredPropertyId(null)}
                  className={`transition-all duration-200 rounded-2xl ${
                    selectedPropertyId === prop.id ? 'ring-2 ring-emerald-500 shadow-md' : ''
                  }`}
                >
                  <PropertyCard
                    id={prop.id}
                    title={isAr ? prop.titleAr : prop.titleEn}
                    location={`${prop.district || ''}، ${prop.city || ''}`}
                    universityName={
                      prop.nearestUniversity || (isAr ? 'جامعة القاهرة' : 'Cairo University')
                    }
                    distanceKm={prop.distanceToCampusKm || 0.8}
                    pricePerMonth={prop.minPriceEgp}
                    genderPolicy={prop.genderPolicy}
                    propertyType={prop.propertyType}
                    isVerified={prop.isVerified}
                    imageUrl={prop.coverImage}
                    locale={locale as any}
                  />
                </div>
              ))}
            </div>
          )}

          {/* 2. Map View Only */}
          {viewMode === 'map' && (
            <div className="w-full">
              <InteractiveMapView
                properties={initialProperties}
                hoveredPropertyId={hoveredPropertyId}
                selectedPropertyId={selectedPropertyId}
                onSelectProperty={handleSelectPropertyFromMap}
                locale={locale}
                className="h-[650px]"
              />
            </div>
          )}

          {/* 3. Split View (Cards on side, Sticky Map on other) */}
          {viewMode === 'split' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Cards Column */}
              <div className="lg:col-span-7 space-y-4 max-h-[750px] overflow-y-auto pr-1">
                {initialProperties.map(prop => (
                  <div
                    key={prop.id}
                    ref={el => {
                      cardRefs.current[prop.id] = el;
                    }}
                    onMouseEnter={() => setHoveredPropertyId(prop.id)}
                    onMouseLeave={() => setHoveredPropertyId(null)}
                    className={`transition-all duration-200 rounded-2xl ${
                      selectedPropertyId === prop.id ? 'ring-2 ring-emerald-500 shadow-md' : ''
                    }`}
                  >
                    <PropertyCard
                      id={prop.id}
                      title={isAr ? prop.titleAr : prop.titleEn}
                      location={`${prop.district || ''}، ${prop.city || ''}`}
                      universityName={
                        prop.nearestUniversity || (isAr ? 'جامعة القاهرة' : 'Cairo University')
                      }
                      distanceKm={prop.distanceToCampusKm || 0.8}
                      pricePerMonth={prop.minPriceEgp}
                      genderPolicy={prop.genderPolicy}
                      propertyType={prop.propertyType}
                      isVerified={prop.isVerified}
                      imageUrl={prop.coverImage}
                      locale={locale as any}
                    />
                  </div>
                ))}
              </div>

              {/* Map Column (Sticky on Desktop) */}
              <div className="lg:col-span-5 sticky top-24">
                <InteractiveMapView
                  properties={initialProperties}
                  hoveredPropertyId={hoveredPropertyId}
                  selectedPropertyId={selectedPropertyId}
                  onSelectProperty={handleSelectPropertyFromMap}
                  locale={locale}
                  className="h-[520px] lg:h-[720px]"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
