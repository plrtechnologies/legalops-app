import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { User } from '../users/entities/user.entity';
import { Tenant } from '../tenants/entities/tenant.entity';

/**
 * Authentication is delegated entirely to Keycloak.
 * This module only validates incoming Keycloak-issued JWT tokens
 * via the JWKS endpoint and auto-provisions local user records on first login.
 *
 * There is no local login/register endpoint – users authenticate via
 * the Keycloak login page (frontend redirects using keycloak-js).
 */
@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    TypeOrmModule.forFeature([User, Tenant]),
  ],
  providers: [JwtStrategy],
  exports: [PassportModule],
})
export class AuthModule {}
