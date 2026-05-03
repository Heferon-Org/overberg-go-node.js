"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToastStore } from "@/lib/store";

type DocType = "business_registration" | "owner_id" | "bank_proof" | "tax_clearance" | "food_handlers_cert";

const requiredDocs: { type: DocType; label: string; emoji: string; desc: string; optional?: boolean }[] = [
  { type: "business_registration", label: "Business Registration", emoji: "🏢", desc: "CIPC registration or trading license" },
  { type: "owner_id", label: "Owner ID Document", emoji: "🪪", desc: "SA ID of the business owner" },
  { type: "bank_proof", label: "Bank Confirmation", emoji: "🏦", desc: "Bank confirmation letter or statement header" },
  { type: "tax_clearance", label: "Tax Clearance", emoji: "📜", desc: "SARS tax clearance certificate", optional: true },
  { type: "food_handlers_cert", label: "Food Handlers Certificate", emoji: "🍽️", desc: "Certificate of Acceptability (CoA) for food businesses", optional: true },
];

export default function VendorKycPage() {
  const [uploads, setUploads] = useState<Record<string, { file: File; status: "pending" | "uploading" | "done" | "error" }>>({});
  const [businessName, setBusinessName] = useState("");
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
    if (!businessName.trim()) {
      showToast("Enter your business name");
      return;
    }

    const required = requiredDocs.filter((d) => !d.optional);
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
        applicant_role: "vendor" as const,
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
      showToast("✓ Documents submitted — we'll review within 24–48 hours");
      router.push("/vendor");
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
          <h1 className="font-heading font-black text-lg">Vendor Verification</h1>
          <p className="text-[11px] text-t2">Get your business listed on OverBerg Go</p>
        </div>
      </div>

      {/* Business name */}
      <div className="px-[18px] mt-5">
        <label className="font-heading font-bold text-xs text-t2 block mb-2">Business name</label>
        <input
          type="text"
          placeholder="e.g. Harbour Café"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          className="w-full bg-dark2 border border-bd rounded-xl px-4 py-3.5 text-sm text-t1 placeholder:text-t3 outline-none focus:border-primary/40 transition-colors"
        />
      </div>

      {/* Progress */}
      <div className="px-[18px] mt-5 mb-2">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-heading font-bold text-primary">
            {Object.values(uploads).filter((u) => u.status === "done").length}/{requiredDocs.length} uploaded
          </span>
        </div>
        <div className="h-1.5 bg-dark3 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-sea to-primary rounded-full transition-all"
            style={{ width: `${(Object.values(uploads).filter((u) => u.status === "done").length / requiredDocs.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Documents */}
      <div className="px-[18px] mt-4 space-y-3">
        {requiredDocs.map((doc) => {
          const upload = uploads[doc.type];

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
                    {doc.optional && (
                      <span className="text-[9px] font-heading font-bold text-t3 bg-dark3 px-2 py-0.5 rounded-full">OPTIONAL</span>
                    )}
                  </div>
                  <p className="text-[11px] text-t2 mt-0.5">{doc.desc}</p>
                  {upload && (
                    <p className="text-[10px] text-sea font-heading font-semibold mt-1 truncate">
                      {upload.file.name}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => fileRefs.current[doc.type]?.click()}
                  className={`px-3 py-1.5 rounded-xl text-xs font-heading font-bold transition-all flex-shrink-0 ${
                    upload
                      ? "bg-dark3 border border-bd text-t2"
                      : "bg-sea text-white"
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
      <div className="mx-[18px] mt-5 p-4 bg-primary/[0.06] border border-primary/15 rounded-[16px]">
        <div className="flex items-start gap-2">
          <span className="text-lg">ℹ️</span>
          <div>
            <p className="font-heading font-bold text-xs">What happens next?</p>
            <p className="text-[11px] text-t2 mt-0.5">
              Our team reviews your documents within 24–48 hours. Once approved, you can set up your menu and start receiving orders.
            </p>
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="px-[18px] mt-6">
        <button
          onClick={handleSubmit}
          disabled={submitting || Object.keys(uploads).length < 3 || !businessName.trim()}
          className="w-full bg-sea text-white font-heading font-extrabold text-base rounded-2xl py-4 active:bg-sea/80 active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {submitting ? "Uploading documents..." : "Submit for Verification"}
        </button>
      </div>
    </div>
  );
}
