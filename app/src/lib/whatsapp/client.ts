/**
 * WhatsApp Cloud API client.
 * Gracefully skips if META_WHATSAPP_TOKEN / META_PHONE_NUMBER_ID are not configured.
 */

interface WhatsAppConfig {
  token: string;
  phoneNumberId: string;
}

function getConfig(): WhatsAppConfig | null {
  const token = process.env.META_WHATSAPP_TOKEN;
  const phoneNumberId = process.env.META_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) return null;
  return { token, phoneNumberId };
}

export async function sendWhatsAppMessage(
  to: string,
  body: string
): Promise<{ ok: boolean; messageId?: string; error?: string }> {
  const config = getConfig();
  if (!config) {
    console.log("[whatsapp] Skipped — no credentials configured");
    return { ok: false, error: "no_credentials" };
  }

  const normalized = normalizeSaPhone(to);
  if (!normalized) {
    return { ok: false, error: "invalid_phone" };
  }

  try {
    const resp = await fetch(
      `https://graph.facebook.com/v19.0/${config.phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: normalized,
          type: "text",
          text: { body },
        }),
      }
    );

    if (!resp.ok) {
      const err = await resp.text();
      console.warn("[whatsapp] Send failed:", resp.status, err);
      return { ok: false, error: `wa_${resp.status}` };
    }

    const data = await resp.json();
    return { ok: true, messageId: data.messages?.[0]?.id };
  } catch (e) {
    console.warn("[whatsapp] Network error:", e);
    return { ok: false, error: "network" };
  }
}

export async function sendWhatsAppInteractive(
  to: string,
  headerText: string,
  bodyText: string,
  buttonText: string,
  buttonUrl: string
): Promise<{ ok: boolean; error?: string }> {
  const config = getConfig();
  if (!config) {
    console.log("[whatsapp] Skipped — no credentials configured");
    return { ok: false, error: "no_credentials" };
  }

  const normalized = normalizeSaPhone(to);
  if (!normalized) return { ok: false, error: "invalid_phone" };

  try {
    const resp = await fetch(
      `https://graph.facebook.com/v19.0/${config.phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: normalized,
          type: "interactive",
          interactive: {
            type: "cta_url",
            header: { type: "text", text: headerText },
            body: { text: bodyText },
            action: {
              name: "cta_url",
              parameters: { display_text: buttonText, url: buttonUrl },
            },
          },
        }),
      }
    );

    if (!resp.ok) {
      const err = await resp.text();
      console.warn("[whatsapp] Interactive send failed:", resp.status, err);
      return { ok: false, error: `wa_${resp.status}` };
    }

    return { ok: true };
  } catch (e) {
    console.warn("[whatsapp] Network error:", e);
    return { ok: false, error: "network" };
  }
}

function normalizeSaPhone(phone: string): string | null {
  const digits = phone.replace(/[\s\-()]/g, "");
  if (digits.startsWith("+27") && digits.length === 12) return digits.slice(1);
  if (digits.startsWith("27") && digits.length === 11) return digits;
  if (digits.startsWith("0") && digits.length === 10) return `27${digits.slice(1)}`;
  if (digits.length >= 10) return digits;
  return null;
}
