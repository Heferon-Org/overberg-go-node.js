"use client";

import { useEffect, useState } from "react";

export function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    function goOffline() { setOffline(true); }
    function goOnline() { setOffline(false); }

    setOffline(!navigator.onLine);
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-[#111827] text-white px-4 py-2.5 flex items-center justify-center gap-2 text-sm font-heading font-bold">
      <span className="text-base">📡</span>
      You&apos;re offline — showing cached content
    </div>
  );
}
