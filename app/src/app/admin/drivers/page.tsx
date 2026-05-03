"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useToastStore } from "@/lib/store";

function getClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

interface DriverRow {
  id: string;
  vehicle_reg: string | null;
  vehicle_type: string;
  is_online: boolean;
  rating: number;
  total_trips: number;
  kyc_status: string;
  profile?: { full_name: string | null; phone: string | null };
}

interface KycDoc {
  id: string;
  user_id: string;
  document_type: string;
  file_url: string;
  verification_status: string;
}

export default function AdminDriversPage() {
  const showToast = useToastStore((s) => s.show);
  const [drivers, setDrivers] = useState<DriverRow[]>([]);
  const [kycDocs, setKycDocs] = useState<KycDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"all" | "kyc">("all");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const client = getClient();
    const [driversRes, kycRes] = await Promise.all([
      client.from("drivers").select("*, profile:profiles(full_name, phone)").order("created_at", { ascending: false }),
      client.from("kyc_documents").select("*").eq("applicant_role", "driver").eq("verification_status", "pending"),
    ]);
    setDrivers((driversRes.data || []) as unknown as DriverRow[]);
    setKycDocs((kycRes.data || []) as KycDoc[]);
    setLoading(false);
  }

  async function toggleOnline(driverId: string, current: boolean) {
    const client = getClient();
    await client.from("drivers").update({ is_online: !current }).eq("id", driverId);
    setDrivers((prev) => prev.map((d) => (d.id === driverId ? { ...d, is_online: !current } : d)));
    showToast(`Driver ${!current ? "set online" : "set offline"}`);
  }

  async function updateKycStatus(driverId: string, status: "verified" | "suspended") {
    const client = getClient();
    await client.from("drivers").update({ kyc_status: status }).eq("id", driverId);
    setDrivers((prev) => prev.map((d) => (d.id === driverId ? { ...d, kyc_status: status } : d)));
    showToast(`Driver KYC: ${status}`);
  }

  async function reviewDoc(docId: string, verdict: "approved" | "rejected") {
    const client = getClient();
    await client.from("kyc_documents").update({ verification_status: verdict }).eq("id", docId);
    setKycDocs((prev) => prev.filter((d) => d.id !== docId));
    showToast(`Document ${verdict}`);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-2xl animate-pulse">🛵</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1200px] mx-auto">
      <h1 className="font-heading font-black text-xl text-[#111827] mb-5">Driver Management</h1>

      <div className="flex gap-2 mb-5">
        <button onClick={() => setTab("all")} className={`px-4 py-2 rounded-xl text-xs font-heading font-bold border ${tab === "all" ? "bg-[#1E9E5A] text-white border-[#1E9E5A]" : "bg-white border-[rgba(0,0,0,0.07)]"}`}>
          All Drivers ({drivers.length})
        </button>
        <button onClick={() => setTab("kyc")} className={`px-4 py-2 rounded-xl text-xs font-heading font-bold border ${tab === "kyc" ? "bg-[#F5A623] text-white border-[#F5A623]" : "bg-white border-[rgba(0,0,0,0.07)]"}`}>
          Pending KYC ({kycDocs.length})
        </button>
      </div>

      {tab === "all" && (
        <div className="bg-white border border-[rgba(0,0,0,0.07)] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[rgba(0,0,0,0.07)] bg-[#f7f8fa]">
                  <th className="text-left px-4 py-3 font-heading font-bold text-[rgba(17,24,39,0.55)]">Driver</th>
                  <th className="text-left px-4 py-3 font-heading font-bold text-[rgba(17,24,39,0.55)]">Vehicle</th>
                  <th className="text-left px-4 py-3 font-heading font-bold text-[rgba(17,24,39,0.55)]">Rating</th>
                  <th className="text-left px-4 py-3 font-heading font-bold text-[rgba(17,24,39,0.55)]">Trips</th>
                  <th className="text-left px-4 py-3 font-heading font-bold text-[rgba(17,24,39,0.55)]">KYC</th>
                  <th className="text-left px-4 py-3 font-heading font-bold text-[rgba(17,24,39,0.55)]">Status</th>
                  <th className="text-left px-4 py-3 font-heading font-bold text-[rgba(17,24,39,0.55)]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {drivers.map((d) => (
                  <tr key={d.id} className="border-b border-[rgba(0,0,0,0.04)]">
                    <td className="px-4 py-3">
                      <div className="font-heading font-bold">{d.profile?.full_name || d.id.slice(0, 8)}</div>
                      <div className="text-[rgba(17,24,39,0.45)] mt-0.5">{d.profile?.phone || "—"}</div>
                    </td>
                    <td className="px-4 py-3">{d.vehicle_type} · {d.vehicle_reg || "—"}</td>
                    <td className="px-4 py-3 font-heading font-bold">★ {d.rating.toFixed(1)}</td>
                    <td className="px-4 py-3">{d.total_trips}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-heading font-bold border ${
                        d.kyc_status === "verified" ? "bg-[#1E9E5A]/10 text-[#1E9E5A] border-[#1E9E5A]/25" :
                        d.kyc_status === "pending" ? "bg-[#F5A623]/10 text-[#F5A623] border-[#F5A623]/25" :
                        "bg-[#E8503A]/10 text-[#E8503A] border-[#E8503A]/25"
                      }`}>
                        {d.kyc_status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-heading font-bold ${d.is_online ? "text-[#1E9E5A]" : "text-[rgba(17,24,39,0.35)]"}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${d.is_online ? "bg-[#1E9E5A]" : "bg-[rgba(17,24,39,0.2)]"}`} />
                        {d.is_online ? "Online" : "Offline"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        <button onClick={() => toggleOnline(d.id, d.is_online)} className="px-2 py-1 rounded-lg bg-[#f7f8fa] border border-[rgba(0,0,0,0.07)] text-[10px] font-heading font-bold hover:bg-[#e5e7eb]">
                          {d.is_online ? "Force offline" : "Set online"}
                        </button>
                        {d.kyc_status === "verified" && (
                          <button onClick={() => updateKycStatus(d.id, "suspended")} className="px-2 py-1 rounded-lg bg-[#E8503A]/10 border border-[#E8503A]/25 text-[10px] font-heading font-bold text-[#E8503A]">
                            Suspend
                          </button>
                        )}
                        {d.kyc_status === "suspended" && (
                          <button onClick={() => updateKycStatus(d.id, "verified")} className="px-2 py-1 rounded-lg bg-[#1E9E5A]/10 border border-[#1E9E5A]/25 text-[10px] font-heading font-bold text-[#1E9E5A]">
                            Reinstate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "kyc" && (
        <div className="space-y-3">
          {kycDocs.length === 0 ? (
            <div className="bg-white border border-[rgba(0,0,0,0.07)] rounded-2xl p-12 text-center">
              <div className="text-2xl mb-2">✅</div>
              <div className="text-sm text-[rgba(17,24,39,0.55)]">No pending KYC documents</div>
            </div>
          ) : (
            kycDocs.map((doc) => (
              <div key={doc.id} className="bg-white border border-[rgba(0,0,0,0.07)] rounded-2xl p-4 flex items-center gap-4">
                <div className="w-10 h-10 bg-[#f7f8fa] rounded-xl flex items-center justify-center text-lg">📄</div>
                <div className="flex-1">
                  <div className="font-heading font-bold text-sm">{doc.document_type.replace(/_/g, " ")}</div>
                  <div className="text-[11px] text-[rgba(17,24,39,0.55)]">User: {doc.user_id.slice(0, 12)}...</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => reviewDoc(doc.id, "approved")} className="px-3 py-2 rounded-xl bg-[#1E9E5A] text-white text-[11px] font-heading font-bold">
                    Approve
                  </button>
                  <button onClick={() => reviewDoc(doc.id, "rejected")} className="px-3 py-2 rounded-xl bg-[#E8503A]/10 border border-[#E8503A]/25 text-[#E8503A] text-[11px] font-heading font-bold">
                    Reject
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
