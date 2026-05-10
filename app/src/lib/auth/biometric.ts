import { isNative, isPluginAvailable } from "@/lib/capacitor";

interface BiometricResult {
  ok: boolean;
  error?: string;
}

export async function isBiometricAvailable(): Promise<boolean> {
  if (!isNative() || !isPluginAvailable("NativeBiometric")) return false;
  try {
    const { NativeBiometric } = await import("capacitor-native-biometric");
    const result = await NativeBiometric.isAvailable();
    return result.isAvailable;
  } catch {
    return false;
  }
}

export async function authenticateWithBiometric(
  reason = "Verify your identity"
): Promise<BiometricResult> {
  if (!isNative()) return { ok: false, error: "not_native" };
  try {
    const { NativeBiometric } = await import("capacitor-native-biometric");
    await NativeBiometric.verifyIdentity({
      reason,
      title: "OverBerg Go",
      subtitle: reason,
      useFallback: true,
      maxAttempts: 3,
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "biometric_failed" };
  }
}

export async function storeCredentials(
  server: string,
  username: string,
  password: string
): Promise<void> {
  if (!isNative()) return;
  try {
    const { NativeBiometric } = await import("capacitor-native-biometric");
    await NativeBiometric.setCredentials({ server, username, password });
  } catch {
    // Silently fail — credential storage is optional
  }
}

export async function getCredentials(
  server: string
): Promise<{ username: string; password: string } | null> {
  if (!isNative()) return null;
  try {
    const { NativeBiometric } = await import("capacitor-native-biometric");
    const creds = await NativeBiometric.getCredentials({ server });
    return { username: creds.username, password: creds.password };
  } catch {
    return null;
  }
}
