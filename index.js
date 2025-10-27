// Imports of the required modules.

const mineflayer = require("mineflayer");
const config = require("./config.json");
const discord = require("@discordjs/collection");
const { pathfinder, Movements } = require("mineflayer-pathfinder");
const collectBlock = require("mineflayer-collectblock");

// Config Validation

if (!config.owner) {
  console.log("ERROR: Owner username is required in config.json");
  console.log("Please set the 'owner' field to your Minecraft username.");
  console.log("The bot will send a TPA request to this player on first join.");
  process.exit(1);
}

if (!config.prefix) {
  console.log("No Prefix provided, continuing with the default..");
  config.prefix = "!";
}

if (!config.cooldown) {
  console.log("No Cooldown amount provided, continuing with the default..");
  config.cooldown = 10000;
}

// Configuration for the Bot.

const options = {
  host: "8b8t.me",
  auth: "offline",
  version: "1.12.2",
  username: "SvvxKnow_BOT",
};

// Creation of the Bot.

var bot = mineflayer.createBot(options);

// Load plugins

bot.loadPlugin(pathfinder);
bot.loadPlugin(collectBlock.plugin);

// Initialization of required variables.

global.commands = new discord.Collection();
global.spam = false;
global.cooldowns = [];
global.kitQueue = [];
global.processingKit = false;
global.followingPlayer = null;
global.currentTpTimeout = null;
global.firstJoin = true;

// Binding for the Events and Commands.

bind(bot);

require("./handlers/commandHandler")(bot);

// Bind Events function

function bind(bot) {
  // Set up pathfinder movements once bot spawns
  bot.once("spawn", () => {
    const defaultMove = new Movements(bot);
    bot.pathfinder.setMovements(defaultMove);
    console.log("Bot spawned and pathfinder initialized!");
    
    if (global.firstJoin && config.owner) {
      setTimeout(() => {
        bot.chat("/login lol123");
        console.log("Sent login command");
      }, 1000);
      
      setTimeout(() => {
        bot.chat(`/tpa SvvxKnow`);
        console.log(`Sent TPA request to owner: ${config.owner}`);
        global.firstJoin = false;
      }, 3000);
    }
  });

  // Register Events that require the Bot to restart.

  bot.on("error", (error) => restart(`Error: ${error.message}`));
  bot.on("kicked", (reason) => restart(`Kicked: ${reason}`));
  bot.on("end", (reason) => restart(`Exited: ${reason}`));

  // Register the Events.

  require("./handlers/eventHandler")(bot);
}

// Restart Function

function restart(message) {
  console.log(message);

  setTimeout(() => {
    bot = mineflayer.createBot(options);
    bot.loadPlugin(pathfinder);
    bot.loadPlugin(collectBlock.plugin);
    bind(bot);
  }, 60000);
}
