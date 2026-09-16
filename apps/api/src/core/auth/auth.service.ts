import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";
import { schema, type Database } from "@2blog/core-database";
import { loadEnv, authEnvSchema } from "@2blog/config";
import {
  generateRefreshToken,
  hashRefreshToken,
  parseDurationMs,
  signAccessToken,
  verifyPassword,
} from "@2blog/core-auth";
import type { AuthenticatedUser } from "@2blog/types";
import { DATABASE_CONNECTION } from "../database/database.constants";
import { UsersService } from "../users/users.service";

export interface SessionMeta {
  userAgent?: string;
  ipAddress?: string;
}

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: AuthenticatedUser;
}

@Injectable()
export class AuthService {
  private readonly env = loadEnv(authEnvSchema);

  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: Database,
    private readonly usersService: UsersService,
  ) {}

  async login(email: string, password: string, meta: SessionMeta): Promise<AuthResult> {
    const user = await this.usersService.findByEmailWithPassword(email);
    if (!user || !(await verifyPassword(user.passwordHash, password))) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const authUser = await this.usersService.getAuthenticatedUser(user.id);
    if (!authUser) {
      throw new UnauthorizedException("Invalid email or password");
    }

    return this.issueSession(authUser, randomUUID(), meta);
  }

  async refresh(refreshToken: string): Promise<AuthResult> {
    const tokenHash = hashRefreshToken(refreshToken);
    const sessionRows = await this.db
      .select()
      .from(schema.sessions)
      .where(eq(schema.sessions.refreshTokenHash, tokenHash))
      .limit(1);
    const session = sessionRows[0];

    if (!session) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    if (session.revokedAt) {
      // Already revoked — either a normal prior logout, or reuse of an
      // already-rotated token. We can't tell which from state alone, so we
      // treat it as a possible compromise either way and kill the whole
      // chain; a legitimate logged-out client just needs to log in again.
      await this.db
        .update(schema.sessions)
        .set({ revokedAt: new Date() })
        .where(and(eq(schema.sessions.family, session.family), isNull(schema.sessions.revokedAt)));
      throw new UnauthorizedException("Refresh token has been revoked");
    }

    if (session.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException("Refresh token expired");
    }

    await this.db.update(schema.sessions).set({ revokedAt: new Date() }).where(eq(schema.sessions.id, session.id));

    const authUser = await this.usersService.getAuthenticatedUser(session.userId);
    if (!authUser) {
      throw new UnauthorizedException("User no longer exists");
    }

    return this.issueSession(authUser, session.family, {
      userAgent: session.userAgent ?? undefined,
      ipAddress: session.ipAddress ?? undefined,
    });
  }

  async logout(refreshToken: string): Promise<void> {
    const tokenHash = hashRefreshToken(refreshToken);
    const sessionRows = await this.db
      .select()
      .from(schema.sessions)
      .where(eq(schema.sessions.refreshTokenHash, tokenHash))
      .limit(1);
    const session = sessionRows[0];
    if (!session) return;

    await this.db
      .update(schema.sessions)
      .set({ revokedAt: new Date() })
      .where(and(eq(schema.sessions.family, session.family), isNull(schema.sessions.revokedAt)));
  }

  private async issueSession(authUser: AuthenticatedUser, family: string, meta: SessionMeta): Promise<AuthResult> {
    const refreshToken = generateRefreshToken();
    const expiresAt = new Date(Date.now() + parseDurationMs(this.env.JWT_REFRESH_TTL));

    await this.db.insert(schema.sessions).values({
      userId: authUser.id,
      family,
      refreshTokenHash: hashRefreshToken(refreshToken),
      expiresAt,
      userAgent: meta.userAgent,
      ipAddress: meta.ipAddress,
    });

    const accessToken = signAccessToken(
      {
        sub: authUser.id,
        email: authUser.email,
        roles: authUser.roles.map((role) => role.key),
        permissions: authUser.permissions,
      },
      this.env.JWT_ACCESS_SECRET,
      this.env.JWT_ACCESS_TTL,
    );

    return { accessToken, refreshToken, user: authUser };
  }
}
