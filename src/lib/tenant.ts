export function normalizeGymId(value?: string | null): string {
  const raw = (value ?? "").trim().toLowerCase();
  const cleaned = raw
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-_]+|[-_]+$/g, "");

  return cleaned || "fitops-demo";
}

export function envGymId(): string {
  return normalizeGymId(process.env.APP_GYM_ID ?? "fitops-demo");
}

export function gymStoreKey(gymId: string): string {
  return `gym:${normalizeGymId(gymId)}`;
}
