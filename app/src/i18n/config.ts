export const locales = ["en", "af"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export function getMessages(locale: Locale) {
  switch (locale) {
    case "af":
      return import("@/messages/af.json").then((m) => m.default);
    default:
      return import("@/messages/en.json").then((m) => m.default);
  }
}
