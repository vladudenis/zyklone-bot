import { Injectable } from '@nestjs/common';
import ChipsInterface from '../interfaces/chips.interface';

enum ChipTypes {
  Fives = 5,
  Tens = 10,
  Twenties = 20,
  Fifties = 50,
  Hundreds = 100,
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
    return Object.values(this.chips).reduce((prev, current) => {
      switch (current) {
        case ChipTypes.Fives:
          return prev + current * 5;

        case ChipTypes.Tens:
          return prev + current * 10;

        case ChipTypes.Twenties:
          return prev + current * 20;

        case ChipTypes.Fifties:
          return prev + current * 50;

        case ChipTypes.Hundreds:
          return prev + current * 100;
      }
    });
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
