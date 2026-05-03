const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export interface DirectionsResult {
  duration: number;
  distance: number;
  geometry: GeoJSON.LineString;
}

export async function getDirections(
  origin: [number, number],
  destination: [number, number]
): Promise<DirectionsResult | null> {
  if (!MAPBOX_TOKEN) return null;

  const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${origin[0]},${origin[1]};${destination[0]},${destination[1]}?geometries=geojson&overview=full&access_token=${MAPBOX_TOKEN}`;

  const res = await fetch(url);
  if (!res.ok) return null;

  const data = await res.json();
  const route = data.routes?.[0];
  if (!route) return null;

  return {
    duration: route.duration,
    distance: route.distance,
    geometry: route.geometry,
  };
}

export function formatEta(seconds: number): string {
  const mins = Math.ceil(seconds / 60);
  if (mins < 1) return "< 1 min";
  if (mins === 1) return "1 min";
  return `${mins} min`;
}
