export function getCheckinToken(): string {
  return (process.env.APP_CHECKIN_TOKEN ?? "fitops-checkin-2026").trim();
}

function acceptedTokens(): string[] {
  const primary = getCheckinToken();
  const legacyFromEnv = (process.env.APP_CHECKIN_LEGACY_TOKENS ?? "")
    .split(",")
    .map((row) => row.trim())
    .filter(Boolean);
  const builtInLegacy = ["gym-qr-checkin", "fitops-checkin-2026"];
  return Array.from(new Set([primary, ...legacyFromEnv, ...builtInLegacy]));
}

export function isValidCheckinToken(token?: string): boolean {
  if (!token) return false;
  return acceptedTokens().includes(token.trim());
}

export function getAppBaseUrl(): string {
  const explicit = (process.env.NEXT_PUBLIC_APP_URL ?? "").trim();
  if (explicit) return explicit;

  const vercelUrl = (process.env.VERCEL_URL ?? "").trim();
  if (vercelUrl) {
    return `https://${vercelUrl.replace(/^https?:\/\//, "")}`;
  }

  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }

  return "http://localhost:3000";
}

export function buildSharedCheckinUrl(gymId: string): string {
  const base = getAppBaseUrl().replace(/\/$/, "");
  const token = getCheckinToken();
  return `${base}/check-in?token=${encodeURIComponent(token)}&gym=${encodeURIComponent(gymId)}`;
}

export function qrImageUrl(data: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(data)}`;
}
