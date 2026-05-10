"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isNative, isPluginAvailable } from "@/lib/capacitor";
import { useCartStore } from "@/lib/store";

type PharmacyItem = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  emoji: string | null;
  category: string;
  available: boolean;
};

export default function PharmacyMerchantPage() {
  const { merchantId } = useParams<{ merchantId: string }>();
  const router = useRouter();
  const supabase = createClient();
  const [merchant, setMerchant] = useState<{ name: string; emoji: string | null } | null>(null);
  const [items, setItems] = useState<PharmacyItem[]>([]);
  const [prescriptionUrl, setPrescriptionUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    supabase
      .from("merchants")
      .select("name, emoji")
      .eq("id", merchantId)
      .single()
      .then(({ data }) => { if (data) setMerchant(data); });

    supabase
      .from("menu_items")
      .select("id, name, description, price, emoji, category, available")
      .eq("restaurant_id", merchantId)
      .eq("available", true)
      .order("category")
      .order("sort_order")
      .then(({ data }) => { if (data) setItems(data); });
  }, [merchantId, supabase]);

  async function handlePrescriptionUpload() {
    if (isNative() && isPluginAvailable("Camera")) {
      try {
        const { Camera, CameraResultType, CameraSource } = await import("@capacitor/camera");
        const photo = await Camera.getPhoto({
          quality: 80,
          resultType: CameraResultType.Base64,
          source: CameraSource.Prompt,
          width: 1200,
        });
        if (photo.base64String) {
          setUploading(true);
          const fileName = `rx_${Date.now()}.${photo.format}`;
          const { data, error } = await supabase.storage
            .from("prescriptions")
            .upload(fileName, decode(photo.base64String), {
              contentType: `image/${photo.format}`,
            });
          if (!error && data) {
            const { data: urlData } = supabase.storage.from("prescriptions").getPublicUrl(data.path);
            setPrescriptionUrl(urlData.publicUrl);
          }
          setUploading(false);
        }
      } catch {
        setUploading(false);
      }
    } else {
      fileRef.current?.click();
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fileName = `rx_${Date.now()}.${file.name.split(".").pop()}`;
    const { data, error } = await supabase.storage
      .from("prescriptions")
      .upload(fileName, file);
    if (!error && data) {
      const { data: urlData } = supabase.storage.from("prescriptions").getPublicUrl(data.path);
      setPrescriptionUrl(urlData.publicUrl);
    }
    setUploading(false);
  }

  function handleAddToCart(item: PharmacyItem) {
    addItem({
      id: item.id,
      name: item.name,
      price: item.price,
      emoji: item.emoji || "💊",
      restaurantId: merchantId,
      restaurantName: merchant?.name || "Pharmacy",
    });
  }

  const categories = [...new Set(items.map((i) => i.category))];

  return (
    <div className="px-4 pt-6 pb-24">
      <button onClick={() => router.back()} className="text-sm text-primary mb-4">
        &larr; Back
      </button>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-2xl">
          {merchant?.emoji || "💊"}
        </div>
        <h1 className="text-xl font-display font-bold">{merchant?.name || "Pharmacy"}</h1>
      </div>

      <div className="bg-blue-50 rounded-2xl p-4 mb-6">
        <h3 className="font-semibold text-sm mb-2">Have a prescription?</h3>
        <p className="text-xs text-t3 mb-3">Upload your prescription and our pharmacist will verify it before dispatch.</p>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
        <button
          onClick={handlePrescriptionUpload}
          disabled={uploading}
          className="w-full py-2.5 bg-primary text-white rounded-xl text-sm font-semibold disabled:opacity-50"
        >
          {uploading ? "Uploading..." : prescriptionUrl ? "Prescription Uploaded ✓" : "Upload Prescription"}
        </button>
        {prescriptionUrl && (
          <p className="text-xs text-green-600 mt-2 text-center">Prescription will be verified by the pharmacy</p>
        )}
      </div>

      {categories.map((cat) => (
        <div key={cat} className="mb-6">
          <h2 className="font-semibold text-sm text-t3 uppercase tracking-wide mb-3">{cat}</h2>
          <div className="space-y-2">
            {items
              .filter((i) => i.category === cat)
              .map((item) => (
                <div key={item.id} className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 p-3">
                  <div className="text-xl">{item.emoji || "💊"}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.name}</p>
                    {item.description && <p className="text-xs text-t3 truncate">{item.description}</p>}
                    <p className="text-sm font-semibold text-primary mt-0.5">R{item.price.toFixed(2)}</p>
                  </div>
                  <button
                    onClick={() => handleAddToCart(item)}
                    className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-lg"
                  >
                    +
                  </button>
                </div>
              ))}
          </div>
        </div>
      ))}

      <button
        onClick={() => router.push("/pharmacy/cart")}
        className="fixed bottom-24 left-4 right-4 py-3 bg-primary text-white rounded-2xl font-semibold text-center shadow-lg"
      >
        View Cart
      </button>
    </div>
  );
}

function decode(base64: string): Uint8Array {
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}
