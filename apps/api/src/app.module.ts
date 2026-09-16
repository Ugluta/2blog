import { Module } from "@nestjs/common";
import { CoreModule } from "./core/core.module";
import { BlogModule } from "./blog/blog.module";

@Module({
  imports: [CoreModule, BlogModule],
})
export class AppModule {}
