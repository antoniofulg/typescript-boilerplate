import { Module } from '@nestjs/common';
import { VotesService } from './votes.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [VotesService],
  exports: [VotesService],
})
export class VotesModule {}

