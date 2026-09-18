import { Inject, Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { eq, inArray } from "drizzle-orm";
import { schema, type Database } from "@2blog/core-database";
import type { CreateToolInput, UpdateToolInput, ToolListQuery } from "@2blog/validation";
import type { Content, ContentStatus, CursorPage, Tool } from "@2blog/types";
import { DATABASE_CONNECTION } from "../../core/database/database.constants";
import { ContentService } from "../../core/content/content.service";

type ToolDetailsRow = typeof schema.toolDetails.$inferSelect;

const TYPE_KEY = "tool";

@Injectable()
export class ToolsService {
  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: Database,
    private readonly contentService: ContentService,
  ) {}

  async create(input: CreateToolInput, authorId: string): Promise<Tool> {
    const { embedUrl, category, instructions, ...contentFields } = input;

    const content = await this.contentService.create({ ...contentFields, typeKey: TYPE_KEY, extraFields: {} }, authorId, async (tx, contentId) => {
      await tx.insert(schema.toolDetails).values({ contentId, embedUrl, category, instructions });
    });

    return this.attachDetails(content);
  }

  async update(id: string, input: UpdateToolInput, editorId: string): Promise<Tool> {
    const { embedUrl, category, instructions, ...contentFields } = input;
    const hasDetailChanges = [embedUrl, category, instructions].some((value) => value !== undefined);

    const content = await this.contentService.update(
      await this.assertIsTool(id),
      contentFields,
      editorId,
      hasDetailChanges
        ? async (tx, contentId) => {
            await tx
              .update(schema.toolDetails)
              .set({
                ...(embedUrl !== undefined && { embedUrl }),
                ...(category !== undefined && { category }),
                ...(instructions !== undefined && { instructions }),
              })
              .where(eq(schema.toolDetails.contentId, contentId));
          }
        : undefined,
    );

    return this.attachDetails(content);
  }

  async transition(id: string, toStatus: ContentStatus, editorId: string): Promise<Tool> {
    const content = await this.contentService.transition(await this.assertIsTool(id), toStatus, editorId);
    return this.attachDetails(content);
  }

  async remove(id: string): Promise<void> {
    await this.contentService.softDelete(await this.assertIsTool(id));
  }

  async findById(id: string): Promise<Tool> {
    const content = await this.contentService.findById(await this.assertIsTool(id));
    return this.attachDetails(content);
  }

  async findPublicBySlug(slug: string): Promise<Tool> {
    const content = await this.contentService.findPublicBySlug(slug);
    if (content.typeKey !== TYPE_KEY) throw new NotFoundException("Tool not found");
    return this.attachDetails(content);
  }

  async list(query: ToolListQuery): Promise<CursorPage<Tool>> {
    const page = await this.contentService.list({ ...query, typeKey: TYPE_KEY });
    return { items: await this.attachDetailsMany(page.items), nextCursor: page.nextCursor };
  }

  async listPublic(query: ToolListQuery): Promise<CursorPage<Tool>> {
    const page = await this.contentService.listPublic({ ...query, typeKey: TYPE_KEY });
    return { items: await this.attachDetailsMany(page.items), nextCursor: page.nextCursor };
  }

  private async assertIsTool(id: string): Promise<string> {
    const content = await this.contentService.findById(id);
    if (content.typeKey !== TYPE_KEY) throw new NotFoundException("Tool not found");
    return id;
  }

  private async attachDetails(content: Content): Promise<Tool> {
    const [row] = await this.db.select().from(schema.toolDetails).where(eq(schema.toolDetails.contentId, content.id)).limit(1);
    if (!row) throw new InternalServerErrorException(`tool_details missing for content ${content.id}`);
    return this.merge(content, row);
  }

  private async attachDetailsMany(contents: Content[]): Promise<Tool[]> {
    if (contents.length === 0) return [];
    const ids = contents.map((c) => c.id);
    const rows = await this.db.select().from(schema.toolDetails).where(inArray(schema.toolDetails.contentId, ids));
    const byId = new Map(rows.map((row) => [row.contentId, row]));
    return contents.map((content) => {
      const row = byId.get(content.id);
      if (!row) throw new InternalServerErrorException(`tool_details missing for content ${content.id}`);
      return this.merge(content, row);
    });
  }

  private merge(content: Content, row: ToolDetailsRow): Tool {
    return {
      ...content,
      embedUrl: row.embedUrl,
      category: row.category,
      instructions: row.instructions,
    };
  }
}
