"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToastStore } from "@/lib/store";

type DocType = "sa_id" | "drivers_license" | "vehicle_registration" | "vehicle_photo" | "insurance";

const requiredDocs: { type: DocType; label: string; emoji: string; desc: string }[] = [
  { type: "sa_id", label: "SA ID Document", emoji: "🪪", desc: "Front and back of your South African ID" },
  { type: "drivers_license", label: "Driver's License", emoji: "🚗", desc: "Valid South African driving license" },
  { type: "vehicle_registration", label: "Vehicle Registration", emoji: "📋", desc: "Vehicle registration document" },
  { type: "vehicle_photo", label: "Vehicle Photo", emoji: "📸", desc: "Clear photo of your vehicle" },
  { type: "insurance", label: "Insurance Certificate", emoji: "🛡️", desc: "Vehicle insurance proof (optional)" },
];

export default function DriverKycPage() {
  const [uploads, setUploads] = useState<Record<string, { file: File; status: "pending" | "uploading" | "done" | "error" }>>({});
  const [submitting, setSubmitting] = useState(false);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const router = useRouter();
  const showToast = useToastStore((s) => s.show);

  const handleFileSelect = (docType: string, file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      showToast("File too large — max 10MB");
      return;
    }
    setUploads((prev) => ({ ...prev, [docType]: { file, status: "pending" } }));
  };

  const handleSubmit = async () => {
    const required = requiredDocs.filter((d) => d.type !== "insurance");
    const missing = required.filter((d) => !uploads[d.type]);
    if (missing.length > 0) {
      showToast(`Missing: ${missing.map((d) => d.label).join(", ")}`);
      return;
    }

    setSubmitting(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      showToast("Session expired");
      router.push("/auth");
      return;
    }

    let allOk = true;

    for (const [docType, upload] of Object.entries(uploads)) {
      setUploads((prev) => ({ ...prev, [docType]: { ...prev[docType], status: "uploading" } }));

      const ext = upload.file.name.split(".").pop();
      const path = `kyc/${user.id}/${docType}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("kyc-documents")
        .upload(path, upload.file, { upsert: true });

      if (uploadError) {
        setUploads((prev) => ({ ...prev, [docType]: { ...prev[docType], status: "error" } }));
        allOk = false;
        continue;
      }

      const { data: urlData } = supabase.storage.from("kyc-documents").getPublicUrl(path);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: dbError } = await supabase.from("kyc_documents").insert({
        user_id: user.id,
        applicant_role: "driver" as const,
        document_type: docType as DocType,
        file_url: urlData.publicUrl,
      } as any);

      if (dbError) {
        setUploads((prev) => ({ ...prev, [docType]: { ...prev[docType], status: "error" } }));
        allOk = false;
      } else {
        setUploads((prev) => ({ ...prev, [docType]: { ...prev[docType], status: "done" } }));
      }
    }

    setSubmitting(false);

    if (allOk) {
      showToast("✓ Documents submitted — we'll review within 24 hours");
      router.push("/driver");
    } else {
      showToast("Some uploads failed — please retry");
    }
  };

  return (
    <div className="min-h-dvh pb-10">
      {/* Header */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-bd z-40 px-[18px] py-3.5 flex items-center gap-3">
        <button onClick={() => router.back()} className="w-10 h-10 rounded-[14px] bg-dark2 border border-bd flex items-center justify-center text-lg">
          ←
        </button>
        <div>
          <h1 className="font-heading font-black text-lg">Driver Verification</h1>
          <p className="text-[11px] text-t2">Upload your documents to start driving</p>
        </div>
      </div>

      {/* Progress */}
      <div className="px-[18px] mt-4 mb-2">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-heading font-bold text-primary">
            {Object.values(uploads).filter((u) => u.status === "done").length}/{requiredDocs.length} uploaded
          </span>
        </div>
        <div className="h-1.5 bg-dark3 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-sea rounded-full transition-all"
            style={{ width: `${(Object.values(uploads).filter((u) => u.status === "done").length / requiredDocs.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Documents */}
      <div className="px-[18px] mt-4 space-y-3">
        {requiredDocs.map((doc) => {
          const upload = uploads[doc.type];
          const isOptional = doc.type === "insurance";

          return (
            <div
              key={doc.type}
              className={`border rounded-[16px] p-4 transition-all ${
                upload?.status === "done"
                  ? "bg-primary/[0.04] border-primary/20"
                  : upload?.status === "error"
                  ? "bg-coral/[0.04] border-coral/20"
                  : "bg-dark2 border-bd"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-[12px] bg-dark3 flex items-center justify-center text-lg flex-shrink-0">
                  {upload?.status === "done" ? "✅" : upload?.status === "uploading" ? "⏳" : upload?.status === "error" ? "❌" : doc.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-heading font-bold text-sm">{doc.label}</span>
                    {isOptional && (
                      <span className="text-[9px] font-heading font-bold text-t3 bg-dark3 px-2 py-0.5 rounded-full">OPTIONAL</span>
                    )}
                  </div>
                  <p className="text-[11px] text-t2 mt-0.5">{doc.desc}</p>
                  {upload && (
                    <p className="text-[10px] text-primary font-heading font-semibold mt-1 truncate">
                      {upload.file.name}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => fileRefs.current[doc.type]?.click()}
                  className={`px-3 py-1.5 rounded-xl text-xs font-heading font-bold transition-all flex-shrink-0 ${
                    upload
                      ? "bg-dark3 border border-bd text-t2"
                      : "bg-primary text-white"
                  }`}
                >
                  {upload ? "Change" : "Upload"}
                </button>
              </div>
              <input
                ref={(el) => { fileRefs.current[doc.type] = el; }}
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(doc.type, file);
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Info box */}
      <div className="mx-[18px] mt-5 p-4 bg-sea/[0.06] border border-sea/15 rounded-[16px]">
        <div className="flex items-start gap-2">
          <span className="text-lg">ℹ️</span>
          <div>
            <p className="font-heading font-bold text-xs">Verification takes 24–48 hours</p>
            <p className="text-[11px] text-t2 mt-0.5">
              We&apos;ll notify you by SMS when your documents have been reviewed. You can check status in your driver dashboard.
            </p>
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="px-[18px] mt-6">
        <button
          onClick={handleSubmit}
          disabled={submitting || Object.keys(uploads).length < 4}
          className="w-full bg-primary text-white font-heading font-extrabold text-base rounded-2xl py-4 active:bg-primary-dark active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {submitting ? "Uploading documents..." : "Submit for Verification"}
        </button>
      </div>
    </div>
  );
}
