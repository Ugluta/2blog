import { ConflictException, Inject, Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { schema, type Database } from "@2blog/core-database";
import type { ServiceCategory } from "@2blog/types";
import { DATABASE_CONNECTION } from "../../core/database/database.constants";

@Injectable()
export class ServiceCategoriesService {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  async list(): Promise<ServiceCategory[]> {
    return this.db.select().from(schema.serviceCategories).orderBy(schema.serviceCategories.slug);
  }

  async create(slug: string, name: string, description?: string): Promise<ServiceCategory> {
    const existing = await this.db.select().from(schema.serviceCategories).where(eq(schema.serviceCategories.slug, slug)).limit(1);
    if (existing.length > 0) throw new ConflictException(`Service category "${slug}" already exists`);
    const [category] = await this.db.insert(schema.serviceCategories).values({ slug, name, description }).returning();
    return category!;
  }
}
