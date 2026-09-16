import type { ZodType } from "zod";

/**
 * A content type is "registered", not hard-coded (ARCHITECTURE.md madde 5) —
 * Core never lists Post/Project/Track/Document itself. Each domain module
 * (Blog, Evrak, ...) calls register() for its own types at bootstrap; the
 * generic Content Engine controller only ever sees typeKey strings and asks
 * this registry whether one is known and what its extra-field shape is.
 */
export interface ContentTypeDefinition {
  key: string;
  label: string;
  /** Extra, type-specific fields beyond the generic content columns. Use z.object({}) for none. */
  extraFieldsSchema: ZodType;
}

export class ContentTypeAlreadyRegisteredError extends Error {
  constructor(key: string) {
    super(`Content type "${key}" is already registered`);
  }
}

export class UnknownContentTypeError extends Error {
  constructor(key: string) {
    super(`Content type "${key}" is not registered`);
  }
}

export class ContentTypeRegistry {
  private readonly types = new Map<string, ContentTypeDefinition>();

  register(definition: ContentTypeDefinition): void {
    if (this.types.has(definition.key)) {
      throw new ContentTypeAlreadyRegisteredError(definition.key);
    }
    this.types.set(definition.key, definition);
  }

  get(key: string): ContentTypeDefinition {
    const definition = this.types.get(key);
    if (!definition) {
      throw new UnknownContentTypeError(key);
    }
    return definition;
  }

  has(key: string): boolean {
    return this.types.has(key);
  }

  list(): ContentTypeDefinition[] {
    return [...this.types.values()];
  }
}
