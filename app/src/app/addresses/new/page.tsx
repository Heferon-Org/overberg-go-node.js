"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";
import { isWithinServiceArea } from "@/lib/mapbox/geofence";
import { useAddressStore, useToastStore } from "@/lib/store";

const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

const emojiOptions = ["🏠", "💼", "🏖️", "🏫", "🏥", "🏋️", "⛪", "📍"];

export default function NewAddressPage() {
  const router = useRouter();
  const addAddress = useAddressStore((s) => s.addAddress);
  const addresses = useAddressStore((s) => s.addresses);
  const showToast = useToastStore((s) => s.show);

  const [label, setLabel] = useState("");
  const [address, setAddress] = useState("");
  const [emoji, setEmoji] = useState("📍");
  const [coords, setCoords] = useState<[number, number] | null>(null);
  const [outsideArea, setOutsideArea] = useState(false);

  const handleAddressChange = useCallback((addr: string, center?: [number, number]) => {
    setAddress(addr);
    if (center) {
      setCoords(center);
      setOutsideArea(!isWithinServiceArea(center[1], center[0]));
    }
  }, []);

  const handleSave = () => {
    if (!label.trim() || !address.trim()) {
      showToast("Fill in all fields");
      return;
    }
    if (outsideArea) {
      showToast("Address is outside our service area");
      return;
    }
    addAddress({
      label: label.trim(),
      address: address.trim(),
      emoji,
      isDefault: addresses.length === 0,
    });
    showToast(`✓ ${label} saved`);
    router.push("/addresses");
  };

  return (
    <div className="pb-24">
      <div className="flex items-center gap-3 px-[18px] pt-3 pb-4">
        <Link
          href="/addresses"
          className="w-10 h-10 rounded-[14px] bg-dark3 border border-bd flex items-center justify-center text-lg shrink-0"
        >
          ←
        </Link>
        <h1 className="font-heading font-black text-lg">New Address</h1>
      </div>

      <div className="mx-[18px] rounded-[18px] overflow-hidden border border-bd mb-4">
        <MapView
          className="h-[200px] w-full"
          center={coords ? [coords[0], coords[1]] : [20.05, -34.72]}
          zoom={coords ? 15 : 12}
          pins={
            coords
              ? [
                  {
                    lng: coords[0],
                    lat: coords[1],
                    color: outsideArea ? "#E8503A" : "#1E9E5A",
                    emoji: emoji,
                    label: label || "Selected location",
                  },
                ]
              : []
          }
          interactive={false}
        />
      </div>

      {outsideArea && (
        <div className="mx-[18px] mb-4 bg-coral/10 border border-coral/25 rounded-xl p-3 flex items-center gap-2">
          <span className="text-sm">⚠️</span>
          <span className="text-xs text-coral font-heading font-bold">
            This address is outside our service area (Cape Agulhas Municipality)
          </span>
        </div>
      )}

      <div className="px-[18px] space-y-4">
        <div>
          <label className="font-heading font-bold text-xs text-t2 block mb-2">Icon</label>
          <div className="flex gap-2">
            {emojiOptions.map((e) => (
              <button
                key={e}
                onClick={() => setEmoji(e)}
                className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all ${
                  emoji === e
                    ? "bg-primary/10 border-2 border-primary/40"
                    : "bg-dark3 border border-bd"
                }`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="font-heading font-bold text-xs text-t2 block mb-2">Label</label>
          <input
            type="text"
            placeholder="e.g. Home, Work, Gym"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full bg-dark3 border border-bd rounded-xl px-3 py-3 text-sm text-t1 placeholder:text-t3 outline-none focus:border-primary/40 transition-colors"
          />
        </div>

        <div>
          <label className="font-heading font-bold text-xs text-t2 block mb-2">Address</label>
          <AddressAutocomplete
            value={address}
            onChange={handleAddressChange}
            placeholder="Search for address..."
          />
        </div>

        <button
          onClick={handleSave}
          disabled={outsideArea}
          className={`w-full font-heading font-bold text-sm py-3.5 rounded-2xl transition-colors ${
            outsideArea
              ? "bg-dark3 text-t3 cursor-not-allowed"
              : "bg-primary text-white active:bg-primary-dark"
          }`}
        >
          Save Address
        </button>
      </div>
    </div>
  );
}
