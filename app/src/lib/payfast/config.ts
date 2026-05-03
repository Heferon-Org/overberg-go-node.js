export const PAYFAST_MODE = (process.env.PAYFAST_MODE || "sandbox") as "sandbox" | "live";

export const PAYFAST_HOST =
  PAYFAST_MODE === "live" ? "www.payfast.co.za" : "sandbox.payfast.co.za";

export const PAYFAST_PROCESS_URL = `https://${PAYFAST_HOST}/eng/process`;
export const PAYFAST_VALIDATE_URL = `https://${PAYFAST_HOST}/eng/query/validate`;

export const PAYFAST_MERCHANT_ID = process.env.PAYFAST_MERCHANT_ID || "";
export const PAYFAST_MERCHANT_KEY = process.env.PAYFAST_MERCHANT_KEY || "";
export const PAYFAST_PASSPHRASE = process.env.PAYFAST_PASSPHRASE || "";

// PayFast webhook source IPs (https://developers.payfast.co.za/docs#step_4_confirm_payment)
export const PAYFAST_VALID_IPS = [
  "197.97.145.144",
  "197.97.145.145",
  "197.97.145.146",
  "197.97.145.147",
  "197.97.145.148",
  "197.97.145.149",
  "197.97.145.150",
  "197.97.145.151",
  "197.97.145.152",
  "197.97.145.153",
  "197.97.145.154",
  "197.97.145.155",
  "41.74.179.194",
  "41.74.179.195",
  "41.74.179.196",
  "41.74.179.197",
  "41.74.179.200",
  "41.74.179.201",
  "41.74.179.203",
  "41.74.179.204",
  "41.74.179.210",
  "41.74.179.211",
  "41.74.179.212",
  "41.74.179.217",
  "41.74.179.218",
];
