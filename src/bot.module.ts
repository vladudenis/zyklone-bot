import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BotGateway } from './bot.gateway';
import { DiscordModule } from 'discord-nestjs';
import { DiscordConfigService } from './discord-config/discord-config.service';
import { PokerModule } from './poker/poker.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    DiscordModule.forRootAsync({
      useClass: DiscordConfigService,
    }),
    PokerModule,
  ],
  providers: [BotGateway, DiscordConfigService],
})
export class BotModule {}
