import crypto from "crypto";

import { serverEnv } from "@/lib/env";

const encryptionKey = crypto
  .createHash("sha256")
  .update(serverEnv.ENCRYPTION_KEY)
  .digest();

export function encryptSecret(value: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey, iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

export function decryptSecret(value: string) {
  const buffer = Buffer.from(value, "base64");
  const iv = buffer.subarray(0, 12);
  const tag = buffer.subarray(12, 28);
  const encrypted = buffer.subarray(28);
  const decipher = crypto.createDecipheriv("aes-256-gcm", encryptionKey, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

export function signPortalPayload(payload: object) {
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", serverEnv.PORTAL_SIGNING_SECRET)
    .update(encoded)
    .digest("base64url");
  return `${encoded}.${signature}`;
}

export function verifyPortalPayload<T>(token: string) {
  const [encoded, signature] = token.split(".");

  if (!encoded || !signature) {
    throw new Error("Invalid portal token");
  }

  const expected = crypto
    .createHmac("sha256", serverEnv.PORTAL_SIGNING_SECRET)
    .update(encoded)
    .digest("base64url");

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    throw new Error("Invalid portal token signature");
  }

  return JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as T;
}
