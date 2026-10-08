import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { issueService } from '../../services/issueService';
import { mapService } from '../../services/mapService';
import { Issue } from '../../types';
import { IssueStatusBadge } from '../common/IssueStatusBadge';
import { DemoBadge } from '../common/DemoBadge';
import { MapPin } from 'lucide-react';

// Custom SVG marker for crisp map rendering without missing asset warnings
const createCategoryIcon = (category: string) => {
  let color = '#2563eb'; // blue
  if (category.includes('Water')) color = '#0284c7';
  if (category.includes('Garbage')) color = '#d97706';
  if (category.includes('Light')) color = '#eab308';
  if (category.includes('Drain')) color = '#4f46e5';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="32" height="32" stroke="#ffffff" stroke-width="1.5"><path d="M12 0C7.58 0 4 3.58 4 8c0 5.25 8 13 8 13s8-7.75 8-13c0-4.42-3.58-8-8-8zm0 11c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z"/></svg>`;

  return L.divIcon({
    html: svg,
    className: 'custom-leaflet-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

export const DemoMapPreview: React.FC = () => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const center = mapService.getCenterCoordinates();

  useEffect(() => {
    issueService.getIssues().then(setIssues);
  }, []);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 shadow-md">
      <div className="absolute top-3 right-3 z-10 bg-white/90 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 shadow-sm flex items-center gap-2">
        <MapPin className="w-3.5 h-3.5 text-blue-700" />
        Interactive City Map Preview
        <DemoBadge label="Demo Map" />
      </div>

      <div className="h-[420px] w-full z-0">
        <MapContainer
          center={[center.lat, center.lng]}
          zoom={11}
          scrollWheelZoom={false}
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {issues.map((iss) => (
            <Marker
              key={iss.id}
              position={[iss.report.latitude, iss.report.longitude]}
              icon={createCategoryIcon(iss.report.category)}
            >
              <Popup className="civic-map-popup">
                <div className="p-1 space-y-1.5 max-w-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono text-slate-500">{iss.trackingNumber}</span>
                    <IssueStatusBadge status={iss.status} size="sm" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 leading-tight">
                    {iss.report.title}
                  </h4>
                  <p className="text-[11px] text-slate-600 line-clamp-2">
                    {iss.report.description}
                  </p>
                  <div className="text-[10px] text-slate-500 font-medium pt-1 border-t border-slate-100 flex justify-between">
                    <span>{iss.report.ward}</span>
                    <span className="text-blue-700 font-semibold">{iss.report.category}</span>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
};
