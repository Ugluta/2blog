import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { schema, type Database } from "@2blog/core-database";
import type { CreateScraperRuleInput } from "@2blog/validation";
import type { ScraperRule } from "@2blog/types";
import { DATABASE_CONNECTION } from "../../core/database/database.constants";

type RuleRow = typeof schema.scraperRules.$inferSelect;

@Injectable()
export class ScraperRulesService {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  async listBySource(sourceId: string): Promise<ScraperRule[]> {
    const rows = await this.db.select().from(schema.scraperRules).where(eq(schema.scraperRules.sourceId, sourceId)).orderBy(schema.scraperRules.createdAt);
    return rows.map(this.toApiShape);
  }

  async create(input: CreateScraperRuleInput): Promise<ScraperRule> {
    const [source] = await this.db.select({ id: schema.scraperSources.id }).from(schema.scraperSources).where(eq(schema.scraperSources.id, input.sourceId)).limit(1);
    if (!source) throw new NotFoundException("Scraper source not found");

    const [row] = await this.db.insert(schema.scraperRules).values(input).returning();
    return this.toApiShape(row!);
  }

  private toApiShape(row: RuleRow): ScraperRule {
    return {
      id: row.id,
      sourceId: row.sourceId,
      name: row.name,
      titleSelector: row.titleSelector,
      bodySelector: row.bodySelector,
      excerptSelector: row.excerptSelector,
      coverImageSelector: row.coverImageSelector,
      coverImageAttr: row.coverImageAttr,
      isEnabled: row.isEnabled,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
