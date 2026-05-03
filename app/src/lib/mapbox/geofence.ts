const CAPE_AGULHAS_BOUNDS = {
  latMin: -34.87,
  latMax: -34.40,
  lngMin: 19.90,
  lngMax: 20.30,
} as const;

export function isWithinServiceArea(lat: number, lng: number): boolean {
  return (
    lat >= CAPE_AGULHAS_BOUNDS.latMin &&
    lat <= CAPE_AGULHAS_BOUNDS.latMax &&
    lng >= CAPE_AGULHAS_BOUNDS.lngMin &&
    lng <= CAPE_AGULHAS_BOUNDS.lngMax
  );
}

export const SERVICE_AREA_CENTER: [number, number] = [20.05, -34.72];

export const SERVICE_AREA_BBOX: [number, number, number, number] = [
  CAPE_AGULHAS_BOUNDS.lngMin,
  CAPE_AGULHAS_BOUNDS.latMin,
  CAPE_AGULHAS_BOUNDS.lngMax,
  CAPE_AGULHAS_BOUNDS.latMax,
];
