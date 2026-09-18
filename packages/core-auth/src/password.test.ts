import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("hashPassword / verifyPassword", () => {
  it("verifies the correct plaintext against its own hash", async () => {
    const hash = await hashPassword("correct-horse-battery-staple");
    expect(await verifyPassword(hash, "correct-horse-battery-staple")).toBe(true);
  });

  it("rejects an incorrect plaintext against the hash", async () => {
    const hash = await hashPassword("correct-horse-battery-staple");
    expect(await verifyPassword(hash, "wrong-password")).toBe(false);
  });

  it("produces an argon2id hash (not argon2i/argon2d — ARCHITECTURE.md madde 8)", async () => {
    const hash = await hashPassword("some-password");
    expect(hash.startsWith("$argon2id$")).toBe(true);
  });

  it("produces a different hash each time for the same plaintext (random salt)", async () => {
    const [hashA, hashB] = await Promise.all([hashPassword("same-password"), hashPassword("same-password")]);
    expect(hashA).not.toBe(hashB);
  });

  it("returns false instead of throwing for a malformed/garbage hash", async () => {
    await expect(verifyPassword("not-a-real-argon2-hash", "anything")).resolves.toBe(false);
  });
});
