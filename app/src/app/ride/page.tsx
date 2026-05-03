"use client";

import { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useToastStore, useAddressStore } from "@/lib/store";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";
import { getDirections, formatEta } from "@/lib/mapbox/directions";
import { ScheduleModal } from "@/components/ScheduleModal";

const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

const rideTypes = [
  { name: "GoRide", emoji: "🚗", price: 55, eta: "4 min · 1-3 pax" },
  { name: "GoPremium", emoji: "🚙", price: 85, eta: "6 min · 1-4 pax" },
  { name: "GoXL", emoji: "🚐", price: 110, eta: "8 min · 5-7 pax" },
];

export default function RidePage() {
  const [selected, setSelected] = useState(0);
  const showToast = useToastStore((s) => s.show);
  const defaultAddress = useAddressStore((s) => s.getDefault);
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduledTime, setScheduledTime] = useState<{ date: string; time: string } | null>(null);
  const [destination, setDestination] = useState("");
  const [destCoords, setDestCoords] = useState<[number, number] | null>(null);
  const [routeGeometry, setRouteGeometry] = useState<GeoJSON.LineString | null>(null);
  const [routeEta, setRouteEta] = useState<string | null>(null);
  const ride = rideTypes[selected];
  const addr = defaultAddress();

  const pickupCoords: [number, number] = [20.0507, -34.7731];

  const handleDestinationChange = async (address: string, coords?: [number, number]) => {
    setDestination(address);
    if (coords) {
      setDestCoords(coords);
      const result = await getDirections(pickupCoords, coords);
      if (result) {
        setRouteGeometry(result.geometry);
        setRouteEta(formatEta(result.duration));
      }
    }
  };

  const mapPins = [
    { lng: pickupCoords[0], lat: pickupCoords[1], color: "#1E9E5A", emoji: "📍", label: addr?.address || "Marine 127, Struisbaai" },
  ];
  if (destCoords) {
    mapPins.push({ lng: destCoords[0], lat: destCoords[1], color: "#0E9EC2", emoji: "🏁", label: destination });
  }

  return (
    <div>
      <div className="px-[18px] pt-2 pb-3.5">
        <h1 className="font-heading font-black text-[22px] tracking-tight">
          Book a <span className="text-primary">Ride</span>
        </h1>
      </div>

      {/* Live Mapbox map */}
      <div className="mx-[18px] rounded-[18px] overflow-hidden border border-bd mb-4 relative">
        <MapView
          className="h-[180px] w-full"
          center={destCoords ? [(pickupCoords[0] + destCoords[0]) / 2, (pickupCoords[1] + destCoords[1]) / 2] : pickupCoords}
          zoom={destCoords ? 12 : 14}
          pins={mapPins}
          route={routeGeometry}
        />
        {routeEta && (
          <div className="absolute top-3 right-3.5 bg-primary/90 backdrop-blur rounded-xl px-3.5 py-2">
            <div className="font-heading font-extrabold text-[13px] text-white">{routeEta}</div>
            <div className="text-[10px] text-white/80">Estimated trip</div>
          </div>
        )}
        {!routeEta && (
          <div className="absolute top-3 right-3.5 bg-primary/90 backdrop-blur rounded-xl px-3.5 py-2">
            <div className="font-heading font-extrabold text-[13px] text-white">3 min away</div>
            <div className="text-[10px] text-white/80">Nearest driver</div>
          </div>
        )}
      </div>

      {/* Address inputs */}
      <div className="mx-[18px] bg-dark2 border border-bd rounded-[18px] p-4 mb-3">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-3 h-3 rounded-full bg-primary" />
          <div className="font-heading font-semibold text-sm text-t1 flex-1">{addr?.address || "Marine 127, Struisbaai"}</div>
        </div>
        <div className="w-[1.5px] h-2 bg-bd2 ml-[5px] mb-2" />
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-sea shrink-0" />
          <AddressAutocomplete
            value={destination}
            onChange={handleDestinationChange}
            placeholder="Where to?"
            className="flex-1"
          />
        </div>
      </div>

      {/* Ride types */}
      <div className="px-[18px]">
        <h2 className="font-heading font-black text-base mb-3">Choose ride type</h2>
        <div className="flex gap-3 mb-4">
          {rideTypes.map((rt, i) => (
            <button
              key={rt.name}
              onClick={() => setSelected(i)}
              className={`flex-1 bg-dark2 border rounded-[18px] p-3.5 text-center transition-all ${
                selected === i ? "border-primary bg-primary/[0.06]" : "border-bd"
              }`}
            >
              <div className="text-2xl mb-1.5">{rt.emoji}</div>
              <div className="font-heading font-bold text-xs">{rt.name}</div>
              <div className="font-heading font-black text-primary text-sm mt-0.5">R{rt.price}</div>
              <div className="text-[10px] text-t2 mt-1">{rt.eta}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Driver card */}
      <div className="mx-[18px] bg-dark2 border border-bd rounded-[18px] p-4 flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-full bg-dark3 flex items-center justify-center text-2xl">👤</div>
        <div className="flex-1">
          <div className="font-heading font-bold text-sm">Sipho Ndlovu</div>
          <div className="text-xs text-t2">★ 4.93 <span className="font-normal">(847 trips)</span></div>
          <div className="text-[10px] text-t3 mt-0.5">CA 234 567</div>
        </div>
        <div className="flex gap-2">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center">📞</div>
          <Link href="/chat" className="w-10 h-10 rounded-xl bg-sea/10 border border-sea/25 flex items-center justify-center">💬</Link>
        </div>
      </div>

      {/* Schedule */}
      <div className="mx-[18px] bg-dark2 border border-bd rounded-[18px] p-3.5 flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm">📅</span>
          <span className="font-heading font-bold text-xs">
            {scheduledTime ? `${scheduledTime.date} at ${scheduledTime.time}` : "Now — ride ASAP"}
          </span>
        </div>
        <button
          onClick={() => setShowSchedule(true)}
          className="text-primary font-heading font-bold text-xs"
        >
          {scheduledTime ? "Change" : "Schedule"}
        </button>
      </div>

      <div className="px-[18px] pb-24">
        <button
          onClick={() => showToast(
            scheduledTime
              ? `✓ ${ride.name} scheduled for ${scheduledTime.date} at ${scheduledTime.time}`
              : `✓ Booking ${ride.name} — Driver Sipho is 3 min away`
          )}
          className="w-full bg-primary text-white font-heading font-extrabold text-base rounded-2xl py-[17px] active:bg-primary-dark active:scale-[0.98] transition-all"
        >
          {scheduledTime ? `Schedule ${ride.name}` : `Book ${ride.name}`} · R{ride.price}
        </button>
      </div>

      <ScheduleModal
        open={showSchedule}
        onClose={() => setShowSchedule(false)}
        title="Schedule Ride"
        onConfirm={(date, time) => {
          setScheduledTime({ date, time });
          setShowSchedule(false);
          showToast(`✓ Ride scheduled for ${date} at ${time}`);
        }}
      />
    </div>
  );
}
