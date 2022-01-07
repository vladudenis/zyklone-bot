import { Card } from '../classes/card.class';

enum Ranks {
  'TWO' = 2,
  'THREE',
  'FOUR',
  'FIVE',
  'SIX',
  'SEVEN',
  'EIGHT',
  'NINE',
  'TEN',
  'JACK',
  'QUEEN',
  'KING',
  'ACE',
}

export default function bubbleSortCards(arr: Card[]): Card[] {
  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < arr.length - i - 1; j++) {
      if (Ranks[arr[j].getRank] > Ranks[arr[j + 1].getRank]) {
        const temp = Ranks[arr[j].getRank];
        Ranks[arr[j].getRank] = Ranks[arr[j + 1].getRank];
        Ranks[arr[j + 1].getRank] = temp;
      }
    }
  }

  return arr;
}
