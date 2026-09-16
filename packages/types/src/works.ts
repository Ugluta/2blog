import type { Content } from "./content";

export interface WorkLink {
  label: string;
  url: string;
}

export interface Work extends Content {
  category: string | null;
  technologies: string[];
  result: string | null;
  links: WorkLink[];
  workDate: string | null;
}
