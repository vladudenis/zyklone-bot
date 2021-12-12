import { Injectable } from '@nestjs/common';
import { Card } from './card.class';

enum Suits {
  CLUBS,
  DIAMONDS,
  HEARTS,
  SPADES,
}

enum Ranks {
  TWO,
  THREE,
  FOUR,
  FIVE,
  SIX,
  SEVEN,
  EIGHT,
  NINE,
  TEN,
  JACK,
  QUEEN,
  KING,
  ACE,
}

@Injectable()
export class Deck {
  private readonly deck: Card[];
  private readonly drawnCards: Card[] = [];

  constructor() {
    this.deck = [];

    let i = 0;
    while (i <= 52) {
      for (let j = 0; j <= 3; j++) {
        for (let k = 0; k <= 12; k++) {
          this.deck.push(new Card([Suits[j], Ranks[k]]));
          i++;
        }
      }
    }

    this.shuffleDeck();
  }

  get pickRandomCard(): Card {
    let card: Card;

    do {
      card = this.deck[Math.floor(Math.random() * 52)];
    } while (this.drawnCards.includes(card));
    this.drawnCards.push(card);

    return card;
  }

  shuffleDeck(): void {
    let currentIndex = this.deck.length;
    let randomIndex: number;

    while (currentIndex != 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      [this.deck[currentIndex], this.deck[randomIndex]] = [
        this.deck[randomIndex],
        this.deck[currentIndex],
      ];
    }
  }
}
