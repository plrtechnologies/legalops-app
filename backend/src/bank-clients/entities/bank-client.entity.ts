import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, OneToMany, Index,
} from 'typeorm';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { EndCustomer } from '../../end-customers/entities/end-customer.entity';
import { OpinionTemplate } from '../../opinion-templates/entities/opinion-template.entity';
import { OpinionRequest } from '../../opinion-requests/entities/opinion-request.entity';

@Entity('bank_clients')
@Index(['tenantId', 'code'], { unique: true })
export class BankClient {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column()
  code: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  branch: string;

  @Column({ nullable: true })
  contactName: string;

  @Column({ nullable: true })
  contactEmail: string;

  @Column({ nullable: true })
  contactPhone: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ nullable: true })
  defaultTemplateId: string;

  @Column({ default: false })
  notifyBankOnCompletion: boolean;

  @Column({ default: false })
  notifyEndCustomerOnCompletion: boolean;

  @Column({ type: 'text', nullable: true })
  endCustomerNotificationEmailTemplate: string;

  @Column({ type: 'text', nullable: true })
  bankNotificationEmailTemplate: string;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => EndCustomer, (e) => e.bankClient)
  endCustomers: EndCustomer[];

  @OneToMany(() => OpinionTemplate, (t) => t.bankClient)
  templates: OpinionTemplate[];

  @OneToMany(() => OpinionRequest, (r) => r.bankClient)
  opinionRequests: OpinionRequest[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
