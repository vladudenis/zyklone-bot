import { Injectable, Logger } from '@nestjs/common';
import { Once, OnCommand, Client, ClientProvider } from 'discord-nestjs';
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

  @OnCommand({ name: 'sourcecode', channelType: ['text'], isIgnoreBotMessage: true })
  async onCommandCode(message: Message) {
    await message.channel.send('https://github.com/vladudenis/zyklone-bot');
  }

  @OnCommand({ name: 'poker', channelType: ['text'], isIgnoreBotMessage: true })
  async onCommandPoker(message: Message): Promise<void> {
    await message.channel.send(
      `User ${message.author} has proposed a poker match. Use the command "$join" the match.`,
    );
  }

  @OnCommand({ name: 'join', channelType: ['text'], isIgnoreBotMessage: true })
  async onCommandJoin(message: Message): Promise<void> {
    if (this.dealerService.matchIsOngoing) {
      await message.channel.send(
        'A match has already started. Please wait until it has finished to propose another one.',
      );
      return;
    }

    this.dealerService.addInterestedPlayer(message.author.id);

    if (this.dealerService.getInterestedPlayers.length === 4) {
      await message.channel.send('Setting up poker table...');
      this.dealerService.initPokerTable();
    }
  }

  @OnCommand({ name: 'throw', channelType: ['text'], isIgnoreBotMessage: true })
  async onCommandThrow(message: Message): Promise<void> {
    if (this.dealerService.matchIsOngoing) {
      const player = this.dealerService.findPlayer(message.author.id);

      if (player) {
        if (this.dealerService.getCurrentTurn.getId !== message.author.id) {
          await message.channel.send(
            'Wait until your turn has come in order to throw your hand.',
          );
          return;
        }

        this.dealerService.playerThrowsHand(player, message);
        await message.channel.send(
          `Player ${message.author.id} has thrown his hand.`,
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
  async onCommandBet(message: Message, content: string): Promise<void> {
    if (this.dealerService.matchIsOngoing) {
      const player = this.dealerService.findPlayer(message.author.id);

      if (player) {
        if (this.dealerService.getCurrentTurn.getId !== message.author.id) {
          await message.channel.send(
            'Wait until your turn has come in order to bet.',
          );
          return;
        }

        const amount = isNaN(+content) === true ? false : +content;
        if (!amount) {
          await message.channel.send('Please bet a numeric amount.');
          return;
        }

        const response = this.dealerService.playerMakesBet(
          player,
          amount,
          message,
        );
        if (response === true) {
          if (player.getChips.getChipsRawAmount === amount) {
            await message.channel.send(
              `Player ${message.author.id} has gone all in!`,
            );
          } else {
            await message.channel.send(
              `Player ${message.author.id} has made a bet of ${amount}.`,
            );
          }
        } else {
          await message.channel.send(response);
        }
      } else {
        await message.channel.send(
          "You cannot bet in a match that you aren't participating in.",
        );
      }
    } else {
      await message.channel.send(
        'This command only works when a poker match is ongoing.',
      );
    }
  }
}
