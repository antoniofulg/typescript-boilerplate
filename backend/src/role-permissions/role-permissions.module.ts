import { Module } from '@nestjs/common';
import { RolePermissionsController } from './role-permissions.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RolePermissionsController],
})
export class RolePermissionsModule {}
