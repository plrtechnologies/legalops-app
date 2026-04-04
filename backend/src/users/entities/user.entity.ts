import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { Tenant } from '../../tenants/entities/tenant.entity';

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  FIRM_ADMIN = 'firm_admin',
  /** Delegated Keycloak role: may edit tenant branding/settings (assigned by firm admin). */
  TENANT_BRANDING_MANAGER = 'tenant_branding_manager',
  SENIOR_ADVOCATE = 'senior_advocate',
  PANEL_ADVOCATE = 'panel_advocate',
  PARALEGAL = 'paralegal',
}

@Entity('users')
@Index(['tenantId', 'email'], { unique: true })
@Index(['keycloakId'], { unique: true })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  keycloakId: string;

  @Column()
  tenantId: string;

  @ManyToOne(() => Tenant, (t) => t.users, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column()
  email: string;

  // Local password is not used (auth is delegated to Keycloak).
  @Column({ select: false, nullable: true })
  passwordHash: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.PARALEGAL })
  role: UserRole;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  lastLoginAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
