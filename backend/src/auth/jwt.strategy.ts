import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../users/entities/user.entity';
import { Tenant } from '../tenants/entities/tenant.entity';

export interface KeycloakJwtPayload {
  sub: string;
  email?: string;
  preferred_username?: string;
  given_name?: string;
  family_name?: string;
  tenant_id?: string;
  realm_access?: { roles?: string[] };
  iat: number;
  exp: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    config: ConfigService,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Tenant) private readonly tenantRepo: Repository<Tenant>,
  ) {
    const issuer = config.get<string>('keycloak.issuer');

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 10,
        jwksUri: config.get<string>('keycloak.jwksUri')!,
      }),
      ...(issuer ? { issuer } : {}),
      // No audience validation — SPA tokens (legal-opinion-web) don't include the API audience
    });
  }

  async validate(payload: KeycloakJwtPayload): Promise<User> {
    if (!payload.sub) throw new UnauthorizedException('Invalid token subject');
    if (!payload.tenant_id) throw new UnauthorizedException('Missing tenant_id claim');

    let user = await this.userRepo.findOne({ where: { keycloakId: payload.sub } });

    const tokenRoles = payload.realm_access?.roles ?? [];
    const resolvedRole = this.resolveAppRole(tokenRoles);

    if (!user) {
      const tenant = await this.tenantRepo.findOne({
        where: { id: payload.tenant_id, isActive: true },
      });
      if (!tenant) {
        this.logger.warn(`Keycloak user ${payload.sub} has unknown tenant_id: ${payload.tenant_id}`);
        throw new UnauthorizedException('Unknown tenant');
      }

      user = await this.userRepo.save(
        this.userRepo.create({
          keycloakId: payload.sub,
          tenantId: tenant.id,
          email: payload.email ?? payload.preferred_username ?? `${payload.sub}@unknown.local`,
          firstName: payload.given_name ?? payload.preferred_username ?? 'User',
          lastName: payload.family_name ?? '',
          role: resolvedRole,
          isActive: true,
        }),
      );
      this.logger.log(`Auto-provisioned user ${user.email} for tenant ${tenant.id}`);
    } else if (user.role !== resolvedRole || user.tenantId !== payload.tenant_id) {
      user.role = resolvedRole;
      user.tenantId = payload.tenant_id;
      user = await this.userRepo.save(user);
    }

    if (!user.isActive) throw new UnauthorizedException('User is deactivated');
    return Object.assign(user, { realmRoles: tokenRoles });
  }

  private resolveAppRole(realmRoles: string[]): UserRole {
    if (realmRoles.includes(UserRole.SUPER_ADMIN)) return UserRole.SUPER_ADMIN;
    if (realmRoles.includes(UserRole.FIRM_ADMIN)) return UserRole.FIRM_ADMIN;
    if (realmRoles.includes(UserRole.SENIOR_ADVOCATE)) return UserRole.SENIOR_ADVOCATE;
    if (realmRoles.includes(UserRole.PANEL_ADVOCATE)) return UserRole.PANEL_ADVOCATE;
    if (realmRoles.includes(UserRole.PARALEGAL)) return UserRole.PARALEGAL;
    if (realmRoles.includes(UserRole.TENANT_BRANDING_MANAGER)) return UserRole.TENANT_BRANDING_MANAGER;
    return UserRole.PARALEGAL;
  }
}
