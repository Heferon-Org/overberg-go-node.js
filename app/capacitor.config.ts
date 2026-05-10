import type { CapacitorConfig } from "@capacitor/cli";

const appTarget = (process.env.APP_TARGET || "customer") as
  | "customer"
  | "driver"
  | "vendor";

const configs: Record<typeof appTarget, { appId: string; appName: string; startUrl: string }> = {
  customer: {
    appId: "co.za.overberggo.app",
    appName: "OverBerg Go",
    startUrl: "/",
  },
  driver: {
    appId: "co.za.overberggo.driver",
    appName: "OverBerg Go Driver",
    startUrl: "/driver",
  },
  vendor: {
    appId: "co.za.overberggo.vendor",
    appName: "OverBerg Go for Business",
    startUrl: "/vendor/orders",
  },
};

const target = configs[appTarget];

const config: CapacitorConfig = {
  appId: target.appId,
  appName: target.appName,
  webDir: "out",

  server: {
    url: `https://overberggo.vercel.app${target.startUrl}`,
    cleartext: false,
    allowNavigation: ["overberggo.vercel.app", "*.supabase.co", "api.mapbox.com"],
  },

  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 2000,
      backgroundColor: "#0F172A",
      showSpinner: true,
      spinnerColor: "#F59E0B",
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#0F172A",
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
    Keyboard: {
      resizeOnFullScreen: true,
    },
  },

  ios: {
    scheme: "OverBergGo",
    contentInset: "automatic",
  },

  android: {
    allowMixedContent: false,
    backgroundColor: "#0F172A",
  },
};

export default config;
