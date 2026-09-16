import { randomBytes, createHash } from "node:crypto";

/**
 * The raw value returned to the client and never persisted — only its hash
 * is stored (ARCHITECTURE.md madde 8), so a database leak does not expose
 * usable refresh tokens.
 */
export function generateRefreshToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
