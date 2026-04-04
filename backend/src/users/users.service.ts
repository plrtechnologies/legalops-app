import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateUserDto {
  @IsString() keycloakId: string;
  @IsEmail() email: string;
  @IsString() firstName: string;
  @IsString() lastName: string;
  @IsEnum(UserRole) role: UserRole;
}

export class UpdateUserDto {
  @IsOptional() @IsString() firstName?: string;
  @IsOptional() @IsString() lastName?: string;
  @IsOptional() @IsEnum(UserRole) role?: UserRole;
  @IsOptional() isActive?: boolean;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly repo: Repository<User>,
  ) {}

  async findAll(tenantId: string): Promise<User[]> {
    return this.repo.find({
      where: { tenantId },
      order: { firstName: 'ASC', lastName: 'ASC' },
    });
  }

  async findOne(tenantId: string, id: string): Promise<User> {
    const user = await this.repo.findOne({ where: { id, tenantId } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async create(tenantId: string, dto: CreateUserDto): Promise<User> {
    const existing = await this.repo.findOne({ where: { tenantId, email: dto.email } });
    if (existing) throw new ConflictException('User with this email already exists');

    return this.repo.save(this.repo.create({ tenantId, ...dto }));
  }

  async update(tenantId: string, id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(tenantId, id);
    Object.assign(user, dto);
    return this.repo.save(user);
  }

  async deactivate(tenantId: string, id: string): Promise<User> {
    const user = await this.findOne(tenantId, id);
    user.isActive = false;
    return this.repo.save(user);
  }
}
