import { Inject, Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { eq, inArray } from "drizzle-orm";
import { schema, type Database } from "@2blog/core-database";
import type { CreateProjectInput, UpdateProjectInput, ProjectListQuery } from "@2blog/validation";
import type { Content, ContentStatus, CursorPage, Project } from "@2blog/types";
import { DATABASE_CONNECTION } from "../../core/database/database.constants";
import { ContentService } from "../../core/content/content.service";

type ProjectDetailsRow = typeof schema.projectDetails.$inferSelect;

const TYPE_KEY = "project";

@Injectable()
export class ProjectsService {
  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: Database,
    private readonly contentService: ContentService,
  ) {}

  async create(input: CreateProjectInput, authorId: string): Promise<Project> {
    const { problem, solution, technologies, demoUrl, repoUrl, clientName, startDate, endDate, projectStatus, results, ...contentFields } =
      input;

    const content = await this.contentService.create({ ...contentFields, typeKey: TYPE_KEY, extraFields: {} }, authorId, async (tx, contentId) => {
      await tx.insert(schema.projectDetails).values({
        contentId,
        problem,
        solution,
        technologies,
        demoUrl,
        repoUrl,
        clientName,
        startDate,
        endDate,
        projectStatus,
        results,
      });
    });

    return this.attachDetails(content);
  }

  async update(id: string, input: UpdateProjectInput, editorId: string): Promise<Project> {
    const { problem, solution, technologies, demoUrl, repoUrl, clientName, startDate, endDate, projectStatus, results, ...contentFields } =
      input;
    const hasDetailChanges = [problem, solution, technologies, demoUrl, repoUrl, clientName, startDate, endDate, projectStatus, results].some(
      (value) => value !== undefined,
    );

    const content = await this.contentService.update(
      await this.assertIsProject(id),
      contentFields,
      editorId,
      hasDetailChanges
        ? async (tx, contentId) => {
            await tx
              .update(schema.projectDetails)
              .set({
                ...(problem !== undefined && { problem }),
                ...(solution !== undefined && { solution }),
                ...(technologies !== undefined && { technologies }),
                ...(demoUrl !== undefined && { demoUrl }),
                ...(repoUrl !== undefined && { repoUrl }),
                ...(clientName !== undefined && { clientName }),
                ...(startDate !== undefined && { startDate }),
                ...(endDate !== undefined && { endDate }),
                ...(projectStatus !== undefined && { projectStatus }),
                ...(results !== undefined && { results }),
              })
              .where(eq(schema.projectDetails.contentId, contentId));
          }
        : undefined,
    );

    return this.attachDetails(content);
  }

  async transition(id: string, toStatus: ContentStatus, editorId: string): Promise<Project> {
    const content = await this.contentService.transition(await this.assertIsProject(id), toStatus, editorId);
    return this.attachDetails(content);
  }

  async remove(id: string): Promise<void> {
    await this.contentService.softDelete(await this.assertIsProject(id));
  }

  async findById(id: string): Promise<Project> {
    const content = await this.contentService.findById(await this.assertIsProject(id));
    return this.attachDetails(content);
  }

  async findPublicBySlug(slug: string): Promise<Project> {
    const content = await this.contentService.findPublicBySlug(slug);
    if (content.typeKey !== TYPE_KEY) throw new NotFoundException("Project not found");
    return this.attachDetails(content);
  }

  async list(query: ProjectListQuery): Promise<CursorPage<Project>> {
    const page = await this.contentService.list({ ...query, typeKey: TYPE_KEY });
    return { items: await this.attachDetailsMany(page.items), nextCursor: page.nextCursor };
  }

  async listPublic(query: ProjectListQuery): Promise<CursorPage<Project>> {
    const page = await this.contentService.listPublic({ ...query, typeKey: TYPE_KEY });
    return { items: await this.attachDetailsMany(page.items), nextCursor: page.nextCursor };
  }

  /** Content Engine IDs aren't type-scoped — this stops a project_details write/read from landing on a "post" or "service" row. */
  private async assertIsProject(id: string): Promise<string> {
    const content = await this.contentService.findById(id);
    if (content.typeKey !== TYPE_KEY) throw new NotFoundException("Project not found");
    return id;
  }

  private async attachDetails(content: Content): Promise<Project> {
    const [row] = await this.db.select().from(schema.projectDetails).where(eq(schema.projectDetails.contentId, content.id)).limit(1);
    if (!row) throw new InternalServerErrorException(`project_details missing for content ${content.id}`);
    return this.merge(content, row);
  }

  private async attachDetailsMany(contents: Content[]): Promise<Project[]> {
    if (contents.length === 0) return [];
    const ids = contents.map((c) => c.id);
    const rows = await this.db.select().from(schema.projectDetails).where(inArray(schema.projectDetails.contentId, ids));
    const byId = new Map(rows.map((row) => [row.contentId, row]));
    return contents.map((content) => {
      const row = byId.get(content.id);
      if (!row) throw new InternalServerErrorException(`project_details missing for content ${content.id}`);
      return this.merge(content, row);
    });
  }

  private merge(content: Content, row: ProjectDetailsRow): Project {
    return {
      ...content,
      problem: row.problem,
      solution: row.solution,
      technologies: row.technologies,
      demoUrl: row.demoUrl,
      repoUrl: row.repoUrl,
      clientName: row.clientName,
      startDate: row.startDate,
      endDate: row.endDate,
      projectStatus: row.projectStatus,
      results: row.results,
    };
  }
}
