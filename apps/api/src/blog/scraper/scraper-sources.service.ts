import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { schema, type Database } from "@2blog/core-database";
import type { CreateScraperSourceInput, UpdateScraperSourceInput } from "@2blog/validation";
import type { ScraperSource } from "@2blog/types";
import { eq } from "drizzle-orm";
import { DATABASE_CONNECTION } from "../../core/database/database.constants";

type SourceRow = typeof schema.scraperSources.$inferSelect;

@Injectable()
export class ScraperSourcesService {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  async list(): Promise<ScraperSource[]> {
    const rows = await this.db.select().from(schema.scraperSources).orderBy(schema.scraperSources.createdAt);
    return rows.map(this.toApiShape);
  }

  async findById(id: string): Promise<ScraperSource> {
    const [row] = await this.db.select().from(schema.scraperSources).where(eq(schema.scraperSources.id, id)).limit(1);
    if (!row) throw new NotFoundException("Scraper source not found");
    return this.toApiShape(row);
  }

  async create(input: CreateScraperSourceInput): Promise<ScraperSource> {
    const [row] = await this.db.insert(schema.scraperSources).values(input).returning();
    return this.toApiShape(row!);
  }

  async update(id: string, input: UpdateScraperSourceInput): Promise<ScraperSource> {
    const [row] = await this.db
      .update(schema.scraperSources)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(schema.scraperSources.id, id))
      .returning();
    if (!row) throw new NotFoundException("Scraper source not found");
    return this.toApiShape(row);
  }

  private toApiShape(row: SourceRow): ScraperSource {
    return {
      id: row.id,
      name: row.name,
      baseUrl: row.baseUrl,
      listUrl: row.listUrl,
      listItemSelector: row.listItemSelector,
      typeKey: row.typeKey,
      scheduleCron: row.scheduleCron,
      isEnabled: row.isEnabled,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
