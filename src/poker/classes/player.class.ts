import { Injectable } from '@nestjs/common';
import { Chips } from './chips.class';
import { Card } from './card.class';

@Injectable()
export class Player {
  private readonly chips: Chips;
  private readonly betAmount: Chips;

  constructor(
    private readonly tag: string,
    private readonly hand: [Card, Card],
  ) {
    this.chips = new Chips();
  }

  get getTag(): string {
    return this.tag;
  }

  get getHand(): [Card, Card] {
    return this.hand;
  }

  get getChips(): Chips {
    return this.chips;
  }

  get getBetAmount(): Chips {
    return this.betAmount;
  }
}
