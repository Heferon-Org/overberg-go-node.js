import crypto from "node:crypto";
import { PAYFAST_PASSPHRASE } from "./config";

// PayFast-specific URL encoding: spaces become "+", uppercase hex.
function encode(value: string): string {
  return encodeURIComponent(value)
    .replace(/%20/g, "+")
    .replace(/%[0-9a-f]{2}/g, (m) => m.toUpperCase());
}

/**
 * Build the canonical query string for PayFast signature.
 * Rules:
 *  - Order: insertion order of the payload (NOT alphabetical) on outgoing,
 *    but PayFast docs use the field order they list. We use insertion order.
 *  - Skip empty values.
 *  - Skip the `signature` field itself.
 *  - URL-encode values per PayFast rules; concatenate with "&".
 *  - Append `&passphrase=<encoded>` if passphrase is configured.
 */
export function buildSignatureString(
  payload: Record<string, string | number | undefined | null>,
  includePassphrase = true
): string {
  const parts: string[] = [];
  for (const [key, raw] of Object.entries(payload)) {
    if (key === "signature") continue;
    if (raw === undefined || raw === null) continue;
    const value = String(raw).trim();
    if (value.length === 0) continue;
    parts.push(`${key}=${encode(value)}`);
  }

  let str = parts.join("&");
  if (includePassphrase && PAYFAST_PASSPHRASE) {
    str += `&passphrase=${encode(PAYFAST_PASSPHRASE)}`;
  }
  return str;
}

export function generateSignature(
  payload: Record<string, string | number | undefined | null>
): string {
  const str = buildSignatureString(payload);
  return crypto.createHash("md5").update(str).digest("hex");
}

/**
 * Verify ITN signature. PayFast posts back the form fields including
 * `signature`. We rebuild the canonical string from the received fields
 * (preserving order) and compare MD5 hashes.
 */
export function verifySignature(received: Record<string, string>): boolean {
  const provided = received.signature;
  if (!provided) return false;
  const expected = generateSignature(received);
  return crypto.timingSafeEqual(
    Buffer.from(provided.toLowerCase()),
    Buffer.from(expected.toLowerCase())
  );
}
