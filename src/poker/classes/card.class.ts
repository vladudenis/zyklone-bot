import { Injectable } from '@nestjs/common';

@Injectable()
export class Card {
  constructor(private readonly card: [string, string]) {}

  get getSuit(): string {
    return this.card[0];
  }

  get getRank(): string {
    return this.card[1];
  }

  get getUniqueIdentifier(): string {
    return `${this.card[0]}${this.card[1]}`;
  }
}
