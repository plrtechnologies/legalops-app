import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import configuration from './config/configuration';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { TenancyModule } from './tenancy/tenancy.module';
import { TenantsModule } from './tenants/tenants.module';
import { BankClientsModule } from './bank-clients/bank-clients.module';
import { EndCustomersModule } from './end-customers/end-customers.module';
import { OpinionTemplatesModule } from './opinion-templates/opinion-templates.module';
import { OpinionRequestsModule } from './opinion-requests/opinion-requests.module';
import { DocumentsModule } from './documents/documents.module';
import { OpinionsModule } from './opinions/opinions.module';
import { StorageModule } from './storage/storage.module';
import { TenantMiddleware } from './tenancy/tenant.middleware';
import { SeedModule } from './database/seed.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { ReportsModule } from './reports/reports.module';
import { AiModule } from './ai/ai.module';
import { NotificationsModule } from './notifications/notifications.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { UsersModule } from './users/users.module';
import { OnboardingModule } from './onboarding/onboarding.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    DatabaseModule,
    AuditLogsModule,
    TenancyModule,
    AuthModule,
    TenantsModule,
    BankClientsModule,
    EndCustomersModule,
    OpinionTemplatesModule,
    OpinionRequestsModule,
    DocumentsModule,
    OpinionsModule,
    StorageModule,
    ReportsModule,
    AiModule,
    NotificationsModule,
    DashboardModule,
    UsersModule,
    OnboardingModule,
    SeedModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}
