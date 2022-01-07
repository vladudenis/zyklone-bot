import { Message } from 'discord.js';

export default async function ensureBasicRequirements(message: Message) {
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

  return player;
}
