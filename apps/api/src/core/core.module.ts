import { Module } from "@nestjs/common";
import { HealthModule } from "./health/health.module";
import { DatabaseModule } from "./database/database.module";
import { AuthModule } from "./auth/auth.module";
import { RbacModule } from "./rbac/rbac.module";
import { UsersModule } from "./users/users.module";

/**
 * Aggregates Core's generic modules (ARCHITECTURE.md madde 4/14). Media,
 * Notifications, Subscriptions, ContentEngine and Seo modules are added here
 * as each is built out in its own phase — this module never grows
 * domain-specific (Blog, Evrak, ...) logic.
 */
@Module({
  imports: [DatabaseModule, HealthModule, AuthModule, RbacModule, UsersModule],
})
export class CoreModule {}
