/**
 * Brevo (formerly Sendinblue) transactional email.
 * Gracefully skips if BREVO_API_KEY is not configured.
 */

interface EmailPayload {
  to: string;
  toName?: string;
  subject: string;
  html: string;
}

function getBrevoKey(): string | null {
  return process.env.BREVO_API_KEY || null;
}

const FROM_EMAIL = process.env.BREVO_FROM_EMAIL || "hello@overberg-go.co.za";
const FROM_NAME = process.env.BREVO_FROM_NAME || "OverBerg Go";

export async function sendEmail(payload: EmailPayload): Promise<{ ok: boolean; messageId?: string; error?: string }> {
  const apiKey = getBrevoKey();
  if (!apiKey) {
    console.log("[email] Skipped — no BREVO_API_KEY configured");
    return { ok: false, error: "no_credentials" };
  }

  if (!payload.to || !payload.subject) {
    return { ok: false, error: "missing_params" };
  }

  try {
    const resp = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        sender: { name: FROM_NAME, email: FROM_EMAIL },
        to: [{ email: payload.to, name: payload.toName || payload.to }],
        subject: payload.subject,
        htmlContent: wrapEmailHtml(payload.html),
      }),
    });

    if (!resp.ok) {
      const err = await resp.text();
      console.warn("[email] Brevo error:", resp.status, err);
      return { ok: false, error: `brevo_${resp.status}` };
    }

    const data = await resp.json();
    return { ok: true, messageId: data.messageId };
  } catch (e) {
    console.warn("[email] Network error:", e);
    return { ok: false, error: "network" };
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function sendEmailToUser(
  adminClient: any,
  userId: string,
  subject: string,
  html: string
): Promise<{ ok: boolean; error?: string }> {
  const apiKey = getBrevoKey();
  if (!apiKey) {
    console.log("[email] Skipped — no BREVO_API_KEY configured");
    return { ok: false, error: "no_credentials" };
  }

  const { data: profile } = await adminClient
    .from("profiles")
    .select("full_name")
    .eq("id", userId)
    .single();

  const { data: authUser } = await adminClient.auth.admin.getUserById(userId);
  const email = authUser?.user?.email;

  if (!email) {
    return { ok: false, error: "no_email" };
  }

  const name = (profile as { full_name?: string } | null)?.full_name || undefined;
  return sendEmail({ to: email, toName: name, subject, html });
}

function wrapEmailHtml(inner: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700;800;900&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:#f7f8fa;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f8fa;padding:24px 0;">
    <tr>
      <td align="center">
        ${inner}
      </td>
    </tr>
  </table>
</body>
</html>`;
}
