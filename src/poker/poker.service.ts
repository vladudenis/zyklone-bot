import { Injectable } from '@nestjs/common';
import { Player } from './classes/player.class';
import { Deck } from './classes/deck.class';
import { Card } from './classes/card.class';
import ChipsInterface from './interfaces/chips.interface';
import { Chips } from './classes/chips.class';
import { Message } from 'discord.js';
import bubbleSortCards from './utils/bubbleSortCards';

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
  // This is both the minimum and maximum number of players
  private maxPlayers = 4;

  // Per Game
  private deck: Deck;
  private players: Player[] = [];
  private interestedPlayers: string[] = [];
  private game: boolean;

  // Per Match
  private cardSet: Card[];
  private betHeap: Chips;
  private matchState: 'Start' | 'Flop' | 'Turn' | 'River';
  private activePlayers: Player[];

  // Per Round
  private extendRound: boolean;
  private extendRoundDecisionPending: boolean;
  private lastPlayerBet: Chips;

  // Per Turn
  private turn: Player;

  // Getters
  get getMaxPlayerCount(): number {
    return this.maxPlayers;
  }

  get getDeck(): Deck {
    return this.deck;
  }

  get getInterestedPlayers(): string[] {
    return this.interestedPlayers;
  }

  get getPlayers(): Player[] {
    return this.players;
  }

  get getActivePlayers(): Player[] {
    return this.activePlayers;
  }

  get gameIsOngoing(): boolean {
    return this.game;
  }

  get getCurrentTurn(): Player {
    return this.turn;
  }

  get getCurrentMatchState(): 'Start' | 'Flop' | 'Turn' | 'River' {
    return this.matchState;
  }

  get getCardSet(): Card[] {
    return this.cardSet;
  }

  get getBetHeap(): Chips {
    return this.betHeap;
  }

  findPlayer(tag: string): Player | false {
    const foundPlayer = this.players.filter((player) => player.getTag === tag);
    if (foundPlayer.length) {
      return foundPlayer[0];
    } else {
      return false;
    }
  }

  // Setters
  set setGame(state: boolean) {
    this.game = state;
  }

  set setInterestedPlayers(players: string[]) {
    this.interestedPlayers = players;
  }

  set setActivePlayers(players: Player[]) {
    this.activePlayers = players;
  }

  set setCurrentTurn(player: Player) {
    this.turn = player;
  }

  set setNewMatchState(state: 'Start' | 'Flop' | 'Turn' | 'River') {
    this.matchState = state;
  }

  set setCardSet(cardSet: Card[]) {
    this.cardSet = cardSet;
  }

  set setPlayers(players: Player[]) {
    this.players = players;
  }

  set setExtendRound(extendRound: boolean) {
    this.extendRound = extendRound;
  }

  set setExtendRoundDecisionPending(extendRoundDecisionPending: boolean) {
    this.extendRoundDecisionPending = extendRoundDecisionPending;
  }

  set setLastPlayerBet(lastPlayerBet: Chips) {
    this.lastPlayerBet = lastPlayerBet;
  }

  addInterestedPlayer(playerTag: string): void {
    this.interestedPlayers.push(playerTag);
  }

  // Player Actions
  private async playerBetsSmallBlind(
    player: Player,
    message?: Message,
  ): Promise<void> {
    if (player.getChips.getAvailableFives >= 1) {
      player.getChips.takeFives(1);
      this.betHeap.addFives(1);
      this.setLastPlayerBet = new Chips(1, 0, 0, 0, 0);

      if (message) {
        await message.channel.send(
          `Player ${player.getTag} opened with the small blind`,
        );
      }
    } else {
      const wealth = player.getChips.getChipWealth;
      player.getChips.takeHundreds(wealth.hundreds);
      player.getChips.takeFifties(wealth.fifties);
      player.getChips.takeTwenties(wealth.twenties);
      player.getChips.takeTens(wealth.tens);
      player.getChips.takeFives(wealth.fives);

      if (message) {
        await message.channel.send(`PLayer ${player.getTag} has gone all in!`);
      }
    }
  }

  private async playerBetsBigBlind(
    player: Player,
    message?: Message,
  ): Promise<void> {
    if (player.getChips.getAvailableTens >= 1) {
      player.getChips.takeTens(1);
      this.betHeap.addTens(1);
      this.setLastPlayerBet = new Chips(0, 1, 0, 0, 0);

      if (message) {
        await message.channel.send(
          `Player ${player.getTag} followed up with the big blind`,
        );
      }
    } else if (player.getChips.getAvailableFives >= 2) {
      player.getChips.takeFives(2);

      if (message) {
        await message.channel.send(
          `Player ${player.getTag} followed up with the big blind`,
        );
      }
    } else {
      const wealth = player.getChips.getChipWealth;
      player.getChips.takeHundreds(wealth.hundreds);
      player.getChips.takeFifties(wealth.fifties);
      player.getChips.takeTwenties(wealth.twenties);
      player.getChips.takeTens(wealth.tens);
      player.getChips.takeFives(wealth.fives);

      if (message) {
        await message.channel.send(`PLayer ${player.getTag} has gone all in!`);
      }
    }
  }

  async playerChecks(player: Player, message?: Message): Promise<void> {
    if (
      this.lastPlayerBet.getChipsRawAmount >
        player.getBetAmount.getChipsRawAmount &&
      message
    ) {
      await message.channel.send(
        'You cannot check after someone has made a bet. Either match the amount or fold your hand.',
      );
      return;
    }

    // Player can choose to check to finish the round
    if (this.extendRoundDecisionPending) {
      this.extendRound = false;
      this.extendRoundDecisionPending = false;
    }

    if (message) {
      await message.channel.send(
        `Player ${this.getCurrentTurn.getTag} has checked.`,
      );
    }

    await this.updateMatchState(message);
  }

  async playerRaises(
    player: Player,
    amount: number,
    message: Message,
  ): Promise<void> {
    if (this.extendRoundDecisionPending) {
      this.extendRound = true;
      this.extendRoundDecisionPending = false;
    }

    const playerChips: Chips = player.getChips;
    const playerWealth: ChipsInterface = playerChips.getChipWealth;
    let rawBetAmount = 0;

    if (amount > playerChips.getChipsRawAmount) {
      await message.channel.send(`You don't have enough tokens!`);
      return;
    }

    while (rawBetAmount < amount) {
      if (amount === playerChips.getChipsRawAmount) {
        this.betHeap.addHundreds(playerWealth.hundreds);
        this.betHeap.addFifties(playerWealth.fifties);
        this.betHeap.addTwenties(playerWealth.twenties);
        this.betHeap.addTens(playerWealth.tens);
        this.betHeap.addFives(playerWealth.fives);

        playerChips.takeHundreds(playerWealth.hundreds);
        playerChips.takeFifties(playerWealth.fifties);
        playerChips.takeTwenties(playerWealth.twenties);
        playerChips.takeTens(playerWealth.tens);
        playerChips.takeFives(playerWealth.fives);

        rawBetAmount += amount;
      } else if (amount % 100 === 0) {
        this.betHeap.addHundreds(amount / 100);
        playerChips.takeHundreds(amount / 100);
        rawBetAmount += amount / 100;
      } else if (amount % 50 === 0) {
        this.betHeap.addFifties(amount / 50);
        playerChips.takeFifties(amount / 50);
        rawBetAmount += amount / 50;
      } else if (amount % 20 === 0) {
        this.betHeap.addTwenties(amount / 20);
        playerChips.takeTwenties(amount / 20);
        rawBetAmount += amount / 20;
      } else if (amount % 10 === 0) {
        this.betHeap.addTens(amount / 10);
        playerChips.takeTens(amount / 10);
        rawBetAmount += amount / 10;
      } else if (amount % 5 === 0) {
        this.betHeap.addFives(amount / 5);
        playerChips.takeFives(amount / 5);
        rawBetAmount += amount / 5;
      } else {
        await message.channel.send(
          'You can only use tokens to bet. Please bet a correct amount!',
        );
        return;
      }
    }

    if (playerChips.getChipsRawAmount === 0) {
      await message.channel.send(`Player ${this.turn.getTag} has gone all in!`);
    } else {
      await message.channel.send(
        `Player ${this.turn.getTag} has made a bet of ${amount}.`,
      );
    }

    await this.updateMatchState(message);
  }

  async playerFoldsHand(player: Player, message?: Message): Promise<void> {
    const playerIndex = this.activePlayers.indexOf(this.getCurrentTurn);

    this.setActivePlayers = this.activePlayers.filter(
      (thisPlayer) => thisPlayer.getTag !== player.getTag,
    );
    this.setCurrentTurn =
      this.activePlayers[playerIndex % this.activePlayers.length];

    if (message) {
      if (this.getActivePlayers.length === 1) {
        this.checkWhoWon();
      }

      await message.channel.send(
        `Player ${message.author.tag} has folded his hand.`,
      );
      await message.channel.send(`It is ${this.getCurrentTurn.getTag}'s turn.`);
    }
  }

  // Table Management
  private resetTable(): void {
    this.setCardSet = undefined;
    this.setLastPlayerBet = undefined;
    this.setPlayers = [];
    this.setActivePlayers = [];
    this.setExtendRound = undefined;
    this.setExtendRoundDecisionPending = undefined;
    this.betHeap.resetChips();
    this.setGame = false;
    this.setCurrentTurn = undefined;
    this.setNewMatchState = 'Start';
  }

  async initPokerTable(message?: Message): Promise<void> {
    this.deck = new Deck();
    this.interestedPlayers.forEach((playerTag) => {
      const firstCard = this.deck.pickRandomCard;
      const secondCard = this.deck.pickRandomCard;
      const hand: [Card, Card] = [firstCard, secondCard];

      this.players.push(new Player(playerTag, hand));
    });
    this.betHeap = new Chips(0, 0, 0, 0, 0);
    this.setInterestedPlayers = [];
    this.setActivePlayers = this.players;
    this.setGame = true;
    this.setNewMatchState = 'Start';
    this.setExtendRound = false;
    this.setExtendRoundDecisionPending = false;

    if (message) {
      await message.channel.send('Poker table has been set up.');
    }

    await this.autoMatchOpenings(message);
  }

  // Internal Utilities
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
    cardSet = bubbleSortCards(cardSet);

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

  private async checkWhoWon(message?: Message): Promise<void> {
    let winningPlayer: Player;
    const tie: Player[] = [];

    if (this.getActivePlayers.length) {
      this.activePlayers.forEach((player) => {
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
    }

    if (winningPlayer) {
      const winningPlayerChips = winningPlayer.getChips;
      for (const [key, value] of Object.entries(this.betHeap)) {
        switch (key) {
          case 'hundreds':
            winningPlayerChips.addHundreds(value);
            break;
          case 'fifties':
            winningPlayerChips.addFifties(value);
            break;
          case 'twenties':
            winningPlayerChips.addTwenties(value);
            break;
          case 'tens':
            winningPlayerChips.addTens(value);
            break;
          case 'fives':
            winningPlayerChips.addFives(value);
            break;
        }
      }

      if (!message) {
        return;
      }

      await message.channel.send(`${winningPlayer.getTag} has won this match!`);
    } else {
      if (message) {
        await message.channel.send(
          "Nobody has won the match! It's a dead draw!",
        );
      }
    }

    if (this.players.length) {
      if (message) {
        await message.channel.send('Starting a new match...');
      }
      this.setActivePlayers = this.players;
      await this.autoMatchOpenings(message);
    } else {
      if (message) {
        await message.channel.send(`${winningPlayer.getTag} has won the game!`);
      }
      this.resetTable();
    }
  }

  private async updateMatchState(message?: Message): Promise<void> {
    const playerIndex = this.activePlayers.indexOf(this.getCurrentTurn);
    const finishedRound = (playerIndex + 1) % this.activePlayers.length === 0;

    if (finishedRound) {
      if (!this.extendRound) {
        switch (this.matchState) {
          case 'Start':
            this.setNewMatchState = 'Flop';
            const firstCard = this.deck.pickRandomCard;
            const secondCard = this.deck.pickRandomCard;
            const thirdCard = this.deck.pickRandomCard;
            this.cardSet = [firstCard, secondCard, thirdCard];

            if (!message) {
              break;
            }

            await message.channel.send(
              `Placed FLOP on the table: ${firstCard}, ${secondCard}, ${thirdCard}`,
            );
            break;
          case 'Flop':
            this.setNewMatchState = 'Turn';
            const fourthCard = this.deck.pickRandomCard;
            this.cardSet.push(fourthCard);

            if (!message) {
              break;
            }

            await message.channel.send(
              `Placed TURN on the table: ${fourthCard}`,
            );
            break;
          case 'Turn':
            this.setNewMatchState = 'River';
            const fifthCard = this.deck.pickRandomCard;
            this.cardSet.push(fifthCard);

            if (!message) {
              break;
            }

            await message.channel.send(
              `Placed RIVER on the table: ${fifthCard}`,
            );
            break;
          case 'River':
            await this.checkWhoWon(message);
            this.setNewMatchState = 'Start';
            this.cardSet = [];
            this.betHeap.resetChips();
            break;
        }

        this.setCurrentTurn = this.activePlayers[0];

        if (!message) {
          return;
        }

        await message.channel.send(
          `It is ${this.getCurrentTurn.getTag}'s turn.`,
        );
        return;
      }

      this.setCurrentTurn = this.activePlayers[0];
      this.extendRoundDecisionPending = true;

      if (!message) {
        return;
      }

      await message.channel.send(
        `${this.getCurrentTurn.getTag}, do you want to raise and continue the round, or do you want to move on to the next round?
        Use the command "raise" to raise or "check" to move on to the next round.`,
      );
      return;
    }

    this.setCurrentTurn =
      this.activePlayers[(playerIndex + 1) % this.activePlayers.length];

    if (!message) {
      return;
    }

    await message.channel.send(`It is ${this.getCurrentTurn.getTag}'s turn.`);
  }

  private async autoMatchOpenings(message?: Message) {
    if (this.activePlayers.length < 2) {
      return;
    }

    await this.playerBetsSmallBlind(this.activePlayers[0], message);
    await this.playerBetsBigBlind(this.activePlayers[1], message);

    if (this.activePlayers.length >= 2) {
      this.setCurrentTurn = this.activePlayers[2];
    } else {
      this.setCurrentTurn = this.activePlayers[0];
    }

    if (!message) {
      return;
    }

    await message.channel.send(`It is ${this.getCurrentTurn.getTag}'s turn.`);
  }
}
