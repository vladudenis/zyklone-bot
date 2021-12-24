import { Injectable } from '@nestjs/common';
import ChipsInterface from '../interfaces/chips.interface';

enum ChipTypes {
  Fives = 'fives',
  Tens = 'tens',
  Twenties = 'twenties',
  Fifties = 'fifties',
  Hundreds = 'hundreds',
}

@Injectable()
export class Chips {
  private readonly chips: ChipsInterface;

  constructor() {
    this.chips = {
      fives: 10,
      tens: 5,
      twenties: 5,
      fifties: 2,
      hundreds: 1,
    };
  }

  get getChipWealth(): ChipsInterface {
    return this.chips;
  }

  get getChipsRawAmount(): number {
    let rawAmount = 0;

    for (const [key, value] of Object.entries(this.chips)) {
      switch (key) {
        case ChipTypes.Fives:
          rawAmount += value * 5;
          break;

        case ChipTypes.Tens:
          rawAmount += value * 10;
          break;

        case ChipTypes.Twenties:
          rawAmount += value * 20;
          break;

        case ChipTypes.Fifties:
          rawAmount += value * 50;
          break;

        case ChipTypes.Hundreds:
          rawAmount += value * 100;
          break;
      }
    }

    return rawAmount;
  }

  set addFives(amount) {
    this.chips.fives += amount;
  }

  set takeFives(amount) {
    this.chips.fives -= amount;
  }

  set addTens(amount) {
    this.chips.tens += amount;
  }

  set takeTens(amount) {
    this.chips.tens -= amount;
  }

  set addTwenties(amount) {
    this.chips.twenties += amount;
  }

  set takeTwenties(amount) {
    this.chips.twenties -= amount;
  }

  set addFifties(amount) {
    this.chips.fifties += amount;
  }

  set takeFifties(amount) {
    this.chips.fifties -= amount;
  }

  set addHundreds(amount) {
    this.chips.hundreds += amount;
  }

  set takeHundreds(amount) {
    this.chips.hundreds -= amount;
  }
}
