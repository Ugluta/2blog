import type { ContentStatus } from "@2blog/types";

/**
 * Everything reaching Content Engine starts at DRAFT — RAW/PROCESSING are
 * Data Pool states (scraper/AI phases), not Content Engine states
 * (ARCHITECTURE.md madde 5/10). DRAFT -> PUBLISHED is allowed directly so a
 * solo editor isn't forced through REVIEW/APPROVED; teams that want the
 * gate use it because REVIEW/APPROVED still exist as an available path.
 */
const TRANSITIONS: Record<ContentStatus, readonly ContentStatus[]> = {
  DRAFT: ["REVIEW", "PUBLISHED"],
  REVIEW: ["APPROVED", "DRAFT"],
  APPROVED: ["SCHEDULED", "PUBLISHED", "DRAFT"],
  SCHEDULED: ["PUBLISHED", "DRAFT"],
  PUBLISHED: ["ARCHIVED", "DRAFT"],
  ARCHIVED: ["DRAFT"],
};

export class InvalidContentTransitionError extends Error {
  constructor(from: ContentStatus, to: ContentStatus) {
    super(`Cannot transition content from ${from} to ${to}`);
  }
}

export function canTransitionContent(from: ContentStatus, to: ContentStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

export function assertValidContentTransition(from: ContentStatus, to: ContentStatus): void {
  if (!canTransitionContent(from, to)) {
    throw new InvalidContentTransitionError(from, to);
  }
}
