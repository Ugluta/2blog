import { Controller, Get } from "@nestjs/common";
import type { ApiSuccess, MenuItem } from "@2blog/types";
import { MenuService } from "./menu.service";

@Controller("menu/public")
export class MenuPublicController {
  constructor(private readonly menuService: MenuService) {}

  @Get()
  async list(): Promise<ApiSuccess<MenuItem[]>> {
    return { data: await this.menuService.listVisible() };
  }
}
