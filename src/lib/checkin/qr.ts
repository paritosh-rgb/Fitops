export function getCheckinToken(): string {
  return process.env.APP_CHECKIN_TOKEN ?? "gym-qr-checkin";
}

export function isValidCheckinToken(token?: string): boolean {
  if (!token) return false;
  return token === getCheckinToken();
}

export function getAppBaseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export function buildSharedCheckinUrl(): string {
  const base = getAppBaseUrl().replace(/\/$/, "");
  const token = getCheckinToken();
  return `${base}/check-in?token=${encodeURIComponent(token)}`;
}

export function qrImageUrl(data: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(data)}`;
}
