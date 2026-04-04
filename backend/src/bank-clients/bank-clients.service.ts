import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BankClient } from './entities/bank-client.entity';
import { IsNotEmpty, IsOptional, IsString, IsBoolean } from 'class-validator';

export class CreateBankClientDto {
  @IsNotEmpty() @IsString() code: string;
  @IsNotEmpty() @IsString() name: string;
  @IsOptional() @IsString() branch?: string;
  @IsOptional() @IsString() contactName?: string;
  @IsOptional() @IsString() contactEmail?: string;
  @IsOptional() @IsString() contactPhone?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class UpdateBankClientDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() branch?: string;
  @IsOptional() @IsString() contactName?: string;
  @IsOptional() @IsString() contactEmail?: string;
  @IsOptional() @IsString() contactPhone?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

@Injectable()
export class BankClientsService {
  constructor(@InjectRepository(BankClient) private readonly repo: Repository<BankClient>) {}

  async create(tenantId: string, dto: CreateBankClientDto): Promise<BankClient> {
    const dup = await this.repo.findOne({ where: { tenantId, code: dto.code } });
    if (dup) throw new ConflictException('Bank client code already exists for this tenant');
    return this.repo.save(this.repo.create({ tenantId, ...dto }));
  }

  findAll(tenantId: string): Promise<BankClient[]> {
    return this.repo.find({ where: { tenantId }, order: { name: 'ASC' } });
  }

  async findOne(tenantId: string, id: string): Promise<BankClient> {
    const b = await this.repo.findOne({ where: { id, tenantId } });
    if (!b) throw new NotFoundException('Bank client not found');
    return b;
  }

  async update(tenantId: string, id: string, dto: UpdateBankClientDto): Promise<BankClient> {
    const b = await this.findOne(tenantId, id);
    Object.assign(b, dto);
    return this.repo.save(b);
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const b = await this.findOne(tenantId, id);
    await this.repo.remove(b);
  }
}
