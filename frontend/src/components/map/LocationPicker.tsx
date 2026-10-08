import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

const customPinIcon = L.divIcon({
  html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#2563eb" width="36" height="36" stroke="#ffffff" stroke-width="1.5"><path d="M12 0C7.58 0 4 3.58 4 8c0 5.25 8 13 8 13s8-7.75 8-13c0-4.42-3.58-8-8-8zm0 11c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z"/></svg>`,
  className: 'custom-leaflet-pin',
  iconSize: [36, 36],
  iconAnchor: [18, 36],
});

interface LocationPickerProps {
  lat: number;
  lng: number;
  onLocationChange: (lat: number, lng: number) => void;
}

const MapEventsHandler: React.FC<{ onLocationChange: (lat: number, lng: number) => void }> = ({
  onLocationChange,
}) => {
  useMapEvents({
    click(e) {
      onLocationChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

export const LocationPicker: React.FC<LocationPickerProps> = ({
  lat,
  lng,
  onLocationChange,
}) => {
  const eventHandlers = useMemo(
    () => ({
      dragend(e: L.DragEndEvent) {
        const marker = e.target;
        if (marker != null) {
          const position = marker.getLatLng();
          onLocationChange(position.lat, position.lng);
        }
      },
    }),
    [onLocationChange]
  );

  return (
    <div className="h-[280px] w-full rounded-xl overflow-hidden border border-slate-300 z-0">
      <MapContainer center={[lat, lng]} zoom={14} scrollWheelZoom={false} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapEventsHandler onLocationChange={onLocationChange} />
        <Marker
          position={[lat, lng]}
          icon={customPinIcon}
          draggable={true}
          eventHandlers={eventHandlers}
        />
      </MapContainer>
    </div>
  );
};
