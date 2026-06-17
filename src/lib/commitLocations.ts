// Tirana is the densest cluster — the rest are invented + scattered around
// notable cities I've shipped from / shipped to.
export interface CommitDot {
  lat: number;
  lon: number;
  weight: number;
  label: string;
}

export const COMMIT_LOCATIONS: CommitDot[] = [
  { lat: 41.3275, lon: 19.8189, weight: 1.0, label: 'Tirana' },
  { lat: 41.327, lon: 19.82, weight: 0.9, label: 'Tirana' },
  { lat: 41.328, lon: 19.815, weight: 0.8, label: 'Tirana' },
  { lat: 41.325, lon: 19.825, weight: 0.7, label: 'Tirana' },
  { lat: 42.65, lon: 21.16, weight: 0.5, label: 'Prishtina' },
  { lat: 40.7128, lon: -74.006, weight: 0.4, label: 'New York' },
  { lat: 37.7749, lon: -122.4194, weight: 0.4, label: 'San Francisco' },
  { lat: 51.5072, lon: -0.1276, weight: 0.5, label: 'London' },
  { lat: 52.52, lon: 13.405, weight: 0.4, label: 'Berlin' },
  { lat: 35.6762, lon: 139.6503, weight: 0.3, label: 'Tokyo' },
  { lat: 1.3521, lon: 103.8198, weight: 0.3, label: 'Singapore' },
  { lat: -33.8688, lon: 151.2093, weight: 0.3, label: 'Sydney' },
  { lat: 41.9028, lon: 12.4964, weight: 0.4, label: 'Rome' },
  { lat: 48.8566, lon: 2.3522, weight: 0.4, label: 'Paris' },
];

// Convert (lat, lon) to a 3D point on a unit sphere.
export function latLonToVec3(lat: number, lon: number, radius = 1): [number, number, number] {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return [x, y, z];
}
