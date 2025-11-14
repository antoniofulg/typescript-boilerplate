import { Module } from '@nestjs/common';
import { AuditLogService } from './audit-log.service';
import { AuditLogsController } from './audit-logs.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { RbacModule } from '../rbac/rbac.module';

@Module({
  imports: [PrismaModule, RbacModule],
  controllers: [AuditLogsController],
  providers: [AuditLogService],
  exports: [AuditLogService],
})
export class AuditLogsModule {}
