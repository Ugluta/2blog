import { Module } from "@nestjs/common";
import { HealthModule } from "./health/health.module";

/**
 * Aggregates Core's generic modules (ARCHITECTURE.md madde 4/14). Auth,
 * Rbac, Media, Notifications, Subscriptions, ContentEngine and Seo modules
 * are added here as each is built out in its own phase — this module never
 * grows domain-specific (Blog, Evrak, ...) logic.
 */
@Module({
  imports: [HealthModule],
})
export class CoreModule {}
