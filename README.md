# Kitbot - Minecraft Bot for 8b8t.me

## Overview
This is a Minecraft bot (Kitbot) designed to connect to the 8b8t.me Minecraft server. It's built using Node.js and the Mineflayer library, which allows it to act as a Minecraft client. The bot includes a command handler system with cooldown management and can respond to player commands.

**Current State**: Configured for Replit environment as a cracked account (SvvxKnow_BOT), ready to run after owner username is configured.

## Recent Changes
- **October 27, 2025**: Major feature enhancements
  - Changed server from 0b0t.org to 8b8t.me
  - Changed authentication from Microsoft to offline/cracked mode (username: SvvxKnow_BOT)
  - Added first-join TPA request to owner
  - Added advanced kit command with chest withdrawal, pathfinding, and queue system
  - Added count command for tracking kit delivery statistics
  - Added chatgpt command with OpenAI and pastebin integration
  - Added come, follow, stop, and return commands with whitelist protection
  - Installed mineflayer-pathfinder and mineflayer-collectblock plugins
  - Created kit tracking database system (kitdata.json)
  - Enhanced configuration with chest/base locations and whitelist
  - Initial Replit setup completed

## Project Architecture

### Core Structure
- **index.js**: Main entry point, creates the Mineflayer bot and manages connection/restart logic
- **config.json**: Configuration file for bot settings (owner, email, prefix, cooldown)
- **handlers/**: Contains command and event handler loaders
  prefix   = Your desired prefix
  cooldown = The Cooldown amount in ms
```

Start the bot

```bash
npm run start
```

**Make Sure that the Bot spawns on top of a pressure plate!**


## Your own command

To create a new command, create a new file inside the commands folder.

Use this Template to code your own command.

```javascript
module.exports = {
  name: "NAME_OF_YOUR_COMMAND",
  execute(bot, args, username) {
      /* YOUR CODE BENEATH */
      /* args = An array of arguments */
      /* username = The Username of the Player that executed the command */
  },
};
```


## Support

None ATM


## License

[MIT](https://choosealicense.com/licenses/mit/)

