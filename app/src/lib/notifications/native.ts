import { isNative, isPluginAvailable } from "@/lib/capacitor";
import type { SupabaseClient } from "@supabase/supabase-js";

interface NativePushResult {
  ok: boolean;
  token?: string;
  error?: string;
}

export async function registerNativePush(
  supabase: SupabaseClient,
  userId: string
): Promise<NativePushResult> {
  if (!isNative() || !isPluginAvailable("PushNotifications")) {
    return { ok: false, error: "not_native" };
  }

  try {
    const { PushNotifications } = await import("@capacitor/push-notifications");

    const permResult = await PushNotifications.requestPermissions();
    if (permResult.receive !== "granted") {
      return { ok: false, error: "permission_denied" };
    }

    return new Promise((resolve) => {
      PushNotifications.addListener("registration", async (token) => {
        const platform = (await import("@/lib/capacitor")).getPlatform();

        const { error } = await supabase.from("user_push_tokens").upsert(
          {
            user_id: userId,
            token: token.value,
            platform,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,platform" }
        );

        if (error) {
          resolve({ ok: false, error: error.message });
        } else {
          resolve({ ok: true, token: token.value });
        }
      });

      PushNotifications.addListener("registrationError", (err) => {
        resolve({ ok: false, error: err.error });
      });

      PushNotifications.register();
    });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "unknown" };
  }
}

export async function setupNativePushListeners(): Promise<void> {
  if (!isNative() || !isPluginAvailable("PushNotifications")) return;

  const { PushNotifications } = await import("@capacitor/push-notifications");

  PushNotifications.addListener("pushNotificationReceived", (notification) => {
    console.log("[NativePush] Received:", notification.title, notification.body);
  });

  PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
    const data = action.notification.data;
    if (data?.url) {
      window.location.href = data.url;
    } else if (data?.order_id) {
      window.location.href = `/orders/${data.order_id}`;
    }
  });
}
