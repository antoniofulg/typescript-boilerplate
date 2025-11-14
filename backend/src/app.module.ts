import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TenantsModule } from './tenants/tenants.module';
import { LogsModule } from './logs/logs.module';
import { RbacModule } from './rbac/rbac.module';
import { PermissionsModule } from './permissions/permissions.module';
import { RolesModule } from './roles/roles.module';
import { RolePermissionsModule } from './role-permissions/role-permissions.module';
import { AssignmentModule } from './assignments/assignment.module';
import { UserRolesModule } from './user-roles/user-roles.module';
import { UserPermissionsModule } from './user-permissions/user-permissions.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { SessionLogsModule } from './session-logs/session-logs.module';
import { OperationLogsModule } from './operation-logs/operation-logs.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    TenantsModule,
    LogsModule,
    RbacModule,
    PermissionsModule,
    RolesModule,
    RolePermissionsModule,
    AssignmentModule,
    UserRolesModule,
    UserPermissionsModule,
    AuditLogsModule,
    SessionLogsModule,
    OperationLogsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
