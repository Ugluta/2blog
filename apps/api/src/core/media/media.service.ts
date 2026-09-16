import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { and, eq, gt, inArray } from "drizzle-orm";
import { schema, type Database } from "@2blog/core-database";
import {
  ALLOWED_MIME_TYPES,
  computeHash,
  mimeToExtension,
  mimeToKind,
  sanitizeDisplayFilename,
  sniffMimeType,
  type StorageProvider,
} from "@2blog/core-media";
import { loadEnv, apiEnvSchema } from "@2blog/config";
import type { UpdateMediaInput, MediaListQuery } from "@2blog/validation";
import type { CursorPage, Media, MediaKind } from "@2blog/types";
import { DATABASE_CONNECTION } from "../database/database.constants";
import { STORAGE_PROVIDER } from "./media.constants";

type MediaRow = typeof schema.media.$inferSelect;

@Injectable()
export class MediaService {
  private readonly maxUploadBytes = loadEnv(apiEnvSchema).MEDIA_MAX_UPLOAD_MB * 1024 * 1024;

  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: Database,
    @Inject(STORAGE_PROVIDER) private readonly storage: StorageProvider,
  ) {}

  async upload(buffer: Buffer, originalFilename: string, ownerId: string): Promise<Media> {
    if (buffer.length === 0) {
      throw new BadRequestException("Empty file");
    }
    if (buffer.length > this.maxUploadBytes) {
      throw new BadRequestException(`File exceeds the ${this.maxUploadBytes} byte upload limit`);
    }

    // Never trust the client-declared Content-Type — only what the bytes say.
    const sniffed = sniffMimeType(buffer);
    if (!sniffed) {
      throw new BadRequestException("File type not recognized or not allowed");
    }

    const hash = computeHash(buffer);
    const existing = await this.db.select().from(schema.media).where(eq(schema.media.hash, hash)).limit(1);
    if (existing[0]) {
      return this.serialize(existing[0]);
    }

    const storageKey = `${randomUUID()}.${mimeToExtension(sniffed)}`;
    await this.storage.putObject({ key: storageKey, body: buffer, contentType: sniffed });

    try {
      const [row] = await this.db
        .insert(schema.media)
        .values({
          storageKey,
          originalFilename: sanitizeDisplayFilename(originalFilename),
          mimeType: sniffed,
          size: buffer.length,
          hash,
          ownerId,
        })
        .returning();
      return this.serialize(row!);
    } catch (error) {
      // Two concurrent uploads of the same bytes can both pass the hash
      // check above and race to insert; the unique constraint on `hash`
      // is the real guard, this just turns that race into a dedupe hit
      // instead of a 500.
      if ((error as { code?: string }).code === "23505") {
        const [row] = await this.db.select().from(schema.media).where(eq(schema.media.hash, hash)).limit(1);
        if (row) return this.serialize(row);
      }
      throw error;
    }
  }

  async update(id: string, input: UpdateMediaInput): Promise<Media> {
    await this.getRowOrThrow(id);
    const [row] = await this.db
      .update(schema.media)
      .set({
        ...(input.altText !== undefined && { altText: input.altText }),
        ...(input.caption !== undefined && { caption: input.caption }),
        updatedAt: new Date(),
      })
      .where(eq(schema.media.id, id))
      .returning();
    return this.serialize(row!);
  }

  async remove(id: string): Promise<void> {
    const row = await this.getRowOrThrow(id);
    await this.storage.deleteObject(row.storageKey);
    await this.db.delete(schema.media).where(eq(schema.media.id, id));
  }

  async findById(id: string): Promise<Media> {
    return this.serialize(await this.getRowOrThrow(id));
  }

  async list(query: MediaListQuery): Promise<CursorPage<Media>> {
    const conditions = [];
    if (query.cursor) conditions.push(gt(schema.media.id, query.cursor));
    if (query.kind) {
      const mimesForKind = ALLOWED_MIME_TYPES.filter((mime) => mimeToKind(mime) === query.kind);
      conditions.push(inArray(schema.media.mimeType, mimesForKind));
    }

    const rows = await this.db
      .select()
      .from(schema.media)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(schema.media.id)
      .limit(query.limit + 1);

    const page = rows.slice(0, query.limit);
    const nextCursor = rows.length > query.limit ? page[page.length - 1]!.id : null;
    return { items: page.map((row) => this.toMedia(row)), nextCursor };
  }

  private async getRowOrThrow(id: string): Promise<MediaRow> {
    const rows = await this.db.select().from(schema.media).where(eq(schema.media.id, id)).limit(1);
    if (!rows[0]) throw new NotFoundException("Media not found");
    return rows[0];
  }

  private serialize(row: MediaRow): Media {
    return this.toMedia(row);
  }

  private toMedia(row: MediaRow): Media {
    return {
      id: row.id,
      kind: mimeToKind(row.mimeType) as MediaKind,
      url: this.storage.getPublicUrl(row.storageKey),
      originalFilename: row.originalFilename,
      mimeType: row.mimeType,
      size: row.size,
      width: row.width,
      height: row.height,
      duration: row.duration,
      altText: row.altText,
      caption: row.caption,
      ownerId: row.ownerId,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
