import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tenant } from '../tenants/entities/tenant.entity';
import { User } from '../users/entities/user.entity';
import { Document } from '../documents/entities/document.entity';
import { Opinion } from '../opinions/entities/opinion.entity';
import { BankClient } from '../bank-clients/entities/bank-client.entity';
import { EndCustomer } from '../end-customers/entities/end-customer.entity';
import { OpinionTemplate } from '../opinion-templates/entities/opinion-template.entity';
import { OpinionRequest } from '../opinion-requests/entities/opinion-request.entity';
import { AuditLog } from '../audit-logs/entities/audit-log.entity';

const entities = [
  Tenant,
  User,
  BankClient,
  EndCustomer,
  OpinionTemplate,
  OpinionRequest,
  Document,
  Opinion,
  AuditLog,
];

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        type: 'postgres',
        host: cfg.get('database.host'),
        port: cfg.get<number>('database.port'),
        database: cfg.get('database.name'),
        username: cfg.get('database.user'),
        password: cfg.get('database.password'),
        ssl: cfg.get<boolean>('database.ssl') ? { rejectUnauthorized: false } : false,
        entities,
        migrations: [__dirname + '/../migrations/*{.ts,.js}'],
        migrationsRun: false,
        synchronize: cfg.get('nodeEnv') === 'development',
        logging: cfg.get('nodeEnv') === 'development' ? ['query', 'error'] : ['error'],
      }),
    }),
  ],
})
export class DatabaseModule {}
