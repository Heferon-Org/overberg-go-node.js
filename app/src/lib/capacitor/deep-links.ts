import { isNative, isPluginAvailable } from "@/lib/capacitor";

export async function setupDeepLinks(): Promise<void> {
  if (!isNative() || !isPluginAvailable("App")) return;

  const { App } = await import("@capacitor/app");

  App.addListener("appUrlOpen", (event) => {
    const url = new URL(event.url);
    const path = url.pathname;

    if (path) {
      window.location.href = path + url.search;
    }
  });

  App.addListener("backButton", ({ canGoBack }) => {
    if (canGoBack) {
      window.history.back();
    }
  });
}
