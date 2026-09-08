'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import type { LatLng } from 'leaflet';

const markerIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface MapTarget {
  lat: number;
  lng: number;
  zoom?: number;
}

interface MapPickerProps {
  value?: { lat: number; lng: number };
  onChange: (loc: { lat: number; lng: number }) => void;
  target?: MapTarget | null;
  targetNonce?: number;
}

function ClickHandler({ value, onChange }: { value?: { lat: number; lng: number }; onChange: (loc: { lat: number; lng: number }) => void }) {
  useMapEvents({
    click(e) {
      onChange({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return value ? <Marker position={[value.lat, value.lng]} icon={markerIcon} /> : null;
}

function MapController({ target, targetNonce }: { target?: MapTarget | null; targetNonce?: number }) {
  const map = useMap();
  useEffect(() => {
    if (target && typeof targetNonce === 'number') {
      map.flyTo([target.lat, target.lng], target.zoom ?? 13, { duration: 0.8 });
    }
  }, [target, targetNonce, map]);
  return null;
}

const defaultCenter: LatLng = { lat: 30.0444, lng: 31.2357 } as LatLng;

export function MapPicker({ value, onChange, target, targetNonce }: MapPickerProps) {
  const [hasMoved, setHasMoved] = useState(false);

  return (
    <div className="w-full">
      <div className="relative z-0 h-72 w-full rounded-2xl overflow-hidden border border-[var(--color-border)]">
        <MapContainer
          center={value ? [value.lat, value.lng] : [defaultCenter.lat, defaultCenter.lng]}
          zoom={value ? 16 : 11}
          className="h-full w-full"
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler value={value} onChange={(loc) => { onChange(loc); setHasMoved(true); }} />
          <MapController target={target} targetNonce={targetNonce} />
        </MapContainer>
      </div>
      <p className="text-xs text-[var(--color-text-muted)] mt-2">
        {value ? (
          hasMoved ? 'تم تحديد الموقع. اضغط على الخريطة لتغييره.' : 'اضغط على الخريطة لتغيير المكان المحدد.'
        ) : (
          'اضغط على الخريطة لتحديد موقع المبنى بدقة.'
        )}
      </p>
    </div>
  );
}
