import { Module } from "@nestjs/common";
import { SettingsController } from "./settings.controller";
import { SettingsService } from "./settings.service";
import { MenuController } from "./menu.controller";
import { MenuPublicController } from "./menu-public.controller";
import { MenuService } from "./menu.service";

@Module({
  controllers: [SettingsController, MenuController, MenuPublicController],
  providers: [SettingsService, MenuService],
})
export class SettingsModule {}
