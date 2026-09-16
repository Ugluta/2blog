import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { and, eq, gt, inArray, isNull } from "drizzle-orm";
import { schema, type Database } from "@2blog/core-database";
import { ContentTypeRegistry, UnknownContentTypeError, assertValidContentTransition, InvalidContentTransitionError } from "@2blog/core-content-engine";
import type {
  CreateContentInput,
  UpdateContentInput,
  ContentListQuery,
  PublicContentListQuery,
} from "@2blog/validation";
import type { Content, ContentStatus, CursorPage } from "@2blog/types";
import { DATABASE_CONNECTION } from "../database/database.constants";
import { CONTENT_TYPE_REGISTRY } from "./content-type-registry.constants";

type ContentRow = typeof schema.contents.$inferSelect;

@Injectable()
export class ContentService {
  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: Database,
    @Inject(CONTENT_TYPE_REGISTRY) private readonly typeRegistry: ContentTypeRegistry,
  ) {}

  async create(input: CreateContentInput, authorId: string): Promise<Content> {
    const definition = this.getTypeDefinitionOrThrow(input.typeKey);
    const parsedExtra = definition.extraFieldsSchema.safeParse(input.extraFields);
    if (!parsedExtra.success) {
      throw new BadRequestException({
        error: { code: "VALIDATION_ERROR", message: "Invalid extraFields for this content type", details: parsedExtra.error.flatten() },
      });
    }
    await this.assertTaxonomyExists(input.categoryIds, input.tagIds);

    const existingSlug = await this.db.select({ id: schema.contents.id }).from(schema.contents).where(eq(schema.contents.slug, input.slug)).limit(1);
    if (existingSlug[0]) {
      throw new ConflictException(`Content with slug "${input.slug}" already exists`);
    }

    const row = await this.db.transaction(async (tx) => {
      const [created] = await tx
        .insert(schema.contents)
        .values({
          typeKey: input.typeKey,
          title: input.title,
          slug: input.slug,
          excerpt: input.excerpt,
          body: input.body,
          coverImage: input.coverImage,
          seoTitle: input.seoTitle,
          seoDescription: input.seoDescription,
          canonicalUrl: input.canonicalUrl,
          noindex: input.noindex,
          authorId,
        })
        .returning();

      await this.syncTaxonomies(tx, created!.id, input.categoryIds, input.tagIds);
      await this.snapshotRevision(tx, created!, authorId);
      return created!;
    });

    return this.serialize(row);
  }

  async update(id: string, input: UpdateContentInput, editorId: string): Promise<Content> {
    const existing = await this.getRowOrThrow(id);
    if (input.categoryIds || input.tagIds) {
      await this.assertTaxonomyExists(input.categoryIds, input.tagIds);
    }

    const row = await this.db.transaction(async (tx) => {
      const [updated] = await tx
        .update(schema.contents)
        .set({
          ...(input.title !== undefined && { title: input.title }),
          ...(input.excerpt !== undefined && { excerpt: input.excerpt }),
          ...(input.body !== undefined && { body: input.body }),
          ...(input.coverImage !== undefined && { coverImage: input.coverImage }),
          ...(input.seoTitle !== undefined && { seoTitle: input.seoTitle }),
          ...(input.seoDescription !== undefined && { seoDescription: input.seoDescription }),
          ...(input.canonicalUrl !== undefined && { canonicalUrl: input.canonicalUrl }),
          ...(input.noindex !== undefined && { noindex: input.noindex }),
          updatedAt: new Date(),
        })
        .where(eq(schema.contents.id, existing.id))
        .returning();

      if (input.categoryIds || input.tagIds) {
        await this.syncTaxonomies(tx, existing.id, input.categoryIds ?? [], input.tagIds ?? [], {
          replaceCategories: Boolean(input.categoryIds),
          replaceTags: Boolean(input.tagIds),
        });
      }
      await this.snapshotRevision(tx, updated!, editorId);
      return updated!;
    });

    return this.serialize(row);
  }

  async transition(id: string, toStatus: ContentStatus, editorId: string): Promise<Content> {
    const existing = await this.getRowOrThrow(id);
    try {
      assertValidContentTransition(existing.status, toStatus);
    } catch (error) {
      if (error instanceof InvalidContentTransitionError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }

    const row = await this.db.transaction(async (tx) => {
      const [updated] = await tx
        .update(schema.contents)
        .set({
          status: toStatus,
          publishedAt: toStatus === "PUBLISHED" && !existing.publishedAt ? new Date() : existing.publishedAt,
          updatedAt: new Date(),
        })
        .where(eq(schema.contents.id, existing.id))
        .returning();
      await this.snapshotRevision(tx, updated!, editorId);
      return updated!;
    });

    return this.serialize(row);
  }

  async softDelete(id: string): Promise<void> {
    await this.getRowOrThrow(id);
    await this.db.update(schema.contents).set({ deletedAt: new Date() }).where(eq(schema.contents.id, id));
  }

  async findById(id: string): Promise<Content> {
    return this.serialize(await this.getRowOrThrow(id));
  }

  async findPublicBySlug(slug: string): Promise<Content> {
    const rows = await this.db
      .select()
      .from(schema.contents)
      .where(and(eq(schema.contents.slug, slug), eq(schema.contents.status, "PUBLISHED"), isNull(schema.contents.deletedAt)))
      .limit(1);
    if (!rows[0]) throw new NotFoundException("Content not found");
    return this.serialize(rows[0]);
  }

  async list(query: ContentListQuery): Promise<CursorPage<Content>> {
    return this.listInternal(query.limit, query.cursor, query.typeKey, query.status, query.categoryId);
  }

  async listPublic(query: PublicContentListQuery): Promise<CursorPage<Content>> {
    return this.listInternal(query.limit, query.cursor, query.typeKey, "PUBLISHED", query.categoryId);
  }

  private async listInternal(
    limit: number,
    cursor: string | undefined,
    typeKey: string | undefined,
    status: ContentStatus | undefined,
    categoryId: string | undefined,
  ): Promise<CursorPage<Content>> {
    const conditions = [isNull(schema.contents.deletedAt)];
    if (cursor) conditions.push(gt(schema.contents.id, cursor));
    if (typeKey) conditions.push(eq(schema.contents.typeKey, typeKey));
    if (status) conditions.push(eq(schema.contents.status, status));

    let contentIdsForCategory: string[] | null = null;
    if (categoryId) {
      const rows = await this.db
        .select({ contentId: schema.contentCategories.contentId })
        .from(schema.contentCategories)
        .where(eq(schema.contentCategories.categoryId, categoryId));
      contentIdsForCategory = rows.map((r) => r.contentId);
      if (contentIdsForCategory.length === 0) return { items: [], nextCursor: null };
      conditions.push(inArray(schema.contents.id, contentIdsForCategory));
    }

    const rows = await this.db
      .select()
      .from(schema.contents)
      .where(and(...conditions))
      .orderBy(schema.contents.id)
      .limit(limit + 1);

    const page = rows.slice(0, limit);
    const nextCursor = rows.length > limit ? page[page.length - 1]!.id : null;
    const items = await this.serializeMany(page);
    return { items, nextCursor };
  }

  private getTypeDefinitionOrThrow(typeKey: string) {
    try {
      return this.typeRegistry.get(typeKey);
    } catch (error) {
      if (error instanceof UnknownContentTypeError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  private async getRowOrThrow(id: string): Promise<ContentRow> {
    const rows = await this.db
      .select()
      .from(schema.contents)
      .where(and(eq(schema.contents.id, id), isNull(schema.contents.deletedAt)))
      .limit(1);
    if (!rows[0]) throw new NotFoundException("Content not found");
    return rows[0];
  }

  private async assertTaxonomyExists(categoryIds: string[] = [], tagIds: string[] = []): Promise<void> {
    if (categoryIds.length > 0) {
      const found = await this.db.select({ id: schema.categories.id }).from(schema.categories).where(inArray(schema.categories.id, categoryIds));
      if (found.length !== new Set(categoryIds).size) {
        throw new BadRequestException("One or more categoryIds do not exist");
      }
    }
    if (tagIds.length > 0) {
      const found = await this.db.select({ id: schema.tags.id }).from(schema.tags).where(inArray(schema.tags.id, tagIds));
      if (found.length !== new Set(tagIds).size) {
        throw new BadRequestException("One or more tagIds do not exist");
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async syncTaxonomies(
    tx: any,
    contentId: string,
    categoryIds: string[],
    tagIds: string[],
    options: { replaceCategories: boolean; replaceTags: boolean } = { replaceCategories: true, replaceTags: true },
  ): Promise<void> {
    if (options.replaceCategories) {
      await tx.delete(schema.contentCategories).where(eq(schema.contentCategories.contentId, contentId));
      if (categoryIds.length > 0) {
        await tx.insert(schema.contentCategories).values(categoryIds.map((categoryId) => ({ contentId, categoryId })));
      }
    }
    if (options.replaceTags) {
      await tx.delete(schema.contentTags).where(eq(schema.contentTags.contentId, contentId));
      if (tagIds.length > 0) {
        await tx.insert(schema.contentTags).values(tagIds.map((tagId) => ({ contentId, tagId })));
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async snapshotRevision(tx: any, row: ContentRow, editedBy: string): Promise<void> {
    await tx.insert(schema.contentRevisions).values({
      contentId: row.id,
      title: row.title,
      excerpt: row.excerpt,
      body: row.body,
      status: row.status,
      editedBy,
    });
  }

  private async serialize(row: ContentRow): Promise<Content> {
    const [items] = await this.serializeMany([row]);
    return items!;
  }

  private async serializeMany(rows: ContentRow[]): Promise<Content[]> {
    if (rows.length === 0) return [];
    const ids = rows.map((row) => row.id);

    const categoryRows = await this.db
      .select({ contentId: schema.contentCategories.contentId, category: schema.categories })
      .from(schema.contentCategories)
      .innerJoin(schema.categories, eq(schema.contentCategories.categoryId, schema.categories.id))
      .where(inArray(schema.contentCategories.contentId, ids));

    const tagRows = await this.db
      .select({ contentId: schema.contentTags.contentId, tag: schema.tags })
      .from(schema.contentTags)
      .innerJoin(schema.tags, eq(schema.contentTags.tagId, schema.tags.id))
      .where(inArray(schema.contentTags.contentId, ids));

    return rows.map((row) => ({
      id: row.id,
      typeKey: row.typeKey,
      title: row.title,
      slug: row.slug,
      excerpt: row.excerpt,
      body: row.body,
      status: row.status,
      authorId: row.authorId,
      coverImage: row.coverImage,
      seoTitle: row.seoTitle,
      seoDescription: row.seoDescription,
      canonicalUrl: row.canonicalUrl,
      noindex: row.noindex,
      publishedAt: row.publishedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      categories: categoryRows.filter((c) => c.contentId === row.id).map((c) => c.category),
      tags: tagRows.filter((t) => t.contentId === row.id).map((t) => t.tag),
    }));
  }
}
