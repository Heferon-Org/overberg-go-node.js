"use client";

import { isNative, isIOS } from "@/lib/capacitor";

export async function initCapacitor(): Promise<void> {
  if (!isNative()) return;

  const [{ setupDeepLinks }, { setupNativePushListeners }] = await Promise.all([
    import("@/lib/capacitor/deep-links"),
    import("@/lib/notifications/native"),
  ]);

  await Promise.all([setupDeepLinks(), setupNativePushListeners()]);

  if (isIOS()) {
    try {
      const { StatusBar, Style } = await import("@capacitor/status-bar");
      await StatusBar.setStyle({ style: Style.Dark });
    } catch {
      // StatusBar not available
    }
  }

  try {
    const { Keyboard } = await import("@capacitor/keyboard");
    Keyboard.addListener("keyboardWillShow", (info) => {
      document.documentElement.style.setProperty("--keyboard-height", `${info.keyboardHeight}px`);
    });
    Keyboard.addListener("keyboardWillHide", () => {
      document.documentElement.style.setProperty("--keyboard-height", "0px");
    });
  } catch {
    // Keyboard not available
  }
}
