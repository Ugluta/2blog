import * as argon2 from "argon2";

/**
 * Argon2id per ARCHITECTURE.md madde 8 — deliberately not argon2i/argon2d
 * (id mode resists both GPU cracking and side-channel attacks).
 */
export async function hashPassword(plain: string): Promise<string> {
  return argon2.hash(plain, { type: argon2.argon2id });
}

export async function verifyPassword(hash: string, plain: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, plain);
  } catch {
    return false;
  }
}
