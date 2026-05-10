// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AdminClient = any;

export async function sendNativePushToUser(
  adminClient: AdminClient,
  userId: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<{ ok: boolean; error?: string }> {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    console.log("[native-push] Skipped — no credentials configured");
    return { ok: false, error: "no_credentials" };
  }

  const { data: tokens, error } = await adminClient
    .from("user_push_tokens")
    .select("token, platform")
    .eq("user_id", userId);

  if (error || !tokens?.length) {
    return { ok: false, error: "no_native_tokens" };
  }

  const { sendPush } = await import("./fcm");
  const results = await Promise.allSettled(
    tokens.map((t: { token: string; platform: string }) =>
      sendPush({
        token: t.token,
        title,
        body,
        data: {
          ...data,
          platform: t.platform,
          click_action: "FLUTTER_NOTIFICATION_CLICK",
        },
      })
    )
  );

  const anyOk = results.some(
    (r) => r.status === "fulfilled" && r.value.ok
  );
  return { ok: anyOk, error: anyOk ? undefined : "all_sends_failed" };
}
