import { Module } from "@nestjs/common";
import { ContentModule } from "../../core/content/content.module";
import { ScraperSourcesController } from "./scraper-sources.controller";
import { ScraperSourcesService } from "./scraper-sources.service";
import { ScraperRulesController } from "./scraper-rules.controller";
import { ScraperRulesService } from "./scraper-rules.service";
import { CrawlJobsController } from "./crawl-jobs.controller";
import { CrawlJobsService } from "./crawl-jobs.service";
import { DataPoolController } from "./data-pool.controller";
import { DataPoolService } from "./data-pool.service";

@Module({
  imports: [ContentModule],
  controllers: [ScraperSourcesController, ScraperRulesController, CrawlJobsController, DataPoolController],
  providers: [ScraperSourcesService, ScraperRulesService, CrawlJobsService, DataPoolService],
})
export class ScraperModule {}
