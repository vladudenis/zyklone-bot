import { Injectable } from '@nestjs/common';
import {
  DiscordModuleOption,
  DiscordOptionsFactory,
  TransformPipe,
  ValidationPipe,
} from 'discord-nestjs';

@Injectable()
export class DiscordConfigService implements DiscordOptionsFactory {
  createDiscordOptions(): DiscordModuleOption {
    return {
      token: process.env.TOKEN,
      commandPrefix: '$',
      usePipes: [TransformPipe, ValidationPipe],
    };
  }
}
