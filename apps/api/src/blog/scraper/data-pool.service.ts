import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { and, eq, gt, inArray } from "drizzle-orm";
import { schema, type Database } from "@2blog/core-database";
import type { DataPoolListQuery, RejectDataPoolItemInput, PublishDataPoolItemInput } from "@2blog/validation";
import type { CursorPage, DataPoolItem } from "@2blog/types";
import { DATABASE_CONNECTION } from "../../core/database/database.constants";
import { ContentService } from "../../core/content/content.service";

type ItemRow = typeof schema.dataPoolItems.$inferSelect;

@Injectable()
export class DataPoolService {
  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: Database,
    private readonly contentService: ContentService,
  ) {}

  async list(query: DataPoolListQuery): Promise<CursorPage<DataPoolItem>> {
    const limit = query.limit ?? 20;
    const conditions = [query.status ? eq(schema.dataPoolItems.status, query.status) : undefined, query.cursor ? gt(schema.dataPoolItems.id, query.cursor) : undefined].filter(
      (c): c is NonNullable<typeof c> => c !== undefined,
    );

    const rows = await this.db
      .select()
      .from(schema.dataPoolItems)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(schema.dataPoolItems.id)
      .limit(limit + 1);

    const page = rows.slice(0, limit);
    const nextCursor = rows.length > limit ? page[page.length - 1]!.id : null;
    const items = await this.attachSourceUrls(page);
    return { items, nextCursor };
  }

  async findById(id: string): Promise<DataPoolItem> {
    const [row] = await this.db.select().from(schema.dataPoolItems).where(eq(schema.dataPoolItems.id, id)).limit(1);
    if (!row) throw new NotFoundException("Data pool item not found");
    const [item] = await this.attachSourceUrls([row]);
    return item!;
  }

  async approve(id: string, userId: string): Promise<DataPoolItem> {
    const row = await this.assertStatus(id, "PROCESSED");
    const [updated] = await this.db
      .update(schema.dataPoolItems)
      .set({ status: "READY", reviewedBy: userId, reviewedAt: new Date(), updatedAt: new Date() })
      .where(eq(schema.dataPoolItems.id, row.id))
      .returning();
    const [item] = await this.attachSourceUrls([updated!]);
    return item!;
  }

  async reject(id: string, input: RejectDataPoolItemInput, userId: string): Promise<DataPoolItem> {
    const row = await this.assertStatus(id, "PROCESSED");
    const [updated] = await this.db
      .update(schema.dataPoolItems)
      .set({ status: "REJECTED", reviewedBy: userId, reviewedAt: new Date(), rejectionReason: input.reason, updatedAt: new Date() })
      .where(eq(schema.dataPoolItems.id, row.id))
      .returning();
    const [item] = await this.attachSourceUrls([updated!]);
    return item!;
  }

  async publish(id: string, input: PublishDataPoolItemInput, userId: string): Promise<DataPoolItem> {
    const row = await this.assertStatus(id, "READY");

    const content = await this.contentService.create(
      {
        title: row.title,
        slug: input.slug,
        excerpt: row.excerpt ?? undefined,
        body: row.body ?? undefined,
        coverImage: row.coverImage ?? undefined,
        typeKey: row.typeKey,
        extraFields: {},
        categoryIds: [],
        tagIds: [],
        noindex: false,
      },
      userId,
    );

    const [updated] = await this.db
      .update(schema.dataPoolItems)
      .set({ status: "PUBLISHED", contentId: content.id, slug: input.slug, updatedAt: new Date() })
      .where(eq(schema.dataPoolItems.id, row.id))
      .returning();
    const [item] = await this.attachSourceUrls([updated!]);
    return item!;
  }

  private async assertStatus(id: string, expected: ItemRow["status"]): Promise<ItemRow> {
    const [row] = await this.db.select().from(schema.dataPoolItems).where(eq(schema.dataPoolItems.id, id)).limit(1);
    if (!row) throw new NotFoundException("Data pool item not found");
    if (row.status !== expected) {
      throw new BadRequestException(`Item is ${row.status}, expected ${expected}`);
    }
    return row;
  }

  private async attachSourceUrls(rows: ItemRow[]): Promise<DataPoolItem[]> {
    if (rows.length === 0) return [];
    const rawIds = rows.map((row) => row.rawDataItemId);
    const rawRows = await this.db
      .select({ id: schema.rawDataItems.id, sourceUrl: schema.rawDataItems.sourceUrl })
      .from(schema.rawDataItems)
      .where(inArray(schema.rawDataItems.id, rawIds));
    const byId = new Map(rawRows.map((r) => [r.id, r.sourceUrl]));
    return rows.map((row) => this.toApiShape(row, byId.get(row.rawDataItemId) ?? ""));
  }

  private toApiShape(row: ItemRow, sourceUrl: string): DataPoolItem {
    return {
      id: row.id,
      rawDataItemId: row.rawDataItemId,
      sourceId: row.sourceId,
      typeKey: row.typeKey,
      title: row.title,
      slug: row.slug,
      excerpt: row.excerpt,
      body: row.body,
      coverImage: row.coverImage,
      status: row.status,
      contentId: row.contentId,
      reviewedBy: row.reviewedBy,
      reviewedAt: row.reviewedAt?.toISOString() ?? null,
      rejectionReason: row.rejectionReason,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      sourceUrl,
    };
  }
}
