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

  constructor(fives = 10, tens = 5, twenties = 5, fifties = 2, hundreds = 1) {
    this.chips = {
      fives,
      tens,
      twenties,
      fifties,
      hundreds,
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

  get getAvailableFives(): number {
    return this.chips.fives;
  }

  get getAvailableTens(): number {
    return this.chips.tens;
  }

  resetChips(): void {
    this.chips.hundreds = 0;
    this.chips.fifties = 0;
    this.chips.twenties = 0;
    this.chips.tens = 0;
    this.chips.fives = 0;
  }

  addFives(amount) {
    this.chips.fives += amount;
  }

  takeFives(amount) {
    this.chips.fives -= amount;
  }

  addTens(amount) {
    this.chips.tens += amount;
  }

  takeTens(amount) {
    this.chips.tens -= amount;
  }

  addTwenties(amount) {
    this.chips.twenties += amount;
  }

  takeTwenties(amount) {
    this.chips.twenties -= amount;
  }

  addFifties(amount) {
    this.chips.fifties += amount;
  }

  takeFifties(amount) {
    this.chips.fifties -= amount;
  }

  addHundreds(amount) {
    this.chips.hundreds += amount;
  }

  takeHundreds(amount) {
    this.chips.hundreds -= amount;
  }
}
