export interface PromptTemplate {
  key: string;
  version: number;
  /** `{{variableName}}` placeholders, replaced with `variables[variableName]`. */
  template: string;
}

/**
 * "merkezi, versiyonlu promptlar" (ARCHITECTURE.md madde 12) — a domain
 * module registers its prompts here the same way BlogModule registers
 * content types with ContentTypeRegistry, so Core never hard-codes what a
 * "blog post draft" prompt should say.
 */
export class PromptRegistry {
  private readonly templates = new Map<string, PromptTemplate>();

  register(template: PromptTemplate): void {
    this.templates.set(`${template.key}@${template.version}`, template);
  }

  /** Picks the highest registered version for `key` — the "latest" a caller means by just naming the key. */
  getLatest(key: string): PromptTemplate | undefined {
    let latest: PromptTemplate | undefined;
    for (const template of this.templates.values()) {
      if (template.key === key && (!latest || template.version > latest.version)) {
        latest = template;
      }
    }
    return latest;
  }

  render(key: string, variables: Record<string, string>): string {
    const template = this.getLatest(key);
    if (!template) throw new Error(`No prompt template registered for "${key}"`);
    return template.template.replace(/\{\{(\w+)\}\}/g, (match, name: string) => variables[name] ?? match);
  }
}
