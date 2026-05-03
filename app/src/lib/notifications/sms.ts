/**
 * Twilio SMS notifications.
 * Gracefully skips if TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_FROM_NUMBER are not set.
 */

interface SmsConfig {
  accountSid: string;
  authToken: string;
  fromNumber: string;
}

function getTwilioConfig(): SmsConfig | null {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_FROM_NUMBER;
  if (!accountSid || !authToken || !fromNumber) return null;
  return { accountSid, authToken, fromNumber };
}

export async function sendSms(
  to: string,
  body: string
): Promise<{ ok: boolean; sid?: string; error?: string }> {
  const config = getTwilioConfig();
  if (!config) {
    console.log("[sms] Skipped — no Twilio credentials configured");
    return { ok: false, error: "no_credentials" };
  }

  if (!to || !body) {
    return { ok: false, error: "missing_params" };
  }

  const normalized = normalizeSaPhone(to);
  if (!normalized) {
    return { ok: false, error: "invalid_phone" };
  }

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages.json`;
    const auth = btoa(`${config.accountSid}:${config.authToken}`);

    const resp = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: normalized,
        From: config.fromNumber,
        Body: body,
      }).toString(),
    });

    if (!resp.ok) {
      const err = await resp.text();
      console.warn("[sms] Twilio error:", resp.status, err);
      return { ok: false, error: `twilio_${resp.status}` };
    }

    const data = await resp.json();
    return { ok: true, sid: data.sid };
  } catch (e) {
    console.warn("[sms] Network error:", e);
    return { ok: false, error: "network" };
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function sendSmsToUser(
  adminClient: any,
  userId: string,
  body: string
): Promise<{ ok: boolean; error?: string }> {
  const config = getTwilioConfig();
  if (!config) {
    console.log("[sms] Skipped — no Twilio credentials configured");
    return { ok: false, error: "no_credentials" };
  }

  const { data: profile } = await adminClient
    .from("profiles")
    .select("phone")
    .eq("id", userId)
    .single();

  const phone = (profile as { phone?: string } | null)?.phone;
  if (!phone) {
    return { ok: false, error: "no_phone" };
  }

  return sendSms(phone, body);
}

function normalizeSaPhone(phone: string): string | null {
  const digits = phone.replace(/[\s\-()]/g, "");
  if (digits.startsWith("+27") && digits.length === 12) return digits;
  if (digits.startsWith("27") && digits.length === 11) return `+${digits}`;
  if (digits.startsWith("0") && digits.length === 10) return `+27${digits.slice(1)}`;
  if (digits.startsWith("+") && digits.length >= 10) return digits;
  return null;
}
