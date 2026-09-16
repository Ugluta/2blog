import { Module } from "@nestjs/common";
import { ContentModule } from "../../core/content/content.module";
import { WorksController } from "./works.controller";
import { WorksPublicController } from "./works-public.controller";
import { WorksService } from "./works.service";

@Module({
  imports: [ContentModule],
  controllers: [WorksController, WorksPublicController],
  providers: [WorksService],
})
export class WorksModule {}
