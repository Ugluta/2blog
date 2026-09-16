import { Module } from "@nestjs/common";
import { ContentModule } from "../../core/content/content.module";
import { ProjectsController } from "./projects.controller";
import { ProjectsPublicController } from "./projects-public.controller";
import { ProjectsService } from "./projects.service";

@Module({
  imports: [ContentModule],
  controllers: [ProjectsController, ProjectsPublicController],
  providers: [ProjectsService],
})
export class ProjectsModule {}
