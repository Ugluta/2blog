import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { asc, eq } from "drizzle-orm";
import { schema, type Database } from "@2blog/core-database";
import type { CreateMenuItemInput, UpdateMenuItemInput } from "@2blog/validation";
import type { MenuItem } from "@2blog/types";
import { DATABASE_CONNECTION } from "../database/database.constants";

type MenuItemRow = typeof schema.menuItems.$inferSelect;

@Injectable()
export class MenuService {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  async listAll(): Promise<MenuItem[]> {
    const rows = await this.db.select().from(schema.menuItems).orderBy(asc(schema.menuItems.position));
    return rows.map(this.serialize);
  }

  async listVisible(): Promise<MenuItem[]> {
    const rows = await this.db
      .select()
      .from(schema.menuItems)
      .where(eq(schema.menuItems.isVisible, true))
      .orderBy(asc(schema.menuItems.position));
    return rows.map(this.serialize);
  }

  async create(input: CreateMenuItemInput): Promise<MenuItem> {
    const [item] = await this.db.insert(schema.menuItems).values(input).returning();
    return this.serialize(item!);
  }

  async update(id: string, input: UpdateMenuItemInput): Promise<MenuItem> {
    const [item] = await this.db.update(schema.menuItems).set(input).where(eq(schema.menuItems.id, id)).returning();
    if (!item) throw new NotFoundException("Menu item not found");
    return this.serialize(item);
  }

  async remove(id: string): Promise<void> {
    const [item] = await this.db.delete(schema.menuItems).where(eq(schema.menuItems.id, id)).returning({ id: schema.menuItems.id });
    if (!item) throw new NotFoundException("Menu item not found");
  }

  private serialize(row: MenuItemRow): MenuItem {
    return {
      id: row.id,
      label: row.label,
      url: row.url,
      position: row.position,
      isVisible: row.isVisible,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
