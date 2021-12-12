import { Injectable, Logger } from '@nestjs/common';
import { Once, DiscordClientProvider, On } from 'discord-nestjs';
import { Message } from 'discord.js';

@Injectable()
export class BotGateway {
  private readonly logger = new Logger(BotGateway.name);

  constructor(private readonly discordProvider: DiscordClientProvider) {}

  @Once({ event: 'ready' })
  onReady(): void {
    this.logger.log(
      `Logged in as "${this.discordProvider.getClient().user.tag}"!`,
    );
  }

  @On({ event: 'message' })
  async onMessage(message: Message): Promise<void> {
    if (!message.author.bot) {
      await message.reply("I'm watching you");
    }
  }
}
