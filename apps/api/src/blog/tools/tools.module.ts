import { Module } from "@nestjs/common";
import { ContentModule } from "../../core/content/content.module";
import { ToolsController } from "./tools.controller";
import { ToolsPublicController } from "./tools-public.controller";
import { ToolsService } from "./tools.service";

@Module({
  imports: [ContentModule],
  controllers: [ToolsController, ToolsPublicController],
  providers: [ToolsService],
})
export class ToolsModule {}
