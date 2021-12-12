import { Injectable } from '@nestjs/common';
import { Chips } from './chips.class';
import { Card } from './card.class';

@Injectable()
export class Player {
  private readonly chips: Chips;

  constructor(
    private readonly id: string,
    private readonly hand: [Card, Card],
  ) {
    this.chips = new Chips();
  }

  get getId(): string {
    return this.id;
  }

  get getHand(): [Card, Card] {
    return this.hand;
  }

  get getChips(): Chips {
    return this.chips;
  }
}
