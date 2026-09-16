import { Inject, Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { eq, inArray } from "drizzle-orm";
import { schema, type Database } from "@2blog/core-database";
import type { CreateServiceInput, UpdateServiceInput, ServiceListQuery } from "@2blog/validation";
import type { Content, ContentStatus, CursorPage, Service } from "@2blog/types";
import { DATABASE_CONNECTION } from "../../core/database/database.constants";
import { ContentService } from "../../core/content/content.service";

type ServiceDetailsRow = typeof schema.serviceDetails.$inferSelect;

const TYPE_KEY = "service";

@Injectable()
export class ServicesService {
  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: Database,
    private readonly contentService: ContentService,
  ) {}

  async create(input: CreateServiceInput, authorId: string): Promise<Service> {
    const { categoryId, features, process, faq, ctaLabel, ctaUrl, ...contentFields } = input;

    const content = await this.contentService.create({ ...contentFields, typeKey: TYPE_KEY, extraFields: {} }, authorId, async (tx, contentId) => {
      await tx.insert(schema.serviceDetails).values({ contentId, categoryId, features, process, faq, ctaLabel, ctaUrl });
    });

    return this.attachDetails(content);
  }

  async update(id: string, input: UpdateServiceInput, editorId: string): Promise<Service> {
    const { categoryId, features, process, faq, ctaLabel, ctaUrl, ...contentFields } = input;
    const hasDetailChanges = [categoryId, features, process, faq, ctaLabel, ctaUrl].some((value) => value !== undefined);

    const content = await this.contentService.update(
      await this.assertIsService(id),
      contentFields,
      editorId,
      hasDetailChanges
        ? async (tx, contentId) => {
            await tx
              .update(schema.serviceDetails)
              .set({
                ...(categoryId !== undefined && { categoryId }),
                ...(features !== undefined && { features }),
                ...(process !== undefined && { process }),
                ...(faq !== undefined && { faq }),
                ...(ctaLabel !== undefined && { ctaLabel }),
                ...(ctaUrl !== undefined && { ctaUrl }),
              })
              .where(eq(schema.serviceDetails.contentId, contentId));
          }
        : undefined,
    );

    return this.attachDetails(content);
  }

  async transition(id: string, toStatus: ContentStatus, editorId: string): Promise<Service> {
    const content = await this.contentService.transition(await this.assertIsService(id), toStatus, editorId);
    return this.attachDetails(content);
  }

  async remove(id: string): Promise<void> {
    await this.contentService.softDelete(await this.assertIsService(id));
  }

  async findById(id: string): Promise<Service> {
    const content = await this.contentService.findById(await this.assertIsService(id));
    return this.attachDetails(content);
  }

  async findPublicBySlug(slug: string): Promise<Service> {
    const content = await this.contentService.findPublicBySlug(slug);
    if (content.typeKey !== TYPE_KEY) throw new NotFoundException("Service not found");
    return this.attachDetails(content);
  }

  async list(query: ServiceListQuery): Promise<CursorPage<Service>> {
    const restrictToIds = query.categoryId ? await this.contentIdsForCategory(query.categoryId) : undefined;
    const page = await this.contentService.list({ cursor: query.cursor, limit: query.limit, typeKey: TYPE_KEY }, restrictToIds);
    return { items: await this.attachDetailsMany(page.items), nextCursor: page.nextCursor };
  }

  async listPublic(query: ServiceListQuery): Promise<CursorPage<Service>> {
    const restrictToIds = query.categoryId ? await this.contentIdsForCategory(query.categoryId) : undefined;
    const page = await this.contentService.listPublic({ cursor: query.cursor, limit: query.limit, typeKey: TYPE_KEY }, restrictToIds);
    return { items: await this.attachDetailsMany(page.items), nextCursor: page.nextCursor };
  }

  /** service_details.categoryId (its own taxonomy), not Core's generic content_categories. */
  private async contentIdsForCategory(categoryId: string): Promise<string[]> {
    const rows = await this.db
      .select({ contentId: schema.serviceDetails.contentId })
      .from(schema.serviceDetails)
      .where(eq(schema.serviceDetails.categoryId, categoryId));
    return rows.map((row) => row.contentId);
  }

  private async assertIsService(id: string): Promise<string> {
    const content = await this.contentService.findById(id);
    if (content.typeKey !== TYPE_KEY) throw new NotFoundException("Service not found");
    return id;
  }

  private async attachDetails(content: Content): Promise<Service> {
    const [row] = await this.db.select().from(schema.serviceDetails).where(eq(schema.serviceDetails.contentId, content.id)).limit(1);
    if (!row) throw new InternalServerErrorException(`service_details missing for content ${content.id}`);
    const category = await this.resolveCategory(row.categoryId);
    return this.merge(content, row, category);
  }

  private async attachDetailsMany(contents: Content[]): Promise<Service[]> {
    if (contents.length === 0) return [];
    const ids = contents.map((c) => c.id);
    const rows = await this.db.select().from(schema.serviceDetails).where(inArray(schema.serviceDetails.contentId, ids));
    const byId = new Map(rows.map((row) => [row.contentId, row]));

    const categoryIds = [...new Set(rows.map((row) => row.categoryId).filter((id): id is string => id !== null))];
    const categories = categoryIds.length > 0 ? await this.db.select().from(schema.serviceCategories).where(inArray(schema.serviceCategories.id, categoryIds)) : [];
    const categoriesById = new Map(categories.map((c) => [c.id, c]));

    return contents.map((content) => {
      const row = byId.get(content.id);
      if (!row) throw new InternalServerErrorException(`service_details missing for content ${content.id}`);
      return this.merge(content, row, row.categoryId ? (categoriesById.get(row.categoryId) ?? null) : null);
    });
  }

  private async resolveCategory(categoryId: string | null) {
    if (!categoryId) return null;
    const [category] = await this.db.select().from(schema.serviceCategories).where(eq(schema.serviceCategories.id, categoryId)).limit(1);
    return category ?? null;
  }

  private merge(content: Content, row: ServiceDetailsRow, category: typeof schema.serviceCategories.$inferSelect | null): Service {
    return {
      ...content,
      category,
      features: row.features,
      process: row.process,
      faq: row.faq,
      ctaLabel: row.ctaLabel,
      ctaUrl: row.ctaUrl,
    };
  }
}
