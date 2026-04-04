import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from '../tenants/entities/tenant.entity';
import { BankClient } from '../bank-clients/entities/bank-client.entity';
import { EndCustomer } from '../end-customers/entities/end-customer.entity';
import { OpinionTemplate } from '../opinion-templates/entities/opinion-template.entity';

const DEMO_TENANT_ID = '11111111-1111-1111-1111-111111111111';

/**
 * Seeds minimal bank client / borrower / template for local e2e when DB is empty.
 * Runs only in development.
 */
@Injectable()
export class DevSeedService implements OnModuleInit {
  private readonly logger = new Logger(DevSeedService.name);

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(Tenant) private readonly tenantRepo: Repository<Tenant>,
    @InjectRepository(BankClient) private readonly bankRepo: Repository<BankClient>,
    @InjectRepository(EndCustomer) private readonly endRepo: Repository<EndCustomer>,
    @InjectRepository(OpinionTemplate) private readonly tplRepo: Repository<OpinionTemplate>,
  ) {}

  async onModuleInit(): Promise<void> {
    if (this.config.get('nodeEnv') !== 'development') return;

    // Ensure demo tenant exists
    const tenantExists = await this.tenantRepo.findOne({ where: { id: DEMO_TENANT_ID } });
    if (!tenantExists) {
      await this.tenantRepo.save(
        this.tenantRepo.create({
          id: DEMO_TENANT_ID,
          code: 'demo-firm',
          slug: 'demo-firm',
          name: 'Demo Law Firm',
          isActive: true,
        }),
      );
      this.logger.log('Dev seed: demo tenant created');
    }

    const existing = await this.bankRepo.count({ where: { tenantId: DEMO_TENANT_ID } });
    if (existing > 0) return;

    const bank = await this.bankRepo.save(
      this.bankRepo.create({
        tenantId: DEMO_TENANT_ID,
        code: 'DEMO-BANK',
        name: 'Demo Bank Ltd',
        branch: 'Main Branch',
        isActive: true,
      }),
    );

    await this.endRepo.save(
      this.endRepo.create({
        tenantId: DEMO_TENANT_ID,
        bankClientId: bank.id,
        name: 'Sample Borrower',
        email: 'borrower@example.com',
        phone: '+919999999999',
      }),
    );

    const tpl = await this.tplRepo.save(
      this.tplRepo.create({
        tenantId: DEMO_TENANT_ID,
        bankClientId: bank.id,
        name: 'Standard mortgage',
        description: 'Default sections for mortgage opinions',
        templateContent: {
          sections: [
            { id: 'summary', title: 'Summary' },
            { id: 'title', title: 'Title review' },
          ],
        },
        loanType: 'HOME_LOAN',
        isDefault: true,
        isActive: true,
      }),
    );

    bank.defaultTemplateId = tpl.id;
    await this.bankRepo.save(bank);

    this.logger.log('Dev seed: demo bank client, end customer, and opinion template created');
  }
}
