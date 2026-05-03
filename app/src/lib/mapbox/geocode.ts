import { SERVICE_AREA_BBOX } from "./geofence";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export interface GeocodeSuggestion {
  id: string;
  place_name: string;
  center: [number, number];
  text: string;
}

export async function geocodeSearch(query: string): Promise<GeocodeSuggestion[]> {
  if (!MAPBOX_TOKEN || query.length < 3) return [];

  const bbox = SERVICE_AREA_BBOX.join(",");
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&bbox=${bbox}&country=ZA&limit=5&types=address,poi,place,locality`;

  const res = await fetch(url);
  if (!res.ok) return [];

  const data = await res.json();
  return (data.features || []).map((f: { id: string; place_name: string; center: [number, number]; text: string }) => ({
    id: f.id,
    place_name: f.place_name,
    center: f.center,
    text: f.text,
  }));
}

export async function reverseGeocode(lng: number, lat: number): Promise<string | null> {
  if (!MAPBOX_TOKEN) return null;

  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&types=address&limit=1`;

  const res = await fetch(url);
  if (!res.ok) return null;

  const data = await res.json();
  return data.features?.[0]?.place_name || null;
}
