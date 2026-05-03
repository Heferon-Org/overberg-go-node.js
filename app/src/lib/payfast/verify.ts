import { PAYFAST_VALIDATE_URL, PAYFAST_VALID_IPS, PAYFAST_MODE } from "./config";

export function isValidPayfastIp(ip: string | null): boolean {
  if (PAYFAST_MODE === "sandbox") return true; // sandbox doesn't have fixed IP set
  if (!ip) return false;
  // Strip IPv6 prefix
  const clean = ip.replace(/^::ffff:/, "");
  return PAYFAST_VALID_IPS.includes(clean);
}

/**
 * Server-to-server validation: post the ITN payload back to PayFast and
 * expect "VALID" in the response body.
 */
export async function validateWithPayfast(
  rawBody: string
): Promise<boolean> {
  try {
    const res = await fetch(PAYFAST_VALIDATE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: rawBody,
    });
    if (!res.ok) return false;
    const text = (await res.text()).trim();
    return text === "VALID";
  } catch {
    return false;
  }
}
