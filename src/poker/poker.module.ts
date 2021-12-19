import { Module } from '@nestjs/common';
import { PokerService } from './poker.service';

@Module({
  providers: [PokerService],
  exports: [PokerService],
})
export class PokerModule {}
