"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

type PrescriptionOrder = {
  id: string;
  order_id: string | null;
  customer_id: string;
  image_url: string;
  verified_by: string | null;
  verified_at: string | null;
  notes: string | null;
  created_at: string;
};

export default function VendorPharmacyPage() {
  const [prescriptions, setPrescriptions] = useState<PrescriptionOrder[]>([]);
  const [tab, setTab] = useState<"pending" | "verified">("pending");
  const supabase = createClient();

  const loadPrescriptions = useCallback(async () => {
    const query = supabase
      .from("prescriptions")
      .select("*")
      .order("created_at", { ascending: false });

    if (tab === "pending") {
      query.is("verified_at", null);
    } else {
      query.not("verified_at", "is", null);
    }

    const { data } = await query;
    if (data) setPrescriptions(data);
  }, [supabase, tab]);

  useEffect(() => {
    loadPrescriptions();
  }, [loadPrescriptions]);

  async function verifyPrescription(id: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("prescriptions") as any).update({
      verified_by: user.id,
      verified_at: new Date().toISOString(),
    }).eq("id", id);

    if (prescriptions.find((p) => p.id === id)?.order_id) {
      const rx = prescriptions.find((p) => p.id === id)!;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("orders") as any).update({ status: "confirmed" }).eq("id", rx.order_id!);
    }

    loadPrescriptions();
  }

  return (
    <div className="px-4 pt-6 pb-24">
      <h1 className="text-xl font-display font-bold mb-4">Prescription Verification</h1>

      <div className="flex gap-2 mb-4">
        {(["pending", "verified"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              tab === t ? "bg-primary text-white" : "bg-gray-100 text-t3"
            }`}
          >
            {t === "pending" ? "Pending" : "Verified"}
          </button>
        ))}
      </div>

      {prescriptions.length === 0 ? (
        <p className="text-center text-t3 py-8">No {tab} prescriptions</p>
      ) : (
        <div className="space-y-3">
          {prescriptions.map((rx) => (
            <div key={rx.id} className="bg-white rounded-2xl border border-gray-100 p-4">
              <div className="flex items-start gap-3">
                <img
                  src={rx.image_url}
                  alt="Prescription"
                  className="w-20 h-20 rounded-xl object-cover bg-gray-100"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-t3">
                    {new Date(rx.created_at).toLocaleDateString("en-ZA", {
                      day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
                    })}
                  </p>
                  {rx.notes && <p className="text-sm mt-1">{rx.notes}</p>}
                  {rx.verified_at && (
                    <p className="text-xs text-green-600 mt-1">
                      Verified {new Date(rx.verified_at).toLocaleDateString("en-ZA")}
                    </p>
                  )}
                </div>
              </div>
              {!rx.verified_at && (
                <button
                  onClick={() => verifyPrescription(rx.id)}
                  className="w-full mt-3 py-2 bg-green-600 text-white rounded-xl text-sm font-semibold"
                >
                  Verify Prescription
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
