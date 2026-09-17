import { Module } from "@nestjs/common";
import { HealthModule } from "./health/health.module";
import { DatabaseModule } from "./database/database.module";
import { CacheModule } from "./cache/cache.module";
import { AuthModule } from "./auth/auth.module";
import { RbacModule } from "./rbac/rbac.module";
import { UsersModule } from "./users/users.module";
import { ContentModule } from "./content/content.module";
import { MediaModule } from "./media/media.module";
import { SettingsModule } from "./settings/settings.module";
import { AiModule } from "./ai/ai.module";

/**
 * Aggregates Core's generic modules (ARCHITECTURE.md madde 4/14).
 * Notifications and Subscriptions modules are added here as each is built
 * out in its own phase — this module never grows domain-specific (Blog,
 * Evrak, ...) logic; ContentModule only knows typeKey strings and the
 * ContentTypeRegistry, never concrete types like "post" or "document".
 */
@Module({
  imports: [DatabaseModule, CacheModule, HealthModule, AuthModule, RbacModule, UsersModule, ContentModule, MediaModule, SettingsModule, AiModule],
})
export class CoreModule {}
