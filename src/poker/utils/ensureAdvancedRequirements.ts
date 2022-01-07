import { Message } from 'discord.js';
import { Player } from '../classes/player.class';

export default async function ensureAdvancedRequirements(
  message: Message,
  content: string,
): Promise<-1 | -2 | -3 | -4 | [Player, number]> {
  if (!this.dealerService.gameIsOngoing) {
    return -1;
  }

  const player = this.dealerService.findPlayer(message.author.tag);
  if (!player) {
    return -2;
  }

  if (this.dealerService.getCurrentTurn.getTag !== message.author.tag) {
    return -3;
  }

  const amount = isNaN(+content) === true ? NaN : +content;
  if (!amount) {
    return -4;
  }

  return [player, amount];
}
