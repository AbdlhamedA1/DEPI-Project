'use client';

import React, { useState, useMemo } from 'react';
import { SearchPropertyCardDto, SearchMapPinDto } from '@repo/shared-types';
import {
  MapPin,
  Navigation,
  Eye,
  CheckCircle2,
  GraduationCap,
  Building,
  Plus,
  Minus,
  RotateCcw,
  X,
  Compass,
} from 'lucide-react';
import Link from 'next/link';

interface InteractiveMapViewProps {
  properties: (SearchPropertyCardDto | SearchMapPinDto)[];
  hoveredPropertyId: string | null;
  selectedPropertyId: string | null;
  onSelectProperty: (id: string) => void;
  locale?: string;
  className?: string;
}

type RegionFilter = 'ALL' | 'CAIRO' | 'ALEX';

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
  const [regionFilter, setRegionFilter] = useState<RegionFilter>('ALL');
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // Selected property for popup preview
  const activeProperty = properties.find(p => p.id === (activePopupId || selectedPropertyId));

  // Filter properties based on selected region tab
  const filteredProperties = useMemo(() => {
    if (regionFilter === 'CAIRO') {
      return properties.filter(
        p => (p as any).city?.includes('دقي') ||
             (p as any).city?.includes('قاهرة') ||
             (p as any).district?.includes('سرايات') ||
             (p as any).district?.includes('عباسية') ||
             (p.latitude > 29.8 && p.latitude < 30.5),
      );
    }
    if (regionFilter === 'ALEX') {
      return properties.filter(
        p => (p as any).city?.includes('إسكندرية') ||
             (p as any).district?.includes('شاطبي') ||
             p.latitude >= 31.0,
      );
    }
    return properties;
  }, [properties, regionFilter]);

  // Safe geographic projection coordinates that NEVER fly off the screen borders
  const getCoordinatesPct = (p: SearchPropertyCardDto | SearchMapPinDto, index: number) => {
    // Known district coordinates mapping for precision alignment
    const isAlex = (p as any).city?.includes('إسكندرية') || (p as any).district?.includes('شاطبي') || p.latitude >= 31.0;
    const isAbbaseya = (p as any).district?.includes('عباسية') || p.titleAr?.includes('عباسية');
    const isDokki = (p as any).district?.includes('سرايات') || p.titleAr?.includes('سرايات') || p.titleAr?.includes('دقي');

    if (regionFilter === 'CAIRO') {
      if (isDokki) return { top: '56%', left: '38%' };
      if (isAbbaseya) return { top: '38%', left: '68%' };
      return { top: '48%', left: '50%' };
    }

    if (regionFilter === 'ALEX') {
      if (isAlex) return { top: '48%', left: '52%' };
      return { top: '50%', left: '50%' };
    }

    // Default 'ALL' view: Keep pins centered and safely spaced away from edges
    if (isAlex) return { top: '28%', left: '26%' }; // Alexandria on northern coast
    if (isDokki) return { top: '64%', left: '52%' }; // Dokki / Cairo Univ (West bank)
    if (isAbbaseya) return { top: '52%', left: '74%' }; // Abbaseya / Ain Shams (East Cairo)

    // Fallback mathematical clamp with generous safe margins (25% to 75%)
    const safeTop = 30 + (index * 18) % 40;
    const safeLeft = 28 + (index * 22) % 44;
    return { top: `${safeTop}%`, left: `${safeLeft}%` };
  };

  const handleMarkerClick = (id: string) => {
    setActivePopupId(id);
    onSelectProperty(id);
  };

  return (
    <div
      className={`relative w-full h-[540px] lg:h-[640px] bg-slate-950 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl select-none ${className}`}
    >
      {/* 1. Realistic Geographic Map Canvas (Nile River, Mediterranean, Road Grids) */}
      <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden">
        <svg
          className="w-full h-full opacity-60"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 800 600"
          preserveAspectRatio="none"
        >
          <defs>
            {/* Street Grid Pattern */}
            <pattern id="streetGrid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#1e293b" strokeWidth="1" />
              <path d="M 25 0 L 25 50 M 0 25 L 50 25" fill="none" stroke="#0f172a" strokeWidth="0.5" strokeDasharray="2 2" />
            </pattern>

            {/* Subtle Gradient for River Nile */}
            <linearGradient id="nileGradient" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#0369a1" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#0284c7" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.4" />
            </linearGradient>

            {/* Mediterranean Sea Gradient (Alexandria Coast) */}
            <linearGradient id="seaGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#075985" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.3" />
            </linearGradient>
          </defs>

          {/* Grid Background */}
          <rect width="800" height="600" fill="url(#streetGrid)" />

          {/* Mediterranean Sea (Alexandria Coastline) */}
          <path
            d="M 0,0 L 400,0 Q 280,120 0,160 Z"
            fill="url(#seaGradient)"
          />
          <text x="50" y="70" fill="#38bdf8" fontSize="13" fontWeight="bold" opacity="0.6">
            {isAr ? 'البحر الأبيض المتوسط (ساحل الإسكندرية)' : 'Mediterranean Sea (Alexandria)'}
          </text>

          {/* River Nile (نهر النيل) */}
          <path
            d="M 440,600 Q 420,480 430,380 T 450,220 Q 470,160 520,100"
            fill="none"
            stroke="url(#nileGradient)"
            strokeWidth="24"
            strokeLinecap="round"
          />
          <path
            d="M 440,600 Q 420,480 430,380 T 450,220 Q 470,160 520,100"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="2"
            strokeDasharray="8 8"
            opacity="0.7"
          />

          {/* Gezira Island (الزمالك والجزيرة) */}
          <ellipse cx="433" cy="340" rx="6" ry="24" fill="#1e293b" stroke="#0284c7" strokeWidth="1.5" />
          <text x="444" y="344" fill="#94a3b8" fontSize="10" opacity="0.8">
            {isAr ? 'نهر النيل' : 'River Nile'}
          </text>

          {/* Major Road Networks (Ring Road & Bridges) */}
          {/* Ring Road (الطريق الدائري) */}
          <ellipse
            cx="480"
            cy="360"
            rx="260"
            ry="180"
            fill="none"
            stroke="#334155"
            strokeWidth="2"
            strokeDasharray="6 4"
          />
          <text x="610" y="210" fill="#64748b" fontSize="10" opacity="0.7">
            {isAr ? 'الطريق الدائري' : 'Ring Road'}
          </text>

          {/* 6th October Bridge & Cairo-Giza Corridor */}
          <line x1="300" y1="340" x2="620" y2="310" stroke="#475569" strokeWidth="2.5" opacity="0.7" />
          <text x="310" y="330" fill="#64748b" fontSize="9" opacity="0.6">
            {isAr ? 'محور 26 يوليو / كوبري 6 أكتوبر' : '26th July Corridor'}
          </text>
        </svg>

        {/* District Zone Labels (Overlay) */}
        {/* Cairo University Zone */}
        <div className="absolute top-[68%] left-[44%] -translate-x-1/2 -translate-y-1/2 pointer-events-none flex flex-col items-center">
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900/90 border border-orange-500/40 text-orange-400 text-[11px] font-bold shadow-md">
            <GraduationCap className="w-3.5 h-3.5 text-orange-400" />
            <span>{isAr ? 'جامعة القاهرة (الجيزة)' : 'Cairo University Campus'}</span>
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5">{isAr ? 'بين السرايات • الدقي' : 'Dokki • Bayn Al-Sarayat'}</span>
        </div>

        {/* Ain Shams University Zone */}
        <div className="absolute top-[42%] left-[78%] -translate-x-1/2 -translate-y-1/2 pointer-events-none flex flex-col items-center">
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900/90 border border-blue-500/40 text-blue-400 text-[11px] font-bold shadow-md">
            <GraduationCap className="w-3.5 h-3.5 text-blue-400" />
            <span>{isAr ? 'جامعة عين شمس (العباسية)' : 'Ain Shams University'}</span>
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5">{isAr ? 'العباسية • مدينة نصر' : 'Abbaseya • Nasr City'}</span>
        </div>

        {/* Alexandria University Zone */}
        <div className="absolute top-[20%] left-[24%] -translate-x-1/2 -translate-y-1/2 pointer-events-none flex flex-col items-center">
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900/90 border border-emerald-500/40 text-emerald-400 text-[11px] font-bold shadow-md">
            <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isAr ? 'جامعة الإسكندرية (الشاطبي)' : 'Alexandria University'}</span>
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5">{isAr ? 'مجمع الكليات • الكورنيش' : 'Shatby • Corniche'}</span>
        </div>
      </div>

      {/* 2. Map Top Controls Bar (Header Status & Region Selector) */}
      <div className="absolute top-4 left-4 right-4 z-30 flex flex-wrap justify-between items-center gap-2">
        {/* Title Badge */}
        <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-slate-700/80 text-xs font-semibold text-slate-200 shadow-lg">
          <Compass className="w-4 h-4 text-emerald-400" />
          <span>{isAr ? 'خريطة السكن الطلابي المباشر' : 'Live Student Housing Map'}</span>
        </div>

        {/* Region Switcher Pills */}
        <div className="flex items-center bg-slate-900/90 backdrop-blur-md p-1 rounded-2xl border border-slate-700/80 text-xs shadow-lg">
          <button
            type="button"
            onClick={() => setRegionFilter('ALL')}
            className={`px-3 py-1 rounded-xl transition-all ${
              regionFilter === 'ALL'
                ? 'bg-emerald-600 text-white font-bold shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            {isAr ? 'كل العقارات' : 'All'}
          </button>
          <button
            type="button"
            onClick={() => setRegionFilter('CAIRO')}
            className={`px-3 py-1 rounded-xl transition-all ${
              regionFilter === 'CAIRO'
                ? 'bg-emerald-600 text-white font-bold shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            {isAr ? 'القاهرة والجيزة' : 'Cairo & Giza'}
          </button>
          <button
            type="button"
            onClick={() => setRegionFilter('ALEX')}
            className={`px-3 py-1 rounded-xl transition-all ${
              regionFilter === 'ALEX'
                ? 'bg-emerald-600 text-white font-bold shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            {isAr ? 'الإسكندرية' : 'Alexandria'}
          </button>
        </div>

        {/* Counter Badge */}
        <div className="bg-emerald-600 text-white px-3 py-1.5 rounded-2xl text-xs font-bold shadow-md">
          {filteredProperties.length} {isAr ? 'سكن متاح' : 'Available'}
        </div>
      </div>

      {/* 3. Map Floating Zoom & Reset Controls */}
      <div className="absolute bottom-6 start-4 z-30 flex flex-col gap-2">
        <button
          type="button"
          onClick={() => setZoomLevel(prev => Math.min(prev + 0.2, 1.6))}
          aria-label="Zoom in"
          className="w-9 h-9 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 flex items-center justify-center shadow-lg transition-all"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => setZoomLevel(prev => Math.max(prev - 0.2, 0.8))}
          aria-label="Zoom out"
          className="w-9 h-9 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 flex items-center justify-center shadow-lg transition-all"
        >
          <Minus className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => {
            setZoomLevel(1);
            setRegionFilter('ALL');
            setActivePopupId(null);
          }}
          aria-label="Reset view"
          className="w-9 h-9 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 flex items-center justify-center shadow-lg transition-all"
          title={isAr ? 'إعادة ضبط الخريطة' : 'Reset View'}
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* 4. Realistic Property Price Pins (Modern Solid Real Estate Badges) */}
      <div
        className="absolute inset-0 w-full h-full transition-transform duration-300 ease-out"
        style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
      >
        {filteredProperties.map((p, index) => {
          const isHovered = hoveredPropertyId === p.id;
          const isSelected = selectedPropertyId === p.id || activePopupId === p.id;
          const pos = getCoordinatesPct(p, index);

          return (
            <div
              key={p.id}
              style={{ top: pos.top, left: pos.left }}
              onClick={() => handleMarkerClick(p.id)}
              className={`absolute transform -translate-x-1/2 -translate-y-full cursor-pointer transition-all duration-200 ${
                isSelected ? 'z-40 scale-110' : isHovered ? 'z-30 scale-105' : 'z-20 hover:scale-105'
              }`}
            >
              {/* Solid Price Pill with Anchor Arrow */}
              <div
                className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold text-xs shadow-xl transition-all border ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 border-amber-300 ring-4 ring-amber-400/40 shadow-amber-500/50'
                    : isHovered
                      ? 'bg-emerald-400 text-slate-950 border-white ring-4 ring-emerald-400/30 shadow-emerald-500/50'
                      : 'bg-emerald-700 hover:bg-emerald-600 text-white border-emerald-400/50'
                }`}
              >
                <Building className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="tracking-tight whitespace-nowrap">
                  {p.minPriceEgp.toLocaleString('en-US')} {isAr ? 'ج.م' : 'EGP'}
                </span>

                {/* Bottom Triangle Pointer */}
                <div
                  className={`absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 ${
                    isSelected
                      ? 'border-t-amber-500'
                      : isHovered
                        ? 'border-t-emerald-400'
                        : 'border-t-emerald-700'
                  }`}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* 5. Interactive Popup Preview Card */}
      {activeProperty && (
        <div className="absolute bottom-5 end-5 z-40 max-w-xs w-full bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-2xl border border-slate-200 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex justify-between items-start mb-2">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                {activeProperty.isVerified && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>{isAr ? 'عقار موثق' : 'Verified'}</span>
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
              className="text-slate-400 hover:text-slate-700 p-1"
              aria-label="Close preview"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex justify-between items-center pt-2 mt-2 border-t border-slate-100">
            <div>
              <span className="text-[11px] text-slate-500 block">
                {isAr ? 'السعر الشهري' : 'Monthly rent'}
              </span>
              <span className="text-sm font-extrabold text-emerald-700">
                {activeProperty.minPriceEgp.toLocaleString('en-US')} {isAr ? 'ج.م' : 'EGP'}
              </span>
            </div>

            {activeProperty.distanceToCampusKm !== null &&
              activeProperty.distanceToCampusKm !== undefined && (
                <div className="text-center">
                  <span className="text-[11px] text-slate-500 block">
                    {isAr ? 'عن الحرم' : 'Distance'}
                  </span>
                  <span className="text-xs font-bold text-slate-700">
                    {activeProperty.distanceToCampusKm} {isAr ? 'كم' : 'km'}
                  </span>
                </div>
              )}

            <Link
              href={`/${locale}/properties/${activeProperty.id}`}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{isAr ? 'عرض' : 'View'}</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
