import { PokerService } from './poker.service';
import { Chips } from './classes/chips.class';
import { Player } from './classes/player.class';
import { Deck } from './classes/deck.class';

describe('PokerService', () => {
  let pokerService: PokerService;

  beforeEach(async () => {
    pokerService = new PokerService();
    for (let i = 0; i < pokerService.getMaxPlayerCount; i++) {
      pokerService.addInterestedPlayer(`player${i}`);
    }
    await pokerService.initPokerTable();
  });

  describe('initPokerTable', () => {
    it('creates a deck', () => {
      // Deck has the correct size
      const deck = pokerService.getDeck;
      expect(deck.getDeckSize).toBe(52);

      // Deck doesn't contain duplicates
      const previousCards = [];
      const duplicates = [];
      deck.getDeck.forEach((card) => {
        const id = card.getUniqueIdentifier;
        if (!previousCards.includes(id)) {
          previousCards.push(id);
        } else {
          duplicates.push(id);
        }
      });
      expect(duplicates.length).toBe(0);
    });

    it('adds all interested players to the current game', () => {
      expect(pokerService.getInterestedPlayers.length).toBe(0);
      expect(pokerService.getPlayers.length).toBe(
        pokerService.getMaxPlayerCount,
      );
      expect(pokerService.getActivePlayers).toBe(pokerService.getPlayers);
    });

    it('gives each player a hand', () => {
      const players = pokerService.getPlayers;
      const previousHands = [];

      // Each player has a unique hand
      players.forEach((player) => {
        if (!previousHands.includes(player.getHand)) {
          previousHands.push(player.getHand);
        }
      });

      expect(previousHands.length).toBe(pokerService.getMaxPlayerCount);
    });

    it("sets the next player's turn correctly", () => {
      const expectedCurrentTurn = pokerService.getPlayers[2];
      expect(pokerService.getCurrentTurn).toBe(expectedCurrentTurn);
    });

    it('creates a bet heap', () => {
      const expectedBetHeap = new Chips(1, 1, 0, 0, 0);
      const betHeap = pokerService.getBetHeap;

      // Bet heap is the same as the expected bet heap
      expect(betHeap.getAvailableFives).toBe(expectedBetHeap.getAvailableFives);
      expect(betHeap.getAvailableTens).toBe(expectedBetHeap.getAvailableTens);
      expect(betHeap.getAvailableTwenties).toBe(
        expectedBetHeap.getAvailableTwenties,
      );
      expect(betHeap.getAvailableFifties).toBe(
        expectedBetHeap.getAvailableFifties,
      );
      expect(betHeap.getAvailableHundreds).toBe(
        expectedBetHeap.getAvailableHundreds,
      );
      expect(betHeap.getChipsRawAmount).toBe(expectedBetHeap.getChipsRawAmount);
    });

    it('sets the game and match state', () => {
      expect(pokerService.gameIsOngoing).toBe(true);
      expect(pokerService.getCurrentGameState).toBe('Start');
    });
  });

  describe('playerChecks', () => {
    it('updates the match state correctly', async () => {
      for (let i = 2; i <= pokerService.getMaxPlayerCount; i++) {
        if (i !== pokerService.getMaxPlayerCount) {
          expect(pokerService.getCurrentTurn).toBe(
            pokerService.getActivePlayers[i],
          );
        }

        await pokerService.playerChecks(pokerService.getCurrentTurn, undefined);
      }

      expect(pokerService.getCurrentGameState).toBe('Flop');
      expect(pokerService.getCardSet.length).toBe(3);
    });
  });
});
