import {
  PAYFAST_MERCHANT_ID,
  PAYFAST_MERCHANT_KEY,
  PAYFAST_PROCESS_URL,
} from "./config";
import { generateSignature } from "./signature";

export interface PayfastPaymentInput {
  amount: number;
  itemName: string;
  itemDescription?: string;
  // Our internal payment id — round-tripped via custom_str1
  paymentId: string;
  userId: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  cellNumber?: string;
  returnUrl: string;
  cancelUrl: string;
  notifyUrl: string;
  // Optional intent flag — round-tripped via custom_str2
  intent?: "wallet_topup" | "order_payment";
}

/**
 * Build the PayFast form payload (server-side only).
 * Keys are in PayFast's recommended order to keep signature deterministic.
 */
export function buildPayfastPayload(input: PayfastPaymentInput): {
  url: string;
  fields: Record<string, string>;
} {
  const ordered: Record<string, string> = {};

  ordered.merchant_id = PAYFAST_MERCHANT_ID;
  ordered.merchant_key = PAYFAST_MERCHANT_KEY;
  ordered.return_url = input.returnUrl;
  ordered.cancel_url = input.cancelUrl;
  ordered.notify_url = input.notifyUrl;

  if (input.firstName) ordered.name_first = input.firstName;
  if (input.lastName) ordered.name_last = input.lastName;
  if (input.email) ordered.email_address = input.email;
  if (input.cellNumber) ordered.cell_number = input.cellNumber;

  ordered.m_payment_id = input.paymentId;
  ordered.amount = input.amount.toFixed(2);
  ordered.item_name = input.itemName.slice(0, 100);
  if (input.itemDescription) {
    ordered.item_description = input.itemDescription.slice(0, 255);
  }

  ordered.custom_str1 = input.paymentId;
  ordered.custom_str2 = input.intent || "order_payment";
  ordered.custom_str3 = input.userId;

  ordered.signature = generateSignature(ordered);

  return { url: PAYFAST_PROCESS_URL, fields: ordered };
}
