import { Module } from '@nestjs/common';
import { DealerService } from './dealer.service';

@Module({
  providers: [DealerService],
  exports: [DealerService],
})
export class PokerModule {}
