import type { Content } from "./content";

export interface Tool extends Content {
  embedUrl: string;
  category: string | null;
  instructions: string | null;
}
