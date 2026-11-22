import React from 'react';
import { MapPin } from 'lucide-react';
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
      <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mb-2 shadow-sm">
        <MapPin className="w-5 h-5 text-orange-600" />
      </div>
      <p className="text-xs font-semibold text-slate-700">خريطة الموقع الجغرافي / Google Maps View</p>
      <p className="text-[10px] text-slate-400 mt-1">
        Lat: {latitude.toFixed(4)}, Lng: {longitude.toFixed(4)} (Zoom: {zoom})
      </p>
    </div>
  );
}
