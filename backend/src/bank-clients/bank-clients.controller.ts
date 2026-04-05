import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User, UserRole } from '../users/entities/user.entity';
import { BankClientsService, CreateBankClientDto, UpdateBankClientDto } from './bank-clients.service';

@ApiTags('Bank clients')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('bank-clients')
export class BankClientsController {
  constructor(private readonly service: BankClientsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.FIRM_ADMIN, UserRole.SENIOR_ADVOCATE)
  create(@CurrentUser() user: User, @Body() dto: CreateBankClientDto) {
    return this.service.create(user.tenantId, dto);
  }

  @Get()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.FIRM_ADMIN,
    UserRole.SENIOR_ADVOCATE,
    UserRole.PANEL_ADVOCATE,
    UserRole.PARALEGAL,
  )
  findAll(@CurrentUser() user: User) {
    return this.service.findAll(user.tenantId);
  }

  @Get(':id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.FIRM_ADMIN,
    UserRole.SENIOR_ADVOCATE,
    UserRole.PANEL_ADVOCATE,
    UserRole.PARALEGAL,
  )
  findOne(@CurrentUser() user: User, @Param('id') id: string) {
    return this.service.findOne(user.tenantId, id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FIRM_ADMIN, UserRole.SENIOR_ADVOCATE)
  update(@CurrentUser() user: User, @Param('id') id: string, @Body() dto: UpdateBankClientDto) {
    return this.service.update(user.tenantId, id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FIRM_ADMIN)
  remove(@CurrentUser() user: User, @Param('id') id: string) {
    return this.service.remove(user.tenantId, id);
  }
}
