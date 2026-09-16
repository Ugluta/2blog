import { Inject, Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { eq, inArray } from "drizzle-orm";
import { schema, type Database } from "@2blog/core-database";
import type { CreateWorkInput, UpdateWorkInput, WorkListQuery } from "@2blog/validation";
import type { Content, ContentStatus, CursorPage, Work } from "@2blog/types";
import { DATABASE_CONNECTION } from "../../core/database/database.constants";
import { ContentService } from "../../core/content/content.service";

type WorkDetailsRow = typeof schema.workDetails.$inferSelect;

const TYPE_KEY = "work";

@Injectable()
export class WorksService {
  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: Database,
    private readonly contentService: ContentService,
  ) {}

  async create(input: CreateWorkInput, authorId: string): Promise<Work> {
    const { category, technologies, result, links, workDate, ...contentFields } = input;

    const content = await this.contentService.create({ ...contentFields, typeKey: TYPE_KEY, extraFields: {} }, authorId, async (tx, contentId) => {
      await tx.insert(schema.workDetails).values({ contentId, category, technologies, result, links, workDate });
    });

    return this.attachDetails(content);
  }

  async update(id: string, input: UpdateWorkInput, editorId: string): Promise<Work> {
    const { category, technologies, result, links, workDate, ...contentFields } = input;
    const hasDetailChanges = [category, technologies, result, links, workDate].some((value) => value !== undefined);

    const content = await this.contentService.update(
      await this.assertIsWork(id),
      contentFields,
      editorId,
      hasDetailChanges
        ? async (tx, contentId) => {
            await tx
              .update(schema.workDetails)
              .set({
                ...(category !== undefined && { category }),
                ...(technologies !== undefined && { technologies }),
                ...(result !== undefined && { result }),
                ...(links !== undefined && { links }),
                ...(workDate !== undefined && { workDate }),
              })
              .where(eq(schema.workDetails.contentId, contentId));
          }
        : undefined,
    );

    return this.attachDetails(content);
  }

  async transition(id: string, toStatus: ContentStatus, editorId: string): Promise<Work> {
    const content = await this.contentService.transition(await this.assertIsWork(id), toStatus, editorId);
    return this.attachDetails(content);
  }

  async remove(id: string): Promise<void> {
    await this.contentService.softDelete(await this.assertIsWork(id));
  }

  async findById(id: string): Promise<Work> {
    const content = await this.contentService.findById(await this.assertIsWork(id));
    return this.attachDetails(content);
  }

  async findPublicBySlug(slug: string): Promise<Work> {
    const content = await this.contentService.findPublicBySlug(slug);
    if (content.typeKey !== TYPE_KEY) throw new NotFoundException("Work not found");
    return this.attachDetails(content);
  }

  async list(query: WorkListQuery): Promise<CursorPage<Work>> {
    const page = await this.contentService.list({ ...query, typeKey: TYPE_KEY });
    return { items: await this.attachDetailsMany(page.items), nextCursor: page.nextCursor };
  }

  async listPublic(query: WorkListQuery): Promise<CursorPage<Work>> {
    const page = await this.contentService.listPublic({ ...query, typeKey: TYPE_KEY });
    return { items: await this.attachDetailsMany(page.items), nextCursor: page.nextCursor };
  }

  private async assertIsWork(id: string): Promise<string> {
    const content = await this.contentService.findById(id);
    if (content.typeKey !== TYPE_KEY) throw new NotFoundException("Work not found");
    return id;
  }

  private async attachDetails(content: Content): Promise<Work> {
    const [row] = await this.db.select().from(schema.workDetails).where(eq(schema.workDetails.contentId, content.id)).limit(1);
    if (!row) throw new InternalServerErrorException(`work_details missing for content ${content.id}`);
    return this.merge(content, row);
  }

  private async attachDetailsMany(contents: Content[]): Promise<Work[]> {
    if (contents.length === 0) return [];
    const ids = contents.map((c) => c.id);
    const rows = await this.db.select().from(schema.workDetails).where(inArray(schema.workDetails.contentId, ids));
    const byId = new Map(rows.map((row) => [row.contentId, row]));
    return contents.map((content) => {
      const row = byId.get(content.id);
      if (!row) throw new InternalServerErrorException(`work_details missing for content ${content.id}`);
      return this.merge(content, row);
    });
  }

  private merge(content: Content, row: WorkDetailsRow): Work {
    return {
      ...content,
      category: row.category,
      technologies: row.technologies,
      result: row.result,
      links: row.links,
      workDate: row.workDate,
    };
  }
}
