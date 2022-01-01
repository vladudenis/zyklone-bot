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
    // this.dealerService.addInterestedPlayer(message.author.tag);
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

    if (this.dealerService.getInterestedPlayers.length === 1) {
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
    if (this.dealerService.gameIsOngoing) {
      const player = this.dealerService.findPlayer(message.author.tag);

      if (player) {
        if (this.dealerService.getCurrentTurn.getTag !== message.author.tag) {
          await message.channel.send(
            'Wait until your turn has come in order to fold your hand.',
          );
          return;
        }

        await this.dealerService.playerFoldsHand(player, message);
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

  @OnCommand({
    name: 'pass',
    channelType: ['text'],
    allowChannels: ['360812727964532737'],
    isIgnoreBotMessage: true,
  })
  async onCommandPass(message: Message): Promise<void> {
    if (this.dealerService.gameIsOngoing) {
      const player = this.dealerService.findPlayer(message.author.tag);

      if (player) {
        if (this.dealerService.getCurrentTurn.getTag !== message.author.tag) {
          await message.channel.send(
            'Wait until your turn has come in order to bet.',
          );
          return;
        }

        await this.dealerService.playerPasses(player, message);
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
    if (this.dealerService.gameIsOngoing) {
      const player = this.dealerService.findPlayer(context.author.tag);

      if (player) {
        if (this.dealerService.getCurrentTurn.getTag !== context.author.tag) {
          await context.channel.send(
            'Wait until your turn has come in order to bet.',
          );
          return;
        }

        const amount = isNaN(+content) === true ? NaN : +content;
        if (!amount) {
          await context.channel.send('Please bet a numeric amount.');
          return;
        }

        await this.dealerService.playerRaises(player, amount, context);
      } else {
        await context.channel.send(
          "You cannot bet in a match that you aren't participating in.",
        );
        return;
      }
    } else {
      await context.channel.send(
        'This command only works when a poker match is ongoing.',
      );
      return;
    }
  }

  @OnCommand({ name: 'wealth', channelType: ['dm'], isIgnoreBotMessage: true })
  async onCommandWealth(message: Message): Promise<void> {
    if (this.dealerService.gameIsOngoing) {
      const player = this.dealerService.findPlayer(message.author.tag);

      if (player) {
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
      } else {
        await message.channel.send(
          "You cannot possess wealth in a match that you aren't participating in.",
        );
        return;
      }
    } else {
      await message.channel.send(
        'This command only works when a poker match is ongoing.',
      );
      return;
    }
  }
}
