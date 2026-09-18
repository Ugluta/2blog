import { describe, expect, it } from "vitest";
import { parseDurationMs } from "./duration";

describe("parseDurationMs", () => {
  it.each([
    ["15m", 15 * 60_000],
    ["30d", 30 * 86_400_000],
    ["1h", 3_600_000],
    ["45s", 45_000],
    ["2w", 2 * 604_800_000],
    ["0s", 0],
  ])("parses %s to %i ms", (input, expected) => {
    expect(parseDurationMs(input)).toBe(expected);
  });

  it("trims surrounding whitespace", () => {
    expect(parseDurationMs(" 15m ")).toBe(15 * 60_000);
  });

  it.each(["15", "m15", "15mm", "15x", "", "-5m", "15.5m"])("rejects malformed input %j", (input) => {
    expect(() => parseDurationMs(input)).toThrow(/Invalid duration string/);
  });
});
