# Zyklone Bot

Hello, I'm Zyklone, a poker dealer Discord bot.

## What I Can Do

- Set up a poker table for a maximum of 5 players inside a channel
- Shuffle cards and distribute them to players
- Determine the winner of each round, as well as the winner of the match
- Send informative messages (such as your hand, whose turn it is, etc.) in the channel or via DM
- (more features coming soon)

## Setup

Install all dependencies:
    
    npm install

Create env file with a Discord API Token:

    touch .env

    // inside .env file:
    TOKEN='add your token here'

Run your script of choice:

    // dev
    npm run start:dev

    // production
    npm run start:prod

    // debug
    npm run start:debug
