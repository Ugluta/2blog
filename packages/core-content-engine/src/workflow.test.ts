import { describe, expect, it } from "vitest";
import { CONTENT_STATUSES, type ContentStatus } from "@2blog/types";
import { canTransitionContent, assertValidContentTransition, InvalidContentTransitionError } from "./workflow";

// The full transition graph exactly as documented in workflow.ts —
// pinned here so a future edit to TRANSITIONS is a deliberate, visible
// change to this test, not a silent behavior shift.
const EXPECTED_TRANSITIONS: Record<ContentStatus, ContentStatus[]> = {
  DRAFT: ["REVIEW", "PUBLISHED"],
  REVIEW: ["APPROVED", "DRAFT"],
  APPROVED: ["SCHEDULED", "PUBLISHED", "DRAFT"],
  SCHEDULED: ["PUBLISHED", "DRAFT"],
  PUBLISHED: ["ARCHIVED", "DRAFT"],
  ARCHIVED: ["DRAFT"],
};

describe("canTransitionContent", () => {
  it("matches the documented transition graph exactly, for every (from, to) pair", () => {
    for (const from of CONTENT_STATUSES) {
      for (const to of CONTENT_STATUSES) {
        const expected = EXPECTED_TRANSITIONS[from].includes(to);
        expect(canTransitionContent(from, to), `${from} -> ${to}`).toBe(expected);
      }
    }
  });

  it("allows DRAFT straight to PUBLISHED (no forced review gate)", () => {
    expect(canTransitionContent("DRAFT", "PUBLISHED")).toBe(true);
  });

  it("allows any non-DRAFT status to fall back to DRAFT", () => {
    for (const from of CONTENT_STATUSES) {
      if (from === "DRAFT") continue;
      expect(canTransitionContent(from, "DRAFT"), from).toBe(true);
    }
  });

  it("rejects skipping straight from PUBLISHED to APPROVED", () => {
    expect(canTransitionContent("PUBLISHED", "APPROVED")).toBe(false);
  });

  it("rejects a status transitioning to itself", () => {
    for (const status of CONTENT_STATUSES) {
      expect(canTransitionContent(status, status), status).toBe(false);
    }
  });

  it("rejects ARCHIVED going anywhere except back to DRAFT", () => {
    for (const to of CONTENT_STATUSES) {
      if (to === "DRAFT") continue;
      expect(canTransitionContent("ARCHIVED", to), to).toBe(false);
    }
  });
});

describe("assertValidContentTransition", () => {
  it("does not throw for a valid transition", () => {
    expect(() => assertValidContentTransition("DRAFT", "REVIEW")).not.toThrow();
  });

  it("throws InvalidContentTransitionError with from/to in the message for an invalid transition", () => {
    expect(() => assertValidContentTransition("PUBLISHED", "APPROVED")).toThrow(InvalidContentTransitionError);
    expect(() => assertValidContentTransition("PUBLISHED", "APPROVED")).toThrow(
      "Cannot transition content from PUBLISHED to APPROVED",
    );
  });
});
