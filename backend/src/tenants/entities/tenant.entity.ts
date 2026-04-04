import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { OpinionRequest } from '../../opinion-requests/entities/opinion-request.entity';

@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Public firm identifier (HLD); aligned with former slug for local demo. */
  @Column({ unique: true })
  code: string;

  @Column({ unique: true })
  slug: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  logoUrl: string;

  /** Internal storage key/path for uploaded logo; resolved via storage driver on read. */
  @Column({ nullable: true })
  logoStorageKey: string;

  @Column({ nullable: true })
  faviconUrl: string;

  @Column({ nullable: true })
  faviconStorageKey: string;

  @Column({ nullable: true })
  primaryColor: string;

  @Column({ nullable: true })
  secondaryColor: string;

  @Column({ nullable: true })
  contactEmail: string;

  @Column({ nullable: true })
  contactPhone: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ default: 'standard' })
  subscriptionTier: string;

  @Column({ type: 'int', default: 100 })
  maxUsers: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'jsonb', nullable: true })
  settings: Record<string, unknown>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => User, (u) => u.tenant)
  users: User[];

  @OneToMany(() => OpinionRequest, (r) => r.tenant)
  opinionRequests: OpinionRequest[];
}

