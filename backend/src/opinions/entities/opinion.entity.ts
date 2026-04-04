import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { OpinionRequest } from '../../opinion-requests/entities/opinion-request.entity';
import { User } from '../../users/entities/user.entity';

export enum OpinionStatus {
  DRAFT = 'DRAFT',
  SUBMITTED_FOR_REVIEW = 'SUBMITTED_FOR_REVIEW',
  CHANGES_REQUESTED = 'CHANGES_REQUESTED',
  APPROVED = 'APPROVED',
  ISSUED = 'ISSUED',
}

@Entity('opinions')
@Index(['tenantId'])
@Index(['opinionRequestId'])
export class Opinion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenantId: string;

  @Column()
  opinionRequestId: string;

  @ManyToOne(() => OpinionRequest, (r) => r.opinions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'opinionRequestId' })
  opinionRequest: OpinionRequest;

  @Column({ type: 'enum', enum: OpinionStatus, default: OpinionStatus.DRAFT })
  status: OpinionStatus;

  @Column({ type: 'int', default: 1 })
  version: number;

  @Column({ nullable: true })
  opinionNumber: string;

  @Column({ type: 'jsonb', nullable: true })
  content: Record<string, unknown>;

  @Column({ type: 'text', nullable: true })
  summaryFindings: string;

  @Column({ type: 'text', nullable: true })
  titleChainAnalysis: string;

  @Column({ type: 'text', nullable: true })
  encumbranceAnalysis: string;

  @Column({ type: 'text', nullable: true })
  riskObservations: string;

  @Column({ type: 'text', nullable: true })
  finalOpinion: string;

  @Column({ nullable: true })
  draftedById: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'draftedById' })
  draftedBy: User;

  @Column({ nullable: true })
  reviewedById: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'reviewedById' })
  reviewedBy: User;

  @Column({ nullable: true })
  issuedAt: Date;

  @Column({ nullable: true })
  opinionStoragePath: string;

  @Column({ type: 'jsonb', nullable: true })
  reviewComments: Array<{ userId: string; comment: string; createdAt: string }>;

  @Column({ type: 'varchar', nullable: true })
  recommendation: string;

  @Column({ type: 'text', array: true, nullable: true })
  conditions: string[];

  @Column({ type: 'boolean', default: false })
  aiGenerated: boolean;

  @Column({ type: 'jsonb', nullable: true })
  aiDraftContent: Record<string, unknown>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
