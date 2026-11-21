import React from 'react';
import Link from 'next/link';
import { Locale } from '../../i18n/config';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';

export interface PropertyCardProps {
  id: string;
  title: string;
  location: string;
  universityName: string;
  distanceKm: number;
  pricePerMonth: number;
  genderPolicy: 'MALE_ONLY' | 'FEMALE_ONLY' | 'MIXED_FAMILY';
  propertyType: string;
  isVerified: boolean;
  locale: Locale;
}

export function PropertyCard({
  id,
  title,
  location,
  universityName,
  distanceKm,
  pricePerMonth,
  genderPolicy,
  isVerified,
  locale,
}: PropertyCardProps) {
  const isAr = locale === 'ar';

  const genderLabels = {
    MALE_ONLY: isAr ? 'بنين فقط' : 'Male Only',
    FEMALE_ONLY: isAr ? 'بنات فقط' : 'Female Only',
    MIXED_FAMILY: isAr ? 'مشترك / عائلي' : 'Mixed / Family',
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="h-48 bg-slate-200 relative flex items-center justify-center text-slate-400">
        <span className="text-sm">{isAr ? 'صورة العقار' : 'Property Image'}</span>
        {isVerified && (
          <div className="absolute top-3 start-3">
            <Badge variant="success">{isAr ? 'موثق ✓' : 'Verified ✓'}</Badge>
          </div>
        )}
        <div className="absolute top-3 end-3">
          <Badge variant="outline" className="bg-white/90">
            {genderLabels[genderPolicy]}
          </Badge>
        </div>
      </div>

      <CardContent className="p-5">
        <div className="text-xs text-orange-600 font-medium mb-1">
          {universityName} • {isAr ? `على بُعد ${distanceKm} كم` : `${distanceKm} km away`}
        </div>
        <h3 className="font-bold text-lg text-slate-900 mb-2 line-clamp-1">{title}</h3>
        <p className="text-sm text-slate-500 mb-4">{location}</p>

        <div className="flex items-center justify-between border-t border-slate-100 pt-3">
          <div>
            <span className="text-xl font-extrabold text-slate-900">
              {pricePerMonth.toLocaleString()}
            </span>
            <span className="text-xs text-slate-500"> {isAr ? 'ج.م / شهرياً' : 'EGP / mo'}</span>
          </div>
          <Link
            href={`/${locale}/properties/${id}`}
            className="text-sm font-semibold text-orange-600 hover:text-orange-700"
          >
            {isAr ? 'عرض التفاصيل ←' : 'View Details →'}
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
