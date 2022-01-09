import { PokerService } from './poker/poker.service';
import { BotGateway } from './bot.gateway';
import { Message, Client, Channel } from 'discord.js';

describe('BotGateway', () => {
  let pokerService: PokerService;
  let botGateway: BotGateway;

  beforeEach(() => {
    pokerService = new PokerService();
    botGateway = new BotGateway(pokerService);
  });

  describe('', () => {
    // it...
  });
});
