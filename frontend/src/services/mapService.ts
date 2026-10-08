// DEMO DATA — replace with real API

export interface WardBoundary {
  id: string;
  name: string;
  code: string;
  centerLat: number;
  centerLng: number;
  color: string;
}

export interface IMapService {
  getCenterCoordinates(): { lat: number; lng: number; zoom: number };
  getWards(): Promise<WardBoundary[]>;
}

const MUMBAI_WARDS: WardBoundary[] = [
  {
    id: 'ward-hwest',
    name: 'Ward H/West (Bandra)',
    code: 'HW',
    centerLat: 19.0596,
    centerLng: 72.8295,
    color: '#2563eb',
  },
  {
    id: 'ward-kwest',
    name: 'Ward K/West (Andheri)',
    code: 'KW',
    centerLat: 19.1197,
    centerLng: 72.8464,
    color: '#0891b2',
  },
  {
    id: 'ward-a',
    name: 'Ward A (Colaba)',
    code: 'A',
    centerLat: 18.922,
    centerLng: 72.8347,
    color: '#4f46e5',
  },
  {
    id: 'ward-gnorth',
    name: 'Ward G/North (Dadar)',
    code: 'GN',
    centerLat: 19.0178,
    centerLng: 72.8478,
    color: '#059669',
  },
];

class DemoMapService implements IMapService {
  getCenterCoordinates(): { lat: number; lng: number; zoom: number } {
    return {
      lat: 19.076,
      lng: 72.8777,
      zoom: 12,
    };
  }

  async getWards(): Promise<WardBoundary[]> {
    return MUMBAI_WARDS;
  }
}

export const mapService = new DemoMapService();
