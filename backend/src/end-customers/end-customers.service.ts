import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EndCustomer } from './entities/end-customer.entity';
import { BankClient } from '../bank-clients/entities/bank-client.entity';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateEndCustomerDto {
  @IsNotEmpty() @IsString() bankClientId: string;
  @IsNotEmpty() @IsString() name: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() panNumber?: string;
  @IsOptional() @IsString() aadhaarNumber?: string;
  @IsOptional() @IsString() address?: string;
}

export class UpdateEndCustomerDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() panNumber?: string;
  @IsOptional() @IsString() aadhaarNumber?: string;
  @IsOptional() @IsString() address?: string;
}

@Injectable()
export class EndCustomersService {
  constructor(
    @InjectRepository(EndCustomer) private readonly repo: Repository<EndCustomer>,
    @InjectRepository(BankClient) private readonly bankRepo: Repository<BankClient>,
  ) {}

  private async assertBankClient(tenantId: string, bankClientId: string): Promise<void> {
    const b = await this.bankRepo.findOne({ where: { id: bankClientId, tenantId } });
    if (!b) throw new BadRequestException('Bank client not found for this tenant');
  }

  async create(tenantId: string, dto: CreateEndCustomerDto): Promise<EndCustomer> {
    await this.assertBankClient(tenantId, dto.bankClientId);
    if (dto.email) {
      const dup = await this.repo.findOne({
        where: { tenantId, bankClientId: dto.bankClientId, email: dto.email },
      });
      if (dup) throw new ConflictException('End customer with this email already exists for this bank client');
    }
    return this.repo.save(this.repo.create({ tenantId, ...dto }));
  }

  findByBankClient(tenantId: string, bankClientId: string): Promise<EndCustomer[]> {
    return this.repo.find({
      where: { tenantId, bankClientId },
      order: { name: 'ASC' },
    });
  }

  findAll(tenantId: string): Promise<EndCustomer[]> {
    return this.repo.find({ where: { tenantId }, order: { name: 'ASC' } });
  }

  async findOne(tenantId: string, id: string): Promise<EndCustomer> {
    const e = await this.repo.findOne({ where: { id, tenantId } });
    if (!e) throw new NotFoundException('End customer not found');
    return e;
  }

  async update(tenantId: string, id: string, dto: UpdateEndCustomerDto): Promise<EndCustomer> {
    const e = await this.findOne(tenantId, id);
    if (dto.email && dto.email !== e.email) {
      const dup = await this.repo.findOne({
        where: { tenantId, bankClientId: e.bankClientId, email: dto.email },
      });
      if (dup && dup.id !== id) {
        throw new ConflictException('End customer with this email already exists for this bank client');
      }
    }
    Object.assign(e, dto);
    return this.repo.save(e);
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const e = await this.findOne(tenantId, id);
    await this.repo.remove(e);
  }
}
