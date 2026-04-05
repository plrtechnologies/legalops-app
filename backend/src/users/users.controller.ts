import { Controller, Get, Post, Patch, Param, Body, Req, UseGuards } from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { User, UserRole } from './entities/user.entity';
import { UsersService, CreateUserDto, UpdateUserDto } from './users.service';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly service: UsersService) {}

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.FIRM_ADMIN)
  findAll(@Req() req: ExpressRequest) {
    const user = req.user as User;
    return this.service.findAll(user.tenantId);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FIRM_ADMIN)
  findOne(@Req() req: ExpressRequest, @Param('id') id: string) {
    const user = req.user as User;
    return this.service.findOne(user.tenantId, id);
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.FIRM_ADMIN)
  create(@Req() req: ExpressRequest, @Body() dto: CreateUserDto) {
    const user = req.user as User;
    return this.service.create(user.tenantId, dto);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FIRM_ADMIN)
  update(@Req() req: ExpressRequest, @Param('id') id: string, @Body() dto: UpdateUserDto) {
    const user = req.user as User;
    return this.service.update(user.tenantId, id, dto);
  }

  @Patch(':id/deactivate')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FIRM_ADMIN)
  deactivate(@Req() req: ExpressRequest, @Param('id') id: string) {
    const user = req.user as User;
    return this.service.deactivate(user.tenantId, id);
  }
}
