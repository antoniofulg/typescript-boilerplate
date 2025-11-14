import { Module } from '@nestjs/common';
import { SessionLogService } from './session-log.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [SessionLogService],
  exports: [SessionLogService],
})
export class SessionLogsModule {}
