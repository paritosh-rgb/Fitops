export function getCheckinToken(): string {
  return (process.env.APP_CHECKIN_TOKEN ?? "gym-qr-checkin").trim();
}

export function isValidCheckinToken(token?: string): boolean {
  if (!token) return false;
  return token === getCheckinToken();
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
