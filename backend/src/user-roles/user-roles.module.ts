import { Module } from '@nestjs/common';
import { UserRolesController } from './user-roles.controller';
import { AssignmentModule } from '../assignments/assignment.module';

@Module({
  imports: [AssignmentModule],
  controllers: [UserRolesController],
})
export class UserRolesModule {}
