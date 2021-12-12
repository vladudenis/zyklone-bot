import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BotGateway } from './bot.gateway';
import { DiscordModule } from 'discord-nestjs';
import { DiscordConfigService } from './discord-config/discord-config.service';
import { DealerService } from './poker/dealer.service';

@Module({
  imports: [
    ConfigModule.forRoot(),
    DiscordModule.forRootAsync({
      useClass: DiscordConfigService,
    }),
  ],
  providers: [BotGateway, DiscordConfigService],
})
export class BotModule {}
