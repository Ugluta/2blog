import { Module } from "@nestjs/common";
import { ContentModule } from "../../core/content/content.module";
import { ServicesController } from "./services.controller";
import { ServicesPublicController } from "./services-public.controller";
import { ServicesService } from "./services.service";
import { ServiceCategoriesController } from "./service-categories.controller";
import { ServiceCategoriesService } from "./service-categories.service";

@Module({
  imports: [ContentModule],
  controllers: [ServicesController, ServicesPublicController, ServiceCategoriesController],
  providers: [ServicesService, ServiceCategoriesService],
})
export class ServicesModule {}
