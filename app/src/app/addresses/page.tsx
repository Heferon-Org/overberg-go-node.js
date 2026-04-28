"use client";

import { useState } from "react";
import Link from "next/link";
import { useAddressStore, useToastStore } from "@/lib/store";

export default function AddressesPage() {
  const { addresses, addAddress, removeAddress, setDefault } = useAddressStore();
  const showToast = useToastStore((s) => s.show);
  const [showAdd, setShowAdd] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newEmoji, setNewEmoji] = useState("📍");

  const emojiOptions = ["🏠", "💼", "🏖️", "🏫", "🏥", "🏋️", "⛪", "📍"];

  const handleAdd = () => {
    if (!newLabel.trim() || !newAddress.trim()) {
      showToast("Fill in all fields");
      return;
    }
    addAddress({
      label: newLabel.trim(),
      address: newAddress.trim(),
      emoji: newEmoji,
      isDefault: addresses.length === 0,
    });
    showToast(`✓ ${newLabel} added`);
    setNewLabel("");
    setNewAddress("");
    setNewEmoji("📍");
    setShowAdd(false);
  };

  return (
    <div>
      <div className="flex items-center gap-3 px-[18px] pt-3 pb-4">
        <Link
          href="/settings"
          className="w-10 h-10 rounded-[14px] bg-dark3 border border-bd flex items-center justify-center text-lg shrink-0"
        >
          ←
        </Link>
        <h1 className="font-heading font-black text-lg">Saved Addresses</h1>
        <button
          onClick={() => setShowAdd(true)}
          className="ml-auto w-10 h-10 rounded-[14px] bg-primary/10 border border-primary/25 flex items-center justify-center text-primary font-bold text-lg"
        >
          +
        </button>
      </div>

      <div className="px-[18px] pb-24">
        <div className="space-y-2.5">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`bg-dark2 border rounded-[18px] p-4 ${
                addr.isDefault ? "border-primary/30 bg-primary/[0.03]" : "border-bd"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-dark3 flex items-center justify-center text-lg">
                  {addr.emoji}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-heading font-bold text-sm">{addr.label}</span>
                    {addr.isDefault && (
                      <span className="bg-primary/10 text-primary text-[9px] font-heading font-bold px-2 py-0.5 rounded-full border border-primary/25">
                        Default
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-t2 mt-0.5">{addr.address}</div>
                </div>
              </div>
              <div className="flex gap-2 mt-3 ml-[52px]">
                {!addr.isDefault && (
                  <button
                    onClick={() => {
                      setDefault(addr.id);
                      showToast(`✓ ${addr.label} set as default`);
                    }}
                    className="text-primary text-[11px] font-heading font-bold"
                  >
                    Set default
                  </button>
                )}
                <button
                  onClick={() => showToast("Edit — coming soon")}
                  className="text-t2 text-[11px] font-heading font-bold"
                >
                  Edit
                </button>
                {!addr.isDefault && (
                  <button
                    onClick={() => {
                      removeAddress(addr.id);
                      showToast("Address removed");
                    }}
                    className="text-coral text-[11px] font-heading font-bold"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {addresses.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">📍</div>
            <div className="font-heading font-bold text-sm text-t2">No saved addresses</div>
            <button
              onClick={() => setShowAdd(true)}
              className="text-primary font-heading font-bold text-xs mt-2"
            >
              Add your first address
            </button>
          </div>
        )}
      </div>

      {/* Add modal */}
      {showAdd && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-end justify-center"
          onClick={() => setShowAdd(false)}
        >
          <div
            className="bg-white border-t border-bd rounded-t-3xl w-full max-w-lg p-6 pb-10 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-black/15 rounded-full mx-auto mb-5" />
            <h2 className="font-heading font-black text-lg mb-4">Add Address</h2>

            <label className="font-heading font-bold text-xs text-t2 block mb-2">Icon</label>
            <div className="flex gap-2 mb-4">
              {emojiOptions.map((e) => (
                <button
                  key={e}
                  onClick={() => setNewEmoji(e)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all ${
                    newEmoji === e
                      ? "bg-primary/10 border-2 border-primary/40"
                      : "bg-dark3 border border-bd"
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>

            <label className="font-heading font-bold text-xs text-t2 block mb-2">Label</label>
            <input
              type="text"
              placeholder="e.g. Home, Work, Gym"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              className="w-full bg-dark3 border border-bd rounded-xl px-3 py-3 text-sm text-t1 placeholder:text-t3 outline-none focus:border-primary/40 transition-colors mb-4"
            />

            <label className="font-heading font-bold text-xs text-t2 block mb-2">Address</label>
            <input
              type="text"
              placeholder="Full address"
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
              className="w-full bg-dark3 border border-bd rounded-xl px-3 py-3 text-sm text-t1 placeholder:text-t3 outline-none focus:border-primary/40 transition-colors mb-4"
            />

            <button
              onClick={handleAdd}
              className="w-full bg-primary text-white font-heading font-bold text-sm py-3.5 rounded-2xl active:bg-primary-dark transition-colors"
            >
              Save Address
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
