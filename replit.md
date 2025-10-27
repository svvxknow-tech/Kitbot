# Kitbot - Minecraft Bot for 8b8t.me

## Overview
This is a Minecraft bot (Kitbot) designed to connect to the 8b8t.me Minecraft server. It's built using Node.js and the Mineflayer library, which allows it to act as a Minecraft client. The bot includes a command handler system with cooldown management and can respond to player commands.

**Current State**: Configured for Replit environment as a cracked account (SvvxKnow_BOT), ready to run after owner username is configured.

## Recent Changes
- **October 27, 2025**: Major feature enhancements
  - Changed server from 0b0t.org to 8b8t.me
  - Changed authentication from Microsoft to offline/cracked mode (username: SvvxKnow_BOT)
  - Set base location to bot's actual respawn point (X: -25208483.5, Y: 64, Z: 25172072.5)
  - Added multi-kit system with named shulkerbox support (grief, pvp, basic kits)
  - Added inventory cleanup system to prevent wrong kit delivery on failures
  - Added kitlist command to display all available kits
  - Added periodic advertising messages every 20 seconds
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
  - commandHandler.js: Dynamically loads commands from the commands folder
  - eventHandler.js: Dynamically loads events from the events folder
- **commands/**: Custom bot commands (e.g., kit.js for teleport requests)
- **events/**: Event listeners for various bot actions (login, chat, spawn, etc.)
- **util.js**: Utility functions for cooldown management

### Dependencies
- **mineflayer**: Core library for creating Minecraft bots
- **@discordjs/collection**: Collection data structure for command management
- **mineflayer-pathfinder**: Pathfinding plugin for navigation
- **mineflayer-collectblock**: Plugin for chest/inventory management
- **openai**: OpenAI API client for chatgpt command
- **axios**: HTTP client for pastebin integration

### Configuration Requirements
The bot uses offline/cracked authentication with the username "SvvxKnow_BOT". The config.json file should contain:
- `owner`: Minecraft username of the bot owner (required - bot will send TPA on first join)
- `prefix`: Command prefix (default: "?")
- `cooldown`: Cooldown duration in milliseconds (default: 10000)
- `whitelist`: Array of usernames allowed to use protected commands
- `chestLocation`: Coordinates of the kit chest (x, y, z)
- `baseLocation`: Coordinates of the bot's base/spawn location (x, y, z)
- `kitName`: Name/keyword to identify kit items in inventory
- `kits`: Array of kit configurations, each containing:
  - `name`: Kit type identifier (e.g., "grief", "pvp", "basic")
  - `shulkerName`: The display name of the shulkerbox in chests (e.g., "SvvxKnow - GRIEF")
  - `description`: Description of the kit for the kitlist command

### Bot Features
- **Multi-Kit System**: Supports multiple kit types with named shulkerboxes
  - Walks to chests and searches for specific shulkerboxes by name
  - Supports different kit types: grief, pvp, basic (configurable)
  - Inventory cleanup system prevents wrong kit delivery on failures
  - Queue system handles multiple requests (one per player)
  - Tracks duplicate kits delivered when someone else accepts teleport
  - Logs all deliveries with timestamps
  - Cooldown system prevents spam
- **Periodic Advertising**: Sends promotional messages every 20 seconds
  - "Do ?kitlist to see available kits!"
  - "Do ?commands to see all of the bot commands!"
- **Statistics Tracking**: Tracks total kits, orders, dupes per user and globally
- **AI Integration**: ChatGPT command with automatic pastebin upload
- **Movement Commands**: Come, follow, stop, and return functionality
- **Whitelist System**: All commands except kit and kitlist require whitelist authorization
- Command system with custom prefix
- Auto-restart on errors, kicks, or disconnects
- Event-driven architecture for handling Minecraft events

### Commands
- **?kit <type>**: Request a kit delivery (available to all players). Types: grief, pvp, basic
- **?kitlist**: Display all available kits with descriptions (available to all players)
- **?count [dupes/kits/orders/total] [username]**: View delivery statistics (whitelist only)
- **?chatgpt <question>**: Ask OpenAI and get pastebin response (whitelist only)
- **?come**: Bot sends TPA to player (whitelist only)
- **?follow**: Bot follows the player (whitelist only)
- **?stop**: Stop following (whitelist only)
- **?return**: Bot /kills back to base (whitelist only)

## User Preferences
None documented yet.

## Notes
- The bot connects to 8b8t.me using Minecraft version 1.21.4
- Uses offline/cracked authentication with username "SvvxKnow_BOT"
- On first join, automatically sends TPA request to the owner
- Coordinate logging: Bot logs TPA requests and coordinates to Discord webhook (if DISCORD_WEBHOOK_URL is set)
- ChatGPT integration requires OPENAI_API_KEY in environment secrets
- This is a backend console application with no web frontend
