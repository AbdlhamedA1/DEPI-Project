'use client';

import React, { useState } from 'react';
import { SearchPropertyCardDto, SearchMapPinDto } from '@repo/shared-types';
import { MapPin, Navigation, Eye, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

interface InteractiveMapViewProps {
  properties: (SearchPropertyCardDto | SearchMapPinDto)[];
  hoveredPropertyId: string | null;
  selectedPropertyId: string | null;
  onSelectProperty: (id: string) => void;
  locale?: string;
  className?: string;
}

export function InteractiveMapView({
  properties,
  hoveredPropertyId,
  selectedPropertyId,
  onSelectProperty,
  locale = 'ar',
  className = '',
}: InteractiveMapViewProps) {
  const isAr = locale === 'ar';
  const [activePopupId, setActivePopupId] = useState<string | null>(selectedPropertyId);

  // Selected property for popup preview
  const activeProperty = properties.find(p => p.id === (activePopupId || selectedPropertyId));

  // Calculate coordinate bounds for the dynamic vector canvas
  const lats = properties.map(p => p.latitude).filter(lat => !isNaN(lat) && lat > 0);
  const lngs = properties.map(p => p.longitude).filter(lng => !isNaN(lng) && lng > 0);

  const minLat = lats.length > 0 ? Math.min(...lats) - 0.05 : 29.9;
  const maxLat = lats.length > 0 ? Math.max(...lats) + 0.05 : 31.3;
  const minLng = lngs.length > 0 ? Math.min(...lngs) - 0.05 : 29.8;
  const maxLng = lngs.length > 0 ? Math.max(...lngs) + 0.05 : 31.6;

  // Convert lat/lng to percentage within viewport
  const getCoordinatesPct = (lat: number, lng: number) => {
    const latPct = ((lat - minLat) / (maxLat - minLat || 1)) * 100;
    const lngPct = ((lng - minLng) / (maxLng - minLng || 1)) * 100;
    // Note: latitude increases upwards (Y inverted)
    const top = Math.max(8, Math.min(92, 100 - latPct));
    const left = Math.max(8, Math.min(92, lngPct));
    return { top: `${top}%`, left: `${left}%` };
  };

  const handleMarkerClick = (id: string) => {
    setActivePopupId(id);
    onSelectProperty(id);
  };

  return (
    <div
      className={`relative w-full h-[520px] lg:h-[620px] bg-slate-900 rounded-3xl overflow-hidden border border-slate-700/60 shadow-xl select-none ${className}`}
    >
      {/* SVG Spatial Radar Grid Background */}
      <svg
        className="absolute inset-0 w-full h-full opacity-20 pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#10b981" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        <circle
          cx="50%"
          cy="50%"
          r="20%"
          fill="none"
          stroke="#059669"
          strokeWidth="1"
          strokeDasharray="4 4"
        />
        <circle
          cx="50%"
          cy="50%"
          r="35%"
          fill="none"
          stroke="#059669"
          strokeWidth="1"
          strokeDasharray="6 6"
        />
      </svg>

      {/* Map Header Status Badge */}
      <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-center pointer-events-none">
        <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-slate-700/80 text-xs font-semibold text-slate-200">
          <Navigation className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span>
            {isAr ? 'خريطة السكن الطلابي التفاعلية (مصر)' : 'Interactive Housing Radar (Egypt)'}
          </span>
        </div>
        <div className="bg-emerald-600/90 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs font-bold">
          {properties.length} {isAr ? 'عقارات متاحة' : 'Pins'}
        </div>
      </div>

      {/* Property Pins */}
      {properties.map(p => {
        const isHovered = hoveredPropertyId === p.id;
        const isSelected = selectedPropertyId === p.id || activePopupId === p.id;
        const pos = getCoordinatesPct(p.latitude, p.longitude);

        return (
          <div
            key={p.id}
            style={{ top: pos.top, left: pos.left }}
            onClick={() => handleMarkerClick(p.id)}
            className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200 ${
              isSelected ? 'z-40 scale-125' : isHovered ? 'z-30 scale-110' : 'z-10 hover:scale-110'
            }`}
          >
            {/* Price Badge Bubble */}
            <div
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-xs shadow-lg transition-all ${
                isSelected
                  ? 'bg-amber-500 text-slate-950 ring-4 ring-amber-400/40 shadow-amber-500/50'
                  : isHovered
                    ? 'bg-emerald-400 text-slate-950 ring-2 ring-white shadow-emerald-500/40'
                    : 'bg-emerald-700 hover:bg-emerald-600 text-white border border-emerald-400/30'
              }`}
            >
              <MapPin className="w-3 h-3" />
              <span>
                {p.minPriceEgp.toLocaleString('en-US')} {isAr ? 'ج.م' : 'EGP'}
              </span>
            </div>
          </div>
        );
      })}

      {/* Interactive Popup Preview Card */}
      {activeProperty && (
        <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50 bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-2xl border border-slate-200 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex justify-between items-start mb-2">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                {activeProperty.isVerified && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>{isAr ? 'موثق' : 'Verified'}</span>
                  </span>
                )}
                <span className="text-[11px] font-medium text-slate-500">
                  {(activeProperty as any).district ||
                    (activeProperty as any).city ||
                    (isAr ? 'الجيزة' : 'Giza')}
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 line-clamp-1">
                {isAr ? activeProperty.titleAr : activeProperty.titleEn}
              </h4>
            </div>
            <button
              onClick={() => setActivePopupId(null)}
              className="text-slate-400 hover:text-slate-600 p-1 text-xs"
            >
              ✕
            </button>
          </div>

          <div className="flex justify-between items-center pt-2 mt-2 border-t border-slate-100">
            <div>
              <span className="text-xs text-slate-500 block">
                {isAr ? 'السعر الشهري' : 'Monthly rent'}
              </span>
              <span className="text-sm font-extrabold text-emerald-700">
                {activeProperty.minPriceEgp.toLocaleString('en-US')} {isAr ? 'ج.م' : 'EGP'}
              </span>
            </div>

            {activeProperty.distanceToCampusKm !== null &&
              activeProperty.distanceToCampusKm !== undefined && (
                <div className="text-right">
                  <span className="text-xs text-slate-500 block">
                    {isAr ? 'عن الجامعة' : 'Campus dist.'}
                  </span>
                  <span className="text-xs font-bold text-slate-700">
                    {activeProperty.distanceToCampusKm} {isAr ? 'كم' : 'km'}
                  </span>
                </div>
              )}

            <Link
              href={`/${locale}/properties/${activeProperty.id}`}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{isAr ? 'تفاصيل' : 'View'}</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
