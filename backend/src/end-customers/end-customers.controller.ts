import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User, UserRole } from '../users/entities/user.entity';
import { EndCustomersService, CreateEndCustomerDto, UpdateEndCustomerDto } from './end-customers.service';

@ApiTags('End customers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('end-customers')
export class EndCustomersController {
  constructor(private readonly service: EndCustomersService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.FIRM_ADMIN, UserRole.SENIOR_ADVOCATE, UserRole.PARALEGAL)
  create(@CurrentUser() user: User, @Body() dto: CreateEndCustomerDto) {
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
  findAll(@CurrentUser() user: User, @Query('bankClientId') bankClientId?: string) {
    if (bankClientId) {
      return this.service.findByBankClient(user.tenantId, bankClientId);
    }
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
  @Roles(UserRole.SUPER_ADMIN, UserRole.FIRM_ADMIN, UserRole.SENIOR_ADVOCATE, UserRole.PARALEGAL)
  update(@CurrentUser() user: User, @Param('id') id: string, @Body() dto: UpdateEndCustomerDto) {
    return this.service.update(user.tenantId, id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FIRM_ADMIN, UserRole.SENIOR_ADVOCATE)
  remove(@CurrentUser() user: User, @Param('id') id: string) {
    return this.service.remove(user.tenantId, id);
  }
}
