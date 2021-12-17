import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Player } from './classes/player.class';
import { Deck } from './classes/deck.class';
import { Card } from './classes/card.class';
import ChipsInterface from './interfaces/chips.interface';

const GameStates: Map<string, [boolean, boolean, boolean]> = new Map([
  ['Start', [false, false, false]],
  ['Flop', [true, false, false]],
  ['Turn', [true, true, false]],
  ['River', [true, true, true]],
]);

enum WinningHands {
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
export class DealerService {
  // Per Game
  private deck: Deck;
  private players: Player[];
  private interestedPlayers: string[];
  private match: boolean;
  private gameState: [boolean, boolean, boolean];

  // Per Round
  private cardSet: Card[];

  // Per Turn
  private turn: Player;
  private betHeap: ChipsInterface;

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

  private set setNewGameState(state: [boolean, boolean, boolean]) {
    this.gameState = state;
  }

  private computeHand(hand: [Card, Card]): number {
    // calculate using enum
    return 0;
  }

  private checkWhoWon(): void {
    let winningPlayer: Player = this.players[0];
    let tie = 0;

    this.players.forEach((player) => {
      if (
        this.computeHand(player.getHand) >
        this.computeHand(winningPlayer.getHand)
      ) {
        winningPlayer = player;
      } else if (
        this.computeHand(player.getHand) ===
        this.computeHand(winningPlayer.getHand)
      ) {
        tie++;
      }
    });

    // check if there is a game-winner: if yes, reset table and notify players
    // if no, notify players about the outcome of the round
  }

  private updateGameState(): void {
    const playerIndex = this.players.indexOf(this.turn);
    const finishedRound = (playerIndex + 1) % this.players.length === 0;

    if (finishedRound) {
      switch (this.gameState) {
        case GameStates.get('Start'):
          this.setNewGameState = GameStates.get('Flop');
          const firstCard = this.deck.pickRandomCard;
          const secondCard = this.deck.pickRandomCard;
          const thirdCard = this.deck.pickRandomCard;
          this.cardSet = [firstCard, secondCard, thirdCard];
          break;
        case GameStates.get('Flop'):
          this.setNewGameState = GameStates.get('Turn');
          const fourthCard = this.deck.pickRandomCard;
          this.cardSet.push(fourthCard);
          break;
        case GameStates.get('Turn'):
          this.setNewGameState = GameStates.get('River');
          const fifthCard = this.deck.pickRandomCard;
          this.cardSet.push(fifthCard);
          break;
        case GameStates.get('River'):
          this.setNewGameState = GameStates.get('Start');
          this.checkWhoWon();
          break;
      }
    }
    this.setCurrentTurn = this.players[(playerIndex + 1) % this.players.length];
  }

  private resetTable(): void {
    this.cardSet = [];
    this.players = [];
    this.setMatch = false;
    this.setCurrentTurn = null;
    this.setNewGameState = [false, false, false];
  }

  findPlayer(id): Player | false {
    this.players.forEach((player) => {
      if (player.getId === id) {
        return player;
      }
    });

    return false;
  }

  addInterestedPlayer(playerId: string): void {
    this.interestedPlayers.push(playerId);
  }

  initPokerTable(): void {
    this.deck = new Deck();
    this.interestedPlayers.forEach((playerId) => {
      const firstCard = this.deck.pickRandomCard;
      const secondCard = this.deck.pickRandomCard;
      const hand: [Card, Card] = [firstCard, secondCard];

      this.players.push(new Player(playerId, hand));
    });
    this.setInterestedPlayers = [];
    this.setMatch = true;
    this.setCurrentTurn = this.players[0];
    this.setNewGameState = [false, false, false];
  }

  playerMakesBet(player: Player, amount: number) {
    if (this.turn.getId === player.getId) {
      // makes bet
      this.updateGameState();
    } else {
      throw new InternalServerErrorException('Player turn inconsistency.');
    }
  }

  playerThrowsHand(player: Player) {
    if (this.turn.getId === player.getId) {
      this.players = this.players.filter(
        (thisPlayer) => thisPlayer.getId !== player.getId,
      );
      this.updateGameState();
    } else {
      throw new InternalServerErrorException('Player turn inconsistency.');
    }
  }
}
