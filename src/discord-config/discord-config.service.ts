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
      allowGuilds: [''],
      denyGuilds: [''],
      allowCommands: [
        {
          name: '',
          channels: [''],
          users: [''],
          channelType: ['dm'],
        },
      ],
      webhook: {
        webhookId: '',
        webhookToken: '',
      },
      usePipes: [TransformPipe, ValidationPipe],
    };
  }
}
