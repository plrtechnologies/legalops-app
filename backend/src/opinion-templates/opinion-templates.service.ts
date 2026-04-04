import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OpinionTemplate } from './entities/opinion-template.entity';
import { BankClient } from '../bank-clients/entities/bank-client.entity';
import { IsNotEmpty, IsOptional, IsString, IsBoolean, IsObject } from 'class-validator';

export class CreateOpinionTemplateDto {
  @IsNotEmpty() @IsString() bankClientId: string;
  @IsNotEmpty() @IsString() name: string;
  @IsOptional() @IsString() description?: string;
  @IsNotEmpty() @IsObject() templateContent: Record<string, unknown>;
  @IsOptional() @IsString() loanType?: string;
  @IsOptional() @IsBoolean() isDefault?: boolean;
}

export class UpdateOpinionTemplateDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsObject() templateContent?: Record<string, unknown>;
  @IsOptional() @IsString() loanType?: string;
  @IsOptional() @IsBoolean() isDefault?: boolean;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

@Injectable()
export class OpinionTemplatesService {
  constructor(
    @InjectRepository(OpinionTemplate) private readonly repo: Repository<OpinionTemplate>,
    @InjectRepository(BankClient) private readonly bankRepo: Repository<BankClient>,
  ) {}

  private async assertBankClient(tenantId: string, bankClientId: string): Promise<void> {
    const b = await this.bankRepo.findOne({ where: { id: bankClientId, tenantId } });
    if (!b) throw new BadRequestException('Bank client not found for this tenant');
  }

  async create(tenantId: string, dto: CreateOpinionTemplateDto): Promise<OpinionTemplate> {
    await this.assertBankClient(tenantId, dto.bankClientId);
    const dup = await this.repo.findOne({
      where: { tenantId, bankClientId: dto.bankClientId, name: dto.name },
    });
    if (dup) throw new ConflictException('Template name already exists for this bank client');
    return this.repo.save(this.repo.create({ tenantId, ...dto }));
  }

  findByBankClient(tenantId: string, bankClientId: string): Promise<OpinionTemplate[]> {
    return this.repo.find({
      where: { tenantId, bankClientId, isActive: true },
      order: { name: 'ASC' },
    });
  }

  async findOne(tenantId: string, id: string): Promise<OpinionTemplate> {
    const t = await this.repo.findOne({ where: { id, tenantId } });
    if (!t) throw new NotFoundException('Opinion template not found');
    return t;
  }

  async update(tenantId: string, id: string, dto: UpdateOpinionTemplateDto): Promise<OpinionTemplate> {
    const t = await this.findOne(tenantId, id);
    if (dto.name && dto.name !== t.name) {
      const dup = await this.repo.findOne({
        where: { tenantId, bankClientId: t.bankClientId, name: dto.name },
      });
      if (dup && dup.id !== id) throw new ConflictException('Template name already exists for this bank client');
    }
    Object.assign(t, dto);
    return this.repo.save(t);
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const t = await this.findOne(tenantId, id);
    await this.repo.remove(t);
  }
}
