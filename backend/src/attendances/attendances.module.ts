import { Module } from '@nestjs/common';
import { AttendancesService } from './attendances.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [AttendancesService],
  exports: [AttendancesService],
})
export class AttendancesModule {}
