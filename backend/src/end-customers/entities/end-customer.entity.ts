import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, OneToMany, Index,
} from 'typeorm';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { BankClient } from '../../bank-clients/entities/bank-client.entity';
import { OpinionRequest } from '../../opinion-requests/entities/opinion-request.entity';

@Entity('end_customers')
@Index(['tenantId', 'bankClientId', 'email'], { unique: true })
export class EndCustomer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column()
  bankClientId: string;

  @ManyToOne(() => BankClient, (b) => b.endCustomers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bankClientId' })
  bankClient: BankClient;

  @Column()
  name: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  panNumber: string;

  @Column({ nullable: true })
  aadhaarNumber: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @OneToMany(() => OpinionRequest, (r) => r.endCustomer)
  opinionRequests: OpinionRequest[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
