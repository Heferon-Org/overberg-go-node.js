export type AppTarget = "customer" | "driver" | "vendor";

export function getAppTarget(): AppTarget {
  if (typeof window === "undefined") return "customer";
  const path = window.location.pathname;
  if (path.startsWith("/driver")) return "driver";
  if (path.startsWith("/vendor")) return "vendor";
  return "customer";
}
