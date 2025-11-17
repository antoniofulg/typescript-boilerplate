import { Module } from '@nestjs/common';
import { UserPermissionsController } from './user-permissions.controller';
import { AssignmentModule } from '../assignments/assignment.module';

@Module({
  imports: [AssignmentModule],
  controllers: [UserPermissionsController],
})
export class UserPermissionsModule {}
