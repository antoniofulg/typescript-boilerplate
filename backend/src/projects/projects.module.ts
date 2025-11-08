import { Module } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}

