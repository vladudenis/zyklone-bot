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
    isIgnoreBotMessage: true,
  })
  async onCommandCode(message: Message) {
    await message.channel.send('https://github.com/vladudenis/zyklone-bot');
  }

  @OnCommand({
    name: 'poker',
    channelType: ['text'],
    isIgnoreBotMessage: true,
  })
  async onCommandPoker(message: Message): Promise<void> {
    await message.channel.send(
      `User ${message.author} has proposed a poker match. Use the command "$join" to join the match.
      The match will automatically start once the cap of 4 players has been reached.`,
    );
    // this.dealerService.addInterestedPlayer(message.author.tag);
  }

  @OnCommand({ name: 'join', channelType: ['text'], isIgnoreBotMessage: true })
  async onCommandJoin(message: Message): Promise<void> {
    if (this.dealerService.matchIsOngoing) {
      await message.channel.send(
        'A match has already started. Please wait until it has finished to propose another one.',
      );
      return;
    }

    this.dealerService.addInterestedPlayer(message.author.tag);

    if (this.dealerService.getInterestedPlayers.length === 1) {
      await message.channel.send('Setting up poker table...');
      await this.dealerService.initPokerTable(message);
    }
  }

  @OnCommand({ name: 'throw', channelType: ['text'], isIgnoreBotMessage: true })
  async onCommandThrow(message: Message): Promise<void> {
    if (this.dealerService.matchIsOngoing) {
      const player = this.dealerService.findPlayer(message.author.tag);

      if (player) {
        if (this.dealerService.getCurrentTurn.getTag !== message.author.tag) {
          await message.channel.send(
            'Wait until your turn has come in order to throw your hand.',
          );
          return;
        }

        await this.dealerService.playerThrowsHand(player, message);
        await message.channel.send(
          `Player ${message.author.tag} has thrown his hand.`,
        );
      } else {
        await message.channel.send(
          "You cannot forfeit a match that you aren't participating in.",
        );
      }
    } else {
      await message.channel.send(
        'This command only works when a poker match is ongoing.',
      );
    }
  }

  @OnCommand({ name: 'bet', channelType: ['text'], isIgnoreBotMessage: true })
  async onCommandBet(
    @Content() content: string,
    @Context() [context]: [Message],
  ): Promise<void> {
    if (this.dealerService.matchIsOngoing) {
      const player = this.dealerService.findPlayer(context.author.tag);

      if (player) {
        if (this.dealerService.getCurrentTurn.getTag !== context.author.tag) {
          await context.channel.send(
            'Wait until your turn has come in order to bet.',
          );
          return;
        }

        const amount = isNaN(+content) === true ? false : +content;
        if (!amount) {
          await context.channel.send('Please bet a numeric amount.');
          return;
        }

        const response = this.dealerService.playerMakesBet(
          player,
          amount,
          context,
        );
        if (typeof response !== 'string') {
          if (player.getChips.getChipsRawAmount === amount) {
            await context.channel.send(
              `Player ${context.author.tag} has gone all in!`,
            );
          } else {
            await context.channel.send(
              `Player ${context.author.tag} has made a bet of ${amount}.`,
            );
          }
        } else {
          await context.channel.send(response);
        }
      } else {
        await context.channel.send(
          "You cannot bet in a match that you aren't participating in.",
        );
      }
    } else {
      await context.channel.send(
        'This command only works when a poker match is ongoing.',
      );
    }
  }
}
