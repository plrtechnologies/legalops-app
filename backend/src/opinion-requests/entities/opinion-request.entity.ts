import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, OneToMany, Index,
} from 'typeorm';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { BankClient } from '../../bank-clients/entities/bank-client.entity';
import { EndCustomer } from '../../end-customers/entities/end-customer.entity';
import { OpinionTemplate } from '../../opinion-templates/entities/opinion-template.entity';
import { User } from '../../users/entities/user.entity';
import { Document } from '../../documents/entities/document.entity';
import { Opinion } from '../../opinions/entities/opinion.entity';

export enum OpinionRequestStatus {
  DRAFT = 'DRAFT',
  DOCUMENTS_PENDING = 'DOCUMENTS_PENDING',
  UNDER_REVIEW = 'UNDER_REVIEW',
  OPINION_DRAFTED = 'OPINION_DRAFTED',
  FINAL = 'FINAL',
  REJECTED = 'REJECTED',
}

export enum OpinionRequestPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
}

@Entity('opinion_requests')
@Index(['tenantId', 'referenceNumber'], { unique: true })
export class OpinionRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column()
  bankClientId: string;

  @ManyToOne(() => BankClient, (b) => b.opinionRequests, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bankClientId' })
  bankClient: BankClient;

  @Column()
  endCustomerId: string;

  @ManyToOne(() => EndCustomer, (e) => e.opinionRequests, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'endCustomerId' })
  endCustomer: EndCustomer;

  @Column()
  referenceNumber: string;

  @Column()
  loanType: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  loanAmount: string;

  @Column({ type: 'text', nullable: true })
  propertyLocation: string;

  @Column({ nullable: true })
  branchCode: string;

  @Column({ nullable: true })
  templateId: string;

  @ManyToOne(() => OpinionTemplate, (t) => t.opinionRequests, { nullable: true })
  @JoinColumn({ name: 'templateId' })
  template: OpinionTemplate;

  @Column()
  createdById: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @Column({ nullable: true })
  assignedLawyerId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assignedLawyerId' })
  assignedLawyer: User;

  @Column({ type: 'enum', enum: OpinionRequestStatus, default: OpinionRequestStatus.DRAFT })
  status: OpinionRequestStatus;

  @Column({ type: 'enum', enum: OpinionRequestPriority, default: OpinionRequestPriority.NORMAL })
  priority: OpinionRequestPriority;

  @Column({ type: 'date', nullable: true })
  dueDate: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown>;

  @OneToMany(() => Document, (d) => d.opinionRequest)
  documents: Document[];

  @OneToMany(() => Opinion, (o) => o.opinionRequest)
  opinions: Opinion[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
