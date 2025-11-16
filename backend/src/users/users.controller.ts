import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { DeleteUserDto } from './dto/delete-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SuperUserGuard } from '../auth/guards/super-user.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { RbacService } from '../rbac/rbac.service';
import { UserRole } from '@prisma/client';

@Controller('users')
@UseGuards(JwtAuthGuard, SuperUserGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly rbacService: RbacService,
  ) {}

  @Post()
  create(
    @Body() createUserDto: CreateUserDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.usersService.create(createUserDto, user.userId);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Get(':id/effective-permissions')
  async getEffectivePermissions(@Param('id') id: string) {
    return this.rbacService.getUserEffectivePermissions(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const targetUser = await this.usersService.findOne(id);
    const isSuperUser = targetUser.role === UserRole.SUPER_USER;
    const isChangingToSuperUser =
      updateUserDto.role === UserRole.SUPER_USER &&
      targetUser.role !== UserRole.SUPER_USER;

    if (
      (isSuperUser || isChangingToSuperUser) &&
      !updateUserDto.passwordConfirmation
    ) {
      throw new BadRequestException(
        'Confirmação de senha é obrigatória para operações em SUPER_USER',
      );
    }

    return this.usersService.update(id, updateUserDto, user.userId);
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Body() deleteUserDto: DeleteUserDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    // Check if user to be deleted is SUPER_USER
    const targetUser = await this.usersService.findOne(id);
    const isSuperUser = targetUser.role === UserRole.SUPER_USER;

    if (isSuperUser) {
      if (!deleteUserDto.passwordConfirmation) {
        throw new BadRequestException(
          'Confirmação de senha é obrigatória para deletar SUPER_USER',
        );
      }

      await this.usersService.verifyPasswordForSuperUserOperation(
        user.userId,
        deleteUserDto.passwordConfirmation,
      );
    }

    return this.usersService.remove(id);
  }
}
