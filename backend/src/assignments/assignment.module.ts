import { Module } from '@nestjs/common';
import { AssignmentService } from './assignment.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [PrismaModule, AuditLogsModule],
  providers: [AssignmentService],
  exports: [AssignmentService],
})
export class AssignmentModule {}
