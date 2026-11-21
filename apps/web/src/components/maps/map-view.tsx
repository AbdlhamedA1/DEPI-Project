import React from 'react';
import { cn } from '../../lib/utils';

export interface MapViewProps {
  latitude: number;
  longitude: number;
  zoom?: number;
  className?: string;
}

export function MapView({ latitude, longitude, zoom = 14, className }: MapViewProps) {
  return (
    <div
      className={cn(
        'w-full h-64 bg-slate-100 rounded-xl border border-slate-200 flex flex-col items-center justify-center text-slate-500 relative overflow-hidden',
        className,
      )}
    >
      <div className="text-3xl mb-2">📍</div>
      <p className="text-xs font-semibold">خريطة الموقع الجغرافي / Google Maps View</p>
      <p className="text-[10px] text-slate-400 mt-1">
        Lat: {latitude.toFixed(4)}, Lng: {longitude.toFixed(4)} (Zoom: {zoom})
      </p>
    </div>
  );
}
