# Kitbot - Minecraft Bot for 0b0t.org

## Overview
This is a Minecraft bot (Kitbot) designed to connect to the 0b0t.org Minecraft server. It's built using Node.js and the Mineflayer library, which allows it to act as a Minecraft client. The bot includes a command handler system with cooldown management and can respond to player commands.

**Current State**: Configured for Replit environment, ready to run after user provides Microsoft account credentials.

## Recent Changes
- **October 27, 2025**: Initial Replit setup
  - Installed Node.js dependencies
  - Created .gitignore for Node.js project
  - Created replit.md for project documentation
  - Configured workflow to run the bot

## Project Architecture

### Core Structure
- **index.js**: Main entry point, creates the Mineflayer bot and manages connection/restart logic
- **config.json**: Configuration file for bot settings (owner, email, prefix, cooldown)
- **handlers/**: Contains command and event handler loaders
  - commandHandler.js: Dynamically loads commands from the commands folder
  - eventHandler.js: Dynamically loads events from the events folder
- **commands/**: Custom bot commands (e.g., kit.js for teleport requests)
- **events/**: Event listeners for various bot actions (login, chat, spawn, etc.)
- **util.js**: Utility functions for cooldown management

### Dependencies
- **mineflayer**: Core library for creating Minecraft bots
- **@discordjs/collection**: Collection data structure for command management

### Configuration Requirements
The bot requires a Microsoft account email in config.json to authenticate with Minecraft servers. The config.json file should contain:
- `owner`: Minecraft username of the bot owner
- `email`: Microsoft account email (must own Minecraft)
- `prefix`: Command prefix (default: "!")
- `cooldown`: Cooldown duration in milliseconds (default: 10000)

### Bot Features
- Command system with custom prefix
- Cooldown management to prevent spam
- Auto-restart on errors, kicks, or disconnects
- Owner-based permissions
- Event-driven architecture for handling Minecraft events

## User Preferences
None documented yet.

## Notes
- The bot connects to 0b0t.org using Minecraft version 1.12.2
- Microsoft authentication is required
- The bot is designed to spawn on top of a pressure plate on the server
- This is a backend console application with no web frontend
