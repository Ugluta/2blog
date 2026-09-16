import { ConflictException, Inject, Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { schema, type Database } from "@2blog/core-database";
import type { Category, Tag } from "@2blog/types";
import { DATABASE_CONNECTION } from "../database/database.constants";

@Injectable()
export class TaxonomyService {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  async listCategories(): Promise<Category[]> {
    return this.db.select().from(schema.categories).orderBy(schema.categories.slug);
  }

  async createCategory(slug: string, name: string, description?: string): Promise<Category> {
    const existing = await this.db.select().from(schema.categories).where(eq(schema.categories.slug, slug)).limit(1);
    if (existing.length > 0) throw new ConflictException(`Category "${slug}" already exists`);
    const [category] = await this.db.insert(schema.categories).values({ slug, name, description }).returning();
    return category!;
  }

  async listTags(): Promise<Tag[]> {
    return this.db.select().from(schema.tags).orderBy(schema.tags.slug);
  }

  async createTag(slug: string, name: string): Promise<Tag> {
    const existing = await this.db.select().from(schema.tags).where(eq(schema.tags.slug, slug)).limit(1);
    if (existing.length > 0) throw new ConflictException(`Tag "${slug}" already exists`);
    const [tag] = await this.db.insert(schema.tags).values({ slug, name }).returning();
    return tag!;
  }
}
