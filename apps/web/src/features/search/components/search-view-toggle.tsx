'use client';

import React from 'react';
import { LayoutGrid, Map, Columns } from 'lucide-react';
import { SearchViewMode } from '../types';

interface SearchViewToggleProps {
  viewMode: SearchViewMode;
  onChange: (mode: SearchViewMode) => void;
  locale?: string;
}

export function SearchViewToggle({ viewMode, onChange, locale = 'ar' }: SearchViewToggleProps) {
  const isAr = locale === 'ar';

  return (
    <div className="inline-flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
      <button
        type="button"
        onClick={() => onChange('cards')}
        className={`flex items-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-lg transition-all ${
          viewMode === 'cards'
            ? 'bg-white text-emerald-700 shadow-sm border border-slate-200/60'
            : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        <LayoutGrid className="w-4 h-4" />
        <span>{isAr ? 'قائمة' : 'Cards'}</span>
      </button>

      <button
        type="button"
        onClick={() => onChange('split')}
        className={`hidden md:flex items-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-lg transition-all ${
          viewMode === 'split'
            ? 'bg-white text-emerald-700 shadow-sm border border-slate-200/60'
            : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        <Columns className="w-4 h-4" />
        <span>{isAr ? 'شاشة مقسمة' : 'Split'}</span>
      </button>

      <button
        type="button"
        onClick={() => onChange('map')}
        className={`flex items-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-lg transition-all ${
          viewMode === 'map'
            ? 'bg-white text-emerald-700 shadow-sm border border-slate-200/60'
            : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        <Map className="w-4 h-4" />
        <span>{isAr ? 'خريطة' : 'Map'}</span>
      </button>
    </div>
  );
}
