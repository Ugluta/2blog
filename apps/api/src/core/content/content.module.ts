import { Module } from "@nestjs/common";
import { ContentTypeRegistryModule } from "./content-type-registry.module";
import { ContentController } from "./content.controller";
import { PublicContentController } from "./public-content.controller";
import { ContentService } from "./content.service";
import { TaxonomyController } from "./taxonomy.controller";
import { TaxonomyService } from "./taxonomy.service";

@Module({
  imports: [ContentTypeRegistryModule],
  controllers: [ContentController, PublicContentController, TaxonomyController],
  providers: [ContentService, TaxonomyService],
  exports: [ContentService],
})
export class ContentModule {}
