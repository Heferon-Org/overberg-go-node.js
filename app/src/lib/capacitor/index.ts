import { Capacitor } from "@capacitor/core";

export function isNative(): boolean {
  return Capacitor.isNativePlatform();
}

export function isIOS(): boolean {
  return Capacitor.getPlatform() === "ios";
}

export function isAndroid(): boolean {
  return Capacitor.getPlatform() === "android";
}

export function getPlatform(): "ios" | "android" | "web" {
  return Capacitor.getPlatform() as "ios" | "android" | "web";
}

export function isPluginAvailable(name: string): boolean {
  return Capacitor.isPluginAvailable(name);
}
