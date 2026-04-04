import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Opinion } from '../opinions/entities/opinion.entity';
import { OpinionRequest } from '../opinion-requests/entities/opinion-request.entity';
import { Tenant } from '../tenants/entities/tenant.entity';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { EmailService } from './email/email.service';
import { bankNotificationHtml, endCustomerNotificationHtml } from './email/email.templates';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly emailService: EmailService,
    @InjectRepository(OpinionRequest) private readonly requestRepo: Repository<OpinionRequest>,
    @InjectRepository(Tenant) private readonly tenantRepo: Repository<Tenant>,
    private readonly auditLogs: AuditLogsService,
  ) {}

  async onOpinionIssued(opinion: Opinion): Promise<void> {
    try {
      const request = await this.requestRepo.findOne({
        where: { id: opinion.opinionRequestId },
        relations: ['bankClient', 'endCustomer'],
      });
      if (!request) return;

      const tenant = await this.tenantRepo.findOne({ where: { id: opinion.tenantId } });
      const firmName = tenant?.name ?? 'LegalOps';

      // Notify bank client
      if (request.bankClient?.notifyBankOnCompletion && request.bankClient?.contactEmail) {
        const html = request.bankClient.bankNotificationEmailTemplate
          ?? bankNotificationHtml({
            bankName: request.bankClient.name,
            referenceNumber: request.referenceNumber,
            borrowerName: request.endCustomer?.name ?? 'N/A',
            firmName,
            opinionNumber: opinion.opinionNumber ?? undefined,
          });

        await this.emailService.sendEmail(
          request.bankClient.contactEmail,
          `Legal Opinion Issued - ${request.referenceNumber}`,
          html,
        );

        await this.auditLogs.record({
          tenantId: opinion.tenantId,
          entityType: 'notification',
          entityId: opinion.id,
          action: 'BANK_NOTIFIED',
          newValues: { email: request.bankClient.contactEmail, referenceNumber: request.referenceNumber },
          userId: '00000000-0000-0000-0000-000000000000',
        });
      }

      // Notify end customer
      if (request.bankClient?.notifyEndCustomerOnCompletion && request.endCustomer?.email) {
        const html = request.bankClient.endCustomerNotificationEmailTemplate
          ?? endCustomerNotificationHtml({
            customerName: request.endCustomer.name,
            referenceNumber: request.referenceNumber,
            firmName,
          });

        await this.emailService.sendEmail(
          request.endCustomer.email,
          `Legal Opinion Issued - ${request.referenceNumber}`,
          html,
        );

        await this.auditLogs.record({
          tenantId: opinion.tenantId,
          entityType: 'notification',
          entityId: opinion.id,
          action: 'END_CUSTOMER_NOTIFIED',
          newValues: { email: request.endCustomer.email, referenceNumber: request.referenceNumber },
          userId: '00000000-0000-0000-0000-000000000000',
        });
      }
    } catch (err) {
      this.logger.error(`Notification failed for opinion ${opinion.id}: ${(err as Error).message}`);
    }
  }
}
