import React from 'react';
import { Locale } from '../../../../i18n/config';
import { PropertyCard } from '../../../../components/data-display/property-card';
import { Header } from '../../../../components/layout/header';
import { Footer } from '../../../../components/layout/footer';

export default function SearchPage({ params }: { params: { locale: Locale } }) {
  const isAr = params.locale === 'ar';

  const mockProperties = [
    {
      id: 'prop-1',
      title: isAr
        ? 'شقة استوديو مفروشة بالكامل أمام جامعة القاهرة'
        : 'Fully Furnished Studio near Cairo University',
      location: isAr ? 'بين السرايات، الدقي، الجيزة' : 'Bayn Al-Sarayat, Dokki, Giza',
      universityName: isAr ? 'جامعة القاهرة' : 'Cairo University',
      distanceKm: 0.5,
      pricePerMonth: 3500,
      genderPolicy: 'MALE_ONLY' as const,
      propertyType: 'STUDIO',
      isVerified: true,
    },
    {
      id: 'prop-2',
      title: isAr
        ? 'غرفة مفردة في سكن طالبات راقي بجوار محطة المترو'
        : 'Single Room in Premium Girls Dormitory near Metro',
      location: isAr ? 'العباسية، القاهرة' : 'Abbaseya, Cairo',
      universityName: isAr ? 'جامعة عين شمس' : 'Ain Shams University',
      distanceKm: 0.8,
      pricePerMonth: 4200,
      genderPolicy: 'FEMALE_ONLY' as const,
      propertyType: 'ROOM',
      isVerified: true,
    },
    {
      id: 'prop-3',
      title: isAr
        ? 'سرير في غرفة ثنائية مكيفة تشمل فواتير المرافق'
        : 'Bed in Double AC Room inclusive of bills',
      location: isAr ? 'الشاطبي، الإسكندرية' : 'Shatby, Alexandria',
      universityName: isAr ? 'جامعة الإسكندرية' : 'Alexandria University',
      distanceKm: 0.3,
      pricePerMonth: 2200,
      genderPolicy: 'MALE_ONLY' as const,
      propertyType: 'BED',
      isVerified: true,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header locale={params.locale} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2">
            {isAr ? 'نتائج البحث عن سكن الطلاب' : 'Student Housing Search Results'}
          </h1>
          <p className="text-slate-600">
            {isAr
              ? `تم العثور على ${mockProperties.length} خيارات سكن موثوقة ومطابقة لبحثك`
              : `Found ${mockProperties.length} verified listings matching your search`}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {mockProperties.map(prop => (
            <PropertyCard key={prop.id} {...prop} locale={params.locale} />
          ))}
        </div>
      </main>

      <Footer locale={params.locale} />
    </div>
  );
}
