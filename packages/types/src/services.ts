import type { Content } from "./content";

export interface ServiceCategory {
  id: string;
  slug: string;
  name: string;
  description: string | null;
}

export interface ServiceFaqEntry {
  question: string;
  answer: string;
}

export interface Service extends Content {
  category: ServiceCategory | null;
  features: string[];
  process: string[];
  faq: ServiceFaqEntry[];
  ctaLabel: string | null;
  ctaUrl: string | null;
}
