import { Injectable, Logger } from '@nestjs/common';
import {
  Once,
  OnCommand,
  Client,
  ClientProvider,
  Context,
  Content,
} from 'discord-nestjs';
import { Message } from 'discord.js';
import { PokerService } from './poker/poker.service';
import ensureBasicRequirements from './poker/utils/ensureBasicRequirements';
import ensureAdvancedRequirements from './poker/utils/ensureAdvancedRequirements';

@Injectable()
export class BotGateway {
  constructor(private readonly dealerService: PokerService) {}

  private readonly logger = new Logger(BotGateway.name);

  @Client()
  discordProvider: ClientProvider;

  @Once({ event: 'ready' })
  onReady(): void {
    this.logger.log(
      `Logged in as "${this.discordProvider.getClient().user.tag}"!`,
    );
  }

  @OnCommand({
    name: 'sourcecode',
    channelType: ['text'],
    allowChannels: ['360812727964532737'],
    isIgnoreBotMessage: true,
  })
  async onCommandCode(message: Message) {
    await message.channel.send('https://github.com/vladudenis/zyklone-bot');
  }

  @OnCommand({
    name: 'poker',
    channelType: ['text'],
    allowChannels: ['360812727964532737'],
    isIgnoreBotMessage: true,
  })
  async onCommandPoker(message: Message): Promise<void> {
    await message.channel.send(
      `User ${message.author} has proposed a poker match. Use the command "join" to join the match.
      The match will automatically start once the cap of 4 players has been reached.`,
    );
    this.dealerService.addInterestedPlayer(message.author.tag);
  }

  @OnCommand({
    name: 'join',
    channelType: ['text'],
    allowChannels: ['360812727964532737'],
    isIgnoreBotMessage: true,
  })
  async onCommandJoin(message: Message): Promise<void> {
    if (this.dealerService.gameIsOngoing) {
      await message.channel.send(
        'A match has already started. Please wait until it has finished to propose another one.',
      );
      return;
    }

    this.dealerService.addInterestedPlayer(message.author.tag);

    if (this.dealerService.getInterestedPlayers.length === 4) {
      await message.channel.send('Setting up poker table...');
      await this.dealerService.initPokerTable(message);
    }
  }

  @OnCommand({
    name: 'fold',
    channelType: ['text'],
    allowChannels: ['360812727964532737'],
    isIgnoreBotMessage: true,
  })
  async onCommandFold(message: Message): Promise<void> {
    const player = await ensureBasicRequirements(message);

    switch (player) {
      case -1:
        await message.channel.send(
          'This command only works when a poker match is ongoing.',
        );
        return;
      case -2:
        await message.channel.send(
          "You cannot fold a match that you aren't participating in.",
        );
        return;
      case -3:
        await message.channel.send(
          'Wait until your turn has come in order to fold your hand.',
        );
        return;
      default:
        await this.dealerService.playerFoldsHand(player, message);
        break;
    }
  }

  @OnCommand({
    name: 'check',
    channelType: ['text'],
    allowChannels: ['360812727964532737'],
    isIgnoreBotMessage: true,
  })
  async onCommandCheck(message: Message): Promise<void> {
    const player = await ensureBasicRequirements(message);

    switch (player) {
      case -1:
        await message.channel.send(
          'This command only works when a poker match is ongoing.',
        );
        return;
      case -2:
        await message.channel.send(
          "You cannot check in a match that you aren't participating in.",
        );
        return;
      case -3:
        await message.channel.send(
          'Wait until your turn has come in order to check.',
        );
        return;
      default:
        await this.dealerService.playerChecks(player, message);
        break;
    }
  }

  @OnCommand({
    name: 'raise',
    channelType: ['text'],
    allowChannels: ['360812727964532737'],
    isIgnoreBotMessage: true,
  })
  async onCommandRaise(
    @Content() content: string,
    @Context() [context]: [Message],
  ): Promise<void> {
    const tuple = await ensureAdvancedRequirements(context, content);

    switch (tuple) {
      case -1:
        await context.channel.send(
          'This command only works when a poker match is ongoing.',
        );
        return;
      case -2:
        await context.channel.send(
          "You cannot bet in a match that you aren't participating in.",
        );
        return;
      case -3:
        await context.channel.send(
          'Wait until your turn has come in order to bet.',
        );
        return;
      case -4:
        await context.channel.send('Please bet a numeric amount.');
        return;
      default:
        await this.dealerService.playerRaises(tuple[0], tuple[1], context);
        break;
    }
  }

  @OnCommand({
    name: 'match',
    channelType: ['text'],
    allowChannels: ['360812727964532737'],
    isIgnoreBotMessage: true,
  })
  async onCommandMatch(message: Message): Promise<void> {
    const player = await ensureBasicRequirements(message);

    switch (player) {
      case -1:
        await message.channel.send(
          'This command only works when a poker match is ongoing.',
        );
        return;
      case -2:
        await message.channel.send(
          "You cannot match in a match that you aren't participating in.",
        );
        return;
      case -3:
        await message.channel.send(
          'Wait until your turn has come in order to match.',
        );
        return;
      default:
        // to be added
        break;
    }
  }

  @OnCommand({ name: 'wealth', channelType: ['dm'], isIgnoreBotMessage: true })
  async onCommandWealth(message: Message): Promise<void> {
    if (!this.dealerService.gameIsOngoing) {
      await message.channel.send(
        'This command only works when a poker match is ongoing.',
      );
      return;
    }

    const player = this.dealerService.findPlayer(message.author.tag);
    if (!player) {
      await message.channel.send(
        "You cannot possess wealth in a match that you aren't participating in.",
      );
      return;
    }

    const { hundreds, fifties, twenties, tens, fives } =
      player.getChips.getChipWealth;
    await message.channel.send(`
          ----
          Hundreds: ${hundreds}
          Fifties: ${fifties}
          Twenties: ${twenties}
          Tens: ${tens}
          Fives: ${fives}
          Total: ${player.getChips.getChipsRawAmount}
         `);
  }
}
