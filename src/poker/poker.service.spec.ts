import { PokerService } from './poker.service';
import { Chips } from './classes/chips.class';

describe('PokerService', () => {
  let pokerService: PokerService;

  beforeEach(() => {
    pokerService = new PokerService();
    for (let i = 0; i < pokerService.getMaxPlayerCount; i++) {
      pokerService.addInterestedPlayer(`player${i}`);
    }
  });

  describe('initPokerTable', () => {
    beforeEach(async () => {
      await pokerService.initPokerTable();
    });

    it('has created a deck', () => {
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

    it('has added all interested players to the current game', () => {
      expect(pokerService.getInterestedPlayers.length).toBe(0);
      expect(pokerService.getPlayers.length).toBe(
        pokerService.getMaxPlayerCount,
      );
      expect(pokerService.getActivePlayers).toBe(pokerService.getPlayers);
    });

    it('has given each player a hand', () => {
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

    it('has created a bet heap', () => {
      const expectedBetHeap = new Chips(0, 0, 0, 0, 0);
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

    it('has set the game and match state', () => {
      expect(pokerService.gameIsOngoing).toBe(true);
      expect(pokerService.getCurrentGameState).toBe('Start');
    });
  });

  // describe('', () => {});
});
