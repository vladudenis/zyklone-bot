import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Player } from './classes/player.class';
import { Deck } from './classes/deck.class';
import { Card } from './classes/card.class';
import ChipsInterface from './interfaces/chips.interface';
import { Chips } from './classes/chips.class';
import { Message } from 'discord.js';

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

enum WinningConditions {
  HIGH_CARD,
  ONE_PAIR,
  TWO_PAIR,
  THREE_OF_A_KIND,
  STRAIGHT,
  FLUSH,
  FULL_HOUSE,
  FOUR_OF_A_KIND,
  STRAIGHT_FLUSH,
  ROYAL_FLUSH,
}

@Injectable()
export class PokerService {
  // Per Game
  private deck: Deck;
  private players: Player[] = [];
  private interestedPlayers: string[] = [];
  private match: boolean;
  private gameState: 'Start' | 'Flop' | 'Turn' | 'River';

  // Per Round
  private cardSet: Card[];
  private betHeap: ChipsInterface;

  // Per Turn
  private turn: Player;

  get getInterestedPlayers(): string[] {
    return this.interestedPlayers;
  }

  get matchIsOngoing(): boolean {
    return this.match;
  }

  get getCurrentTurn(): Player {
    return this.turn;
  }

  private set setMatch(state: boolean) {
    this.match = state;
  }

  private set setInterestedPlayers(players: string[]) {
    this.interestedPlayers = players;
  }

  private set setCurrentTurn(player: Player) {
    this.turn = player;
  }

  private set setNewGameState(state: 'Start' | 'Flop' | 'Turn' | 'River') {
    this.gameState = state;
  }

  private bubbleSortCards(arr: Card[]): Card[] {
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

  private computeHand(hand: [Card, Card]): number {
    const [firstHand, secondHand] = hand;
    const pairs = new Map<string, number>();
    let flush = true;
    let straight = true;

    let cardSet: Card[] = [];
    this.cardSet.forEach((card) => cardSet.push(Ranks[card.getRank]));
    cardSet = cardSet.concat(
      Ranks[firstHand.getRank],
      Ranks[secondHand.getRank],
    );
    cardSet = this.bubbleSortCards(cardSet);

    // See if card set + hand has a win condition
    for (let i = 0; i < cardSet.length; i++) {
      if (
        cardSet[i - 1] &&
        Ranks[cardSet[i].getRank] === Ranks[cardSet[i - 1].getRank]
      ) {
        // Look for pairs
        if (!pairs.get(Ranks[i])) {
          pairs.set(Ranks[i], 1);
        } else if (pairs.get(Ranks[i]) === 1) {
          pairs.set(Ranks[i], 2);
        } else if (pairs.get(Ranks[i]) === 2) {
          pairs.set(Ranks[i], 3);
        } else if (pairs.get(Ranks[i]) === 3) {
          pairs.set(Ranks[i], 4);
        }
      } else if (cardSet[i - 1] && flush) {
        // Look for flush
        if (cardSet[i].getSuit !== cardSet[i - 1].getSuit) {
          flush = false;
        }
      } else if (cardSet[i + 1] && straight) {
        // Look for straight
        if (Ranks[i] + 1 !== Ranks[i + 1]) {
          straight = false;
        }
      }
    }

    // Determine highest win code and return it
    const winCons: number[] = [WinningConditions.HIGH_CARD];
    if (
      straight &&
      flush &&
      Ranks[cardSet[0].getRank] === 10 &&
      Ranks[cardSet[cardSet.length - 1].getRank] === 14
    ) {
      winCons.push(WinningConditions.ROYAL_FLUSH);
    } else if (straight && flush) {
      winCons.push(WinningConditions.STRAIGHT_FLUSH);
    } else if (flush) {
      winCons.push(WinningConditions.FLUSH);
    } else if (straight) {
      winCons.push(WinningConditions.STRAIGHT);
    } else {
      for (const value of pairs.values()) {
        switch (value) {
          case 1:
            if (winCons.includes(WinningConditions.THREE_OF_A_KIND)) {
              winCons.push(WinningConditions.FULL_HOUSE);
            } else if (winCons.includes(WinningConditions.ONE_PAIR)) {
              winCons.push(WinningConditions.TWO_PAIR);
            } else {
              winCons.push(WinningConditions.ONE_PAIR);
            }
            break;
          case 2:
            if (winCons.includes(WinningConditions.ONE_PAIR)) {
              const index = winCons.indexOf(WinningConditions.ONE_PAIR);
              winCons.splice(index, 1);
              if (winCons.includes(WinningConditions.ONE_PAIR)) {
                winCons.push(WinningConditions.FULL_HOUSE);
              } else {
                winCons.push(WinningConditions.THREE_OF_A_KIND);
              }
            }
            break;
          case 3:
            const index = winCons.indexOf(WinningConditions.THREE_OF_A_KIND);
            winCons.splice(index, 1);
            winCons.push(WinningConditions.FOUR_OF_A_KIND);
        }
      }
    }

    return Math.max(...winCons);
  }

  private async checkWhoWon(message: Message): Promise<void> {
    let winningPlayer: Player;
    const tie: Player[] = [];

    this.players.forEach((player) => {
      if (
        !winningPlayer ||
        this.computeHand(player.getHand) >
          this.computeHand(winningPlayer.getHand)
      ) {
        winningPlayer = player;
        tie.push(winningPlayer);
      } else if (
        tie.length === 0 ||
        this.computeHand(player.getHand) ===
          this.computeHand(winningPlayer.getHand)
      ) {
        tie.push(player);
      }
    });

    if (tie.length > 1) {
      const secondTie: Player[] = [];
      tie.forEach((tiedPlayer) => {
        const tiedPlayerHandValue =
          Ranks[tiedPlayer.getHand[0].getRank] +
          Ranks[tiedPlayer.getHand[1].getRank];
        const winningPlayerHandValue =
          Ranks[winningPlayer.getHand[0].getRank] +
          Ranks[winningPlayer.getHand[1].getRank];
        if (tiedPlayerHandValue > winningPlayerHandValue) {
          winningPlayer = tiedPlayer;
          secondTie.push(winningPlayer);
        } else if (tiedPlayerHandValue === winningPlayerHandValue) {
          secondTie.push(tiedPlayer);
        }
      });

      if (secondTie.length > 1) {
        winningPlayer = undefined;
      }
    }

    if (winningPlayer) {
      const winningPlayerChips = winningPlayer.getChips;
      for (const [key, value] of Object.entries(this.betHeap)) {
        switch (key) {
          case 'hundreds':
            for (let i = 0; i <= value; i++) {
              winningPlayerChips.addHundreds;
            }
            break;
          case 'fifties':
            for (let i = 0; i <= value; i++) {
              winningPlayerChips.addFifties;
            }
            break;
          case 'twenties':
            for (let i = 0; i <= value; i++) {
              winningPlayerChips.addTwenties;
            }
            break;
          case 'tens':
            for (let i = 0; i <= value; i++) {
              winningPlayerChips.addTens;
            }
            break;
          case 'fives':
            for (let i = 0; i <= value; i++) {
              winningPlayerChips.addFives;
            }
            break;
        }
      }
      await message.channel.send(`${winningPlayer.getTag} has won this round!`);
    } else {
      await message.channel.send("Nobody has won the round! It's a dead draw!");
    }

    if (this.players.length) {
      await message.channel.send('Starting a new round...');
    } else {
      await message.channel.send(`${winningPlayer.getTag} has won the game!`);
      this.resetTable();
    }
  }

  private async updateGameState(message: Message): Promise<void> {
    const playerIndex = this.players.indexOf(this.turn);
    const finishedRound = (playerIndex + 1) % this.players.length === 0;

    if (finishedRound) {
      switch (this.gameState) {
        case 'Start':
          this.setNewGameState = 'Flop';
          const firstCard = this.deck.pickRandomCard;
          const secondCard = this.deck.pickRandomCard;
          const thirdCard = this.deck.pickRandomCard;
          this.cardSet = [firstCard, secondCard, thirdCard];
          await message.channel.send('Placing flop on the table...');
          break;
        case 'Flop':
          this.setNewGameState = 'Turn';
          const fourthCard = this.deck.pickRandomCard;
          this.cardSet.push(fourthCard);
          await message.channel.send('Placing turn on the table...');
          break;
        case 'Turn':
          this.setNewGameState = 'River';
          const fifthCard = this.deck.pickRandomCard;
          this.cardSet.push(fifthCard);
          await message.channel.send('Placing river on the table...');
          break;
        case 'River':
          await this.checkWhoWon(message);
          this.setNewGameState = 'Start';
          this.cardSet = [];
          this.betHeap = {
            hundreds: 0,
            fifties: 0,
            twenties: 0,
            tens: 0,
            fives: 0,
          };
          break;
      }
    }

    this.setCurrentTurn = this.players[(playerIndex + 1) % this.players.length];
    await message.channel.send(`It is ${message.author.tag}'s turn.`);
  }

  private resetTable(): void {
    this.cardSet = [];
    this.betHeap = {
      hundreds: 0,
      fifties: 0,
      twenties: 0,
      tens: 0,
      fives: 0,
    };
    this.players = [];
    this.setMatch = false;
    this.setCurrentTurn = null;
    this.setNewGameState = 'Start';
  }

  findPlayer(tag: string): Player | false {
    const foundPlayer = this.players.filter((player) => player.getTag === tag);
    if (foundPlayer.length) {
      return foundPlayer[0];
    } else {
      return false;
    }
  }

  addInterestedPlayer(playerTag: string): void {
    this.interestedPlayers.push(playerTag);
  }

  async initPokerTable(message: Message): Promise<void> {
    this.deck = new Deck();
    this.interestedPlayers.forEach((playerTag) => {
      const firstCard = this.deck.pickRandomCard;
      const secondCard = this.deck.pickRandomCard;
      const hand: [Card, Card] = [firstCard, secondCard];

      this.players.push(new Player(playerTag, hand));
    });
    this.setInterestedPlayers = [];
    this.setMatch = true;
    this.setCurrentTurn = this.players[0];
    this.setNewGameState = 'Start';
    await message.channel.send(
      `Poker table has been set up. It is ${this.getCurrentTurn.getTag}'s turn.`,
    );
  }

  async playerMakesBet(
    player: Player,
    amount: number,
    message: Message,
  ): Promise<string | true> {
    if (this.turn.getTag === player.getTag) {
      const playerChips: Chips = player.getChips;
      const playerWealth: ChipsInterface = playerChips.getChipWealth;

      if (amount % 100 === 0) {
        if (playerWealth.hundreds < amount / 100) {
          return `You only have ${playerWealth.hundreds} tokens worth 100. Please bet an amount that you actually own!`;
        }
        for (let i = 0; i < amount / 100; i++) {
          playerChips.takeHundreds;
          this.betHeap.hundreds += amount / 100;
        }
      } else if (amount % 50 === 0) {
        if (playerWealth.fifties < amount / 50) {
          return `You only have ${playerWealth.fifties} tokens worth 50. Please bet an amount that you actually own!`;
        }
        for (let i = 0; i < amount / 50; i++) {
          playerChips.takeFifties;
          this.betHeap.fifties += amount / 50;
        }
      } else if (amount % 20 === 0) {
        if (playerWealth.twenties < amount / 20) {
          return `You only have ${playerWealth.twenties} tokens worth 20. Please bet an amount that you actually own!`;
        }
        for (let i = 0; i < amount / 20; i++) {
          playerChips.takeTwenties;
          this.betHeap.twenties += amount / 20;
        }
      } else if (amount % 10 === 0) {
        if (playerWealth.tens < amount / 10) {
          return `You only have ${playerWealth.tens} tokens worth 10. Please bet an amount that you actually own!`;
        }
        for (let i = 0; i < amount / 10; i++) {
          playerChips.takeTens;
          this.betHeap.tens += amount / 10;
        }
      } else if (amount % 5 === 0) {
        if (playerWealth.fives < amount / 5) {
          return `You only have ${playerWealth.fives} tokens worth 5. Please bet an amount that you actually own!`;
        }
        for (let i = 0; i < amount / 5; i++) {
          playerChips.takeFives;
          this.betHeap.fives += amount / 5;
        }
      } else {
        return 'You can only use your tokens to bet. Please bet a correct amount!';
      }

      await this.updateGameState(message);
      return true;
    } else {
      throw new InternalServerErrorException('Player turn inconsistency.');
    }
  }

  async playerThrowsHand(player: Player, message: Message): Promise<void> {
    if (this.turn.getTag === player.getTag) {
      this.players = this.players.filter(
        (thisPlayer) => thisPlayer.getTag !== player.getTag,
      );
      await this.updateGameState(message);
    } else {
      throw new InternalServerErrorException('Player turn inconsistency.');
    }
  }
}
