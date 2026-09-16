const UNIT_MS: Record<string, number> = {
  s: 1000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
  w: 604_800_000,
};

/**
 * Parses the "15m" / "30d" style TTL strings used in env vars (JWT_ACCESS_TTL,
 * JWT_REFRESH_TTL) into milliseconds, for computing session expiresAt.
 */
export function parseDurationMs(input: string): number {
  const match = /^(\d+)(s|m|h|d|w)$/.exec(input.trim());
  if (!match) {
    throw new Error(`Invalid duration string: "${input}" (expected e.g. "15m", "30d")`);
  }
  const [, amount, unit] = match as unknown as [string, string, string];
  return Number(amount) * UNIT_MS[unit]!;
}
