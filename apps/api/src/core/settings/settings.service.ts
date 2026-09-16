import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { schema, type Database } from "@2blog/core-database";
import { UPDATE_SETTINGS_SCHEMAS } from "@2blog/validation";
import type { SettingsCategory } from "@2blog/types";
import { DATABASE_CONNECTION } from "../database/database.constants";

@Injectable()
export class SettingsService {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  async getAll(): Promise<Record<string, Record<string, unknown>>> {
    const rows = await this.db.select().from(schema.settings);
    return Object.fromEntries(rows.map((row) => [row.category, row.values as Record<string, unknown>]));
  }

  async getCategory(category: SettingsCategory): Promise<Record<string, unknown>> {
    const [row] = await this.db.select().from(schema.settings).where(eq(schema.settings.category, category)).limit(1);
    return (row?.values as Record<string, unknown>) ?? {};
  }

  /** Merges onto whatever is already stored — a PATCH, not a replace. */
  async updateCategory(category: SettingsCategory, body: unknown, updatedBy: string): Promise<Record<string, unknown>> {
    const parsed = UPDATE_SETTINGS_SCHEMAS[category].safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        error: { code: "VALIDATION_ERROR", message: `Invalid ${category} settings`, details: parsed.error.flatten() },
      });
    }

    const existing = await this.getCategory(category);
    const merged = { ...existing, ...parsed.data };

    await this.db
      .insert(schema.settings)
      .values({ category, values: merged, updatedBy })
      .onConflictDoUpdate({ target: schema.settings.category, set: { values: merged, updatedAt: new Date(), updatedBy } });

    return merged;
  }
}
