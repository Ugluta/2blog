import type { Content } from "./content";

export const PROJECT_STATUSES = ["CONCEPT", "PLANNING", "DEVELOPMENT", "COMPLETED", "MAINTENANCE", "ARCHIVED"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

/**
 * `status` (from Content) is the editorial workflow; `projectStatus` is the
 * project's own real-world lifecycle — the two are independent on purpose.
 */
export interface Project extends Content {
  problem: string | null;
  solution: string | null;
  technologies: string[];
  demoUrl: string | null;
  repoUrl: string | null;
  clientName: string | null;
  startDate: string | null;
  endDate: string | null;
  projectStatus: ProjectStatus;
  results: string | null;
}
