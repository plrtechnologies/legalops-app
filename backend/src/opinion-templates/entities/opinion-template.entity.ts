import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, OneToMany, Index,
} from 'typeorm';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { BankClient } from '../../bank-clients/entities/bank-client.entity';
import { OpinionRequest } from '../../opinion-requests/entities/opinion-request.entity';

@Entity('opinion_templates')
@Index(['tenantId', 'bankClientId', 'name'], { unique: true })
export class OpinionTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column()
  bankClientId: string;

  @ManyToOne(() => BankClient, (b) => b.templates, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bankClientId' })
  bankClient: BankClient;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'jsonb' })
  templateContent: Record<string, unknown>;

  @Column({ nullable: true })
  loanType: string;

  @Column({ default: false })
  isDefault: boolean;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => OpinionRequest, (r) => r.template)
  opinionRequests: OpinionRequest[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
