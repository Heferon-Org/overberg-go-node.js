"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

interface Pin {
  lng: number;
  lat: number;
  color: string;
  label?: string;
  emoji?: string;
  pulse?: boolean;
}

interface MapViewProps {
  center?: [number, number];
  zoom?: number;
  pins?: Pin[];
  route?: GeoJSON.LineString | null;
  className?: string;
  interactive?: boolean;
  onMapLoad?: (map: mapboxgl.Map) => void;
}

export default function MapView({
  center = [20.05, -34.72],
  zoom = 12,
  pins = [],
  route = null,
  className = "",
  interactive = true,
  onMapLoad,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    if (!containerRef.current || !MAPBOX_TOKEN) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/light-v11",
      center,
      zoom,
      interactive,
      attributionControl: false,
    });

    mapRef.current = map;

    map.on("load", () => {
      onMapLoad?.(map);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    pins.forEach((pin) => {
      const el = document.createElement("div");
      el.style.width = "32px";
      el.style.height = "32px";
      el.style.borderRadius = "50%";
      el.style.backgroundColor = pin.color;
      el.style.border = "3px solid white";
      el.style.boxShadow = "0 2px 8px rgba(0,0,0,0.25)";
      el.style.display = "flex";
      el.style.alignItems = "center";
      el.style.justifyContent = "center";
      el.style.fontSize = "14px";
      if (pin.pulse) {
        el.style.animation = "pulse 1.5s ease-in-out infinite";
      }
      if (pin.emoji) {
        el.textContent = pin.emoji;
      }

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([pin.lng, pin.lat])
        .addTo(map);

      if (pin.label) {
        marker.setPopup(new mapboxgl.Popup({ offset: 20, closeButton: false }).setText(pin.label));
      }

      markersRef.current.push(marker);
    });
  }, [pins]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const addRoute = () => {
      if (map.getSource("route")) {
        (map.getSource("route") as mapboxgl.GeoJSONSource).setData({
          type: "Feature",
          properties: {},
          geometry: route!,
        });
      } else {
        map.addSource("route", {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: route!,
          },
        });
        map.addLayer({
          id: "route",
          type: "line",
          source: "route",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-color": "#1E9E5A",
            "line-width": 4,
            "line-opacity": 0.8,
          },
        });
      }
    };

    if (!route) {
      if (map.getLayer("route")) map.removeLayer("route");
      if (map.getSource("route")) map.removeSource("route");
      return;
    }

    if (map.isStyleLoaded()) {
      addRoute();
    } else {
      map.on("load", addRoute);
    }
  }, [route]);

  if (!MAPBOX_TOKEN) {
    return (
      <div className={`bg-gradient-to-br from-[#e8f4f8] to-[#f0f7fa] flex items-center justify-center ${className}`}>
        <span className="text-t3 text-xs font-heading">Map unavailable</span>
      </div>
    );
  }

  return <div ref={containerRef} className={className} />;
}
