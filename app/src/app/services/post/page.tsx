"use client";

import { useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isNative, isPluginAvailable } from "@/lib/capacitor";

const CATEGORIES = [
  { value: "plumber", emoji: "🔧", label: "Plumber" },
  { value: "electrician", emoji: "⚡", label: "Electrician" },
  { value: "painter", emoji: "🎨", label: "Painter" },
  { value: "gardener", emoji: "🌱", label: "Gardener" },
  { value: "cleaner", emoji: "🧹", label: "Cleaner" },
  { value: "handyman", emoji: "🔨", label: "Handyman" },
  { value: "locksmith", emoji: "🔑", label: "Locksmith" },
  { value: "pest_control", emoji: "🐛", label: "Pest Control" },
  { value: "moving", emoji: "🚚", label: "Moving" },
  { value: "appliance_repair", emoji: "🔌", label: "Appliance Repair" },
  { value: "other", emoji: "📋", label: "Other" },
];

export default function PostServicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [scheduledFor, setScheduledFor] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [posting, setPosting] = useState(false);

  async function handleAddPhoto() {
    if (isNative() && isPluginAvailable("Camera")) {
      try {
        const { Camera, CameraResultType, CameraSource } = await import("@capacitor/camera");
        const photo = await Camera.getPhoto({
          quality: 70,
          resultType: CameraResultType.Base64,
          source: CameraSource.Prompt,
          width: 1200,
        });
        if (photo.base64String) {
          setUploading(true);
          const fileName = `svc_${Date.now()}.${photo.format}`;
          const raw = atob(photo.base64String);
          const arr = new Uint8Array(raw.length);
          for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
          const { data, error } = await supabase.storage
            .from("service-photos")
            .upload(fileName, arr, { contentType: `image/${photo.format}` });
          if (!error && data) {
            const { data: urlData } = supabase.storage.from("service-photos").getPublicUrl(data.path);
            setPhotos((prev) => [...prev, urlData.publicUrl]);
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
    const fileName = `svc_${Date.now()}.${file.name.split(".").pop()}`;
    const { data, error } = await supabase.storage
      .from("service-photos")
      .upload(fileName, file);
    if (!error && data) {
      const { data: urlData } = supabase.storage.from("service-photos").getPublicUrl(data.path);
      setPhotos((prev) => [...prev, urlData.publicUrl]);
    }
    setUploading(false);
  }

  async function handlePost() {
    if (!category || !title || !budgetMax || !address) return;
    setPosting(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setPosting(false); return; }

    const biddingCloses = new Date();
    biddingCloses.setHours(biddingCloses.getHours() + 24);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from("service_requests") as any).insert({
      customer_id: user.id,
      category,
      title,
      description: description || null,
      photos,
      address,
      budget_min_cents: budgetMin ? parseInt(budgetMin) * 100 : 0,
      budget_max_cents: parseInt(budgetMax) * 100,
      scheduled_for: scheduledFor ? new Date(scheduledFor).toISOString() : null,
      status: "open",
      bidding_closes_at: biddingCloses.toISOString(),
    }).select("id").single();

    if (!error && data) {
      router.push(`/services/${(data as { id: string }).id}`);
    }
    setPosting(false);
  }

  return (
    <div className="px-4 pt-6 pb-24">
      <button onClick={() => router.back()} className="text-sm text-primary mb-4">&larr; Back</button>
      <h1 className="text-2xl font-display font-bold mb-1">Post a Task</h1>
      <p className="text-sm text-t3 mb-6">Describe what you need — providers will bid</p>

      <div className="space-y-5">
        <div>
          <label className="text-sm font-medium mb-2 block">Category</label>
          <div className="grid grid-cols-4 gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                className={`p-2 rounded-xl text-center border-2 transition-colors ${
                  category === cat.value ? "border-primary bg-primary/5" : "border-gray-100"
                }`}
              >
                <p className="text-lg">{cat.emoji}</p>
                <p className="text-xs mt-0.5">{cat.label}</p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Fix leaking kitchen tap"
            className="w-full px-4 py-3 rounded-xl bg-gray-100 text-sm"
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the work needed in detail..."
            rows={3}
            className="w-full px-4 py-3 rounded-xl bg-gray-100 text-sm resize-none"
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">Location</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g. 12 Main Road, Hermanus"
            className="w-full px-4 py-3 rounded-xl bg-gray-100 text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium mb-1 block">Min Budget (R)</label>
            <input
              type="number"
              value={budgetMin}
              onChange={(e) => setBudgetMin(e.target.value)}
              placeholder="e.g. 200"
              className="w-full px-4 py-3 rounded-xl bg-gray-100 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Max Budget (R)</label>
            <input
              type="number"
              value={budgetMax}
              onChange={(e) => setBudgetMax(e.target.value)}
              placeholder="e.g. 500"
              className="w-full px-4 py-3 rounded-xl bg-gray-100 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">Preferred Date (optional)</label>
          <input
            type="datetime-local"
            value={scheduledFor}
            onChange={(e) => setScheduledFor(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-gray-100 text-sm"
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Photos (optional)</label>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          <div className="flex gap-2 flex-wrap">
            {photos.map((url, i) => (
              <img key={i} src={url} alt="" className="w-16 h-16 rounded-xl object-cover" />
            ))}
            <button
              onClick={handleAddPhoto}
              disabled={uploading || photos.length >= 5}
              className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center text-xl text-t3 disabled:opacity-50"
            >
              {uploading ? "..." : "+"}
            </button>
          </div>
        </div>
      </div>

      <button
        onClick={handlePost}
        disabled={posting || !category || !title || !budgetMax || !address}
        className="w-full mt-8 py-3.5 bg-primary text-white rounded-2xl font-semibold disabled:opacity-50"
      >
        {posting ? "Posting..." : "Post Task — Get Bids"}
      </button>
    </div>
  );
}
