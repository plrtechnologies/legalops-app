import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OpinionRequest } from '../opinion-requests/entities/opinion-request.entity';
import { Tenant } from '../tenants/entities/tenant.entity';
import { NotificationsService } from './notifications.service';
import { EmailService } from './email/email.service';

@Module({
  imports: [TypeOrmModule.forFeature([OpinionRequest, Tenant])],
  providers: [NotificationsService, EmailService],
  exports: [NotificationsService, EmailService],
})
export class NotificationsModule {}
