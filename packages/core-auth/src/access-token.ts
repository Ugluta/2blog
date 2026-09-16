import jwt from "jsonwebtoken";
import type { AccessTokenPayload } from "@2blog/types";

export function signAccessToken(
  payload: AccessTokenPayload,
  secret: string,
  ttl: string,
): string {
  return jwt.sign(payload, secret, { expiresIn: ttl as jwt.SignOptions["expiresIn"] });
}

export class AccessTokenError extends Error {}

export function verifyAccessToken(token: string, secret: string): AccessTokenPayload {
  try {
    return jwt.verify(token, secret) as AccessTokenPayload;
  } catch (error) {
    throw new AccessTokenError(error instanceof Error ? error.message : "Invalid access token");
  }
}
