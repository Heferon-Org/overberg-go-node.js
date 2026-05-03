/**
 * Firebase Cloud Messaging push notifications.
 * Gracefully skips if FIREBASE_SERVICE_ACCOUNT_JSON is not configured.
 */

interface FcmPayload {
  token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

let accessToken: string | null = null;
let tokenExpiry = 0;

function getFirebaseConfig(): { projectId: string; clientEmail: string; privateKey: string } | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed.project_id || !parsed.client_email || !parsed.private_key) return null;
    return {
      projectId: parsed.project_id,
      clientEmail: parsed.client_email,
      privateKey: parsed.private_key,
    };
  } catch {
    console.warn("[fcm] Invalid FIREBASE_SERVICE_ACCOUNT_JSON");
    return null;
  }
}

async function getAccessToken(config: { clientEmail: string; privateKey: string }): Promise<string | null> {
  if (accessToken && Date.now() < tokenExpiry) return accessToken;

  try {
    const now = Math.floor(Date.now() / 1000);
    const header = btoa(JSON.stringify({ alg: "RS256", typ: "JWT" }));
    const claim = btoa(
      JSON.stringify({
        iss: config.clientEmail,
        scope: "https://www.googleapis.com/auth/firebase.messaging",
        aud: "https://oauth2.googleapis.com/token",
        iat: now,
        exp: now + 3600,
      })
    );

    const signingInput = `${header}.${claim}`;
    const key = await importPrivateKey(config.privateKey);
    const signature = await sign(key, signingInput);
    const jwt = `${signingInput}.${signature}`;

    const resp = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
    });

    if (!resp.ok) {
      console.warn("[fcm] Token exchange failed:", resp.status);
      return null;
    }

    const data = await resp.json();
    accessToken = data.access_token;
    tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
    return accessToken;
  } catch (e) {
    console.warn("[fcm] Access token error:", e);
    return null;
  }
}

async function importPrivateKey(pem: string): Promise<CryptoKey> {
  const pemBody = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s/g, "");
  const binary = Uint8Array.from(atob(pemBody), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey("pkcs8", binary, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
}

async function sign(key: CryptoKey, input: string): Promise<string> {
  const encoded = new TextEncoder().encode(input);
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, encoded);
  return btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function sendPush(payload: FcmPayload): Promise<{ ok: boolean; error?: string }> {
  const config = getFirebaseConfig();
  if (!config) {
    console.log("[fcm] Skipped — no credentials configured");
    return { ok: false, error: "no_credentials" };
  }

  if (!payload.token) {
    return { ok: false, error: "no_token" };
  }

  const token = await getAccessToken(config);
  if (!token) {
    return { ok: false, error: "auth_failed" };
  }

  try {
    const resp = await fetch(
      `https://fcm.googleapis.com/v1/projects/${config.projectId}/messages:send`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: {
            token: payload.token,
            notification: {
              title: payload.title,
              body: payload.body,
            },
            data: payload.data || {},
            webpush: {
              fcm_options: {
                link: "https://overberg-go.vercel.app/orders",
              },
            },
          },
        }),
      }
    );

    if (!resp.ok) {
      const err = await resp.text();
      console.warn("[fcm] Send failed:", resp.status, err);
      return { ok: false, error: `fcm_${resp.status}` };
    }

    return { ok: true };
  } catch (e) {
    console.warn("[fcm] Network error:", e);
    return { ok: false, error: "network" };
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function sendPushToUser(
  adminClient: any,
  userId: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<{ ok: boolean; error?: string }> {
  const config = getFirebaseConfig();
  if (!config) {
    console.log("[fcm] Skipped — no credentials configured");
    return { ok: false, error: "no_credentials" };
  }

  const { data: profile } = await adminClient
    .from("profiles")
    .select("fcm_token")
    .eq("id", userId)
    .single();

  const fcmToken = (profile as { fcm_token?: string } | null)?.fcm_token;
  if (!fcmToken) {
    return { ok: false, error: "no_token" };
  }

  return sendPush({ token: fcmToken, title, body, data });
}
