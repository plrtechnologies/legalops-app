import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('audit_logs')
@Index(['tenantId', 'createdAt'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenantId: string;

  @Column()
  entityType: string;

  @Column('uuid')
  entityId: string;

  @Column()
  action: string;

  @Column({ type: 'jsonb', nullable: true })
  oldValues: Record<string, unknown>;

  @Column({ type: 'jsonb', nullable: true })
  newValues: Record<string, unknown>;

  @Column()
  userId: string;

  @Column({ nullable: true })
  userEmail: string;

  @Column({ nullable: true })
  ipAddress: string;

  @CreateDateColumn()
  createdAt: Date;
}
