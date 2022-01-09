import { PokerService } from './poker.service';
import { BotGateway } from '../bot.gateway';
import { Message, Client, DMChannel } from 'discord.js';

describe('PokerService', () => {
  let pokerService: PokerService;
  let botGateway: BotGateway;
  const client: Client = new Client();
  const channel: DMChannel = new DMChannel(client, null);

  beforeEach(() => {
    pokerService = new PokerService();
    botGateway = new BotGateway(pokerService);
  });

  describe('initPokerTable', () => {
    it('should initiate a poker table', async () => {
      const result = ['test'];
      // jest.spyOn(catsService, 'findAll').mockImplementation(() => result);

      const message: Message = new Message(client, null, channel);
      expect(await pokerService.initPokerTable(message)).toBe(result);
    });
  });
});
