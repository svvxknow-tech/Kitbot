// Imports of the required modules.

const mineflayer = require("mineflayer");
const config = require("./config.json");
const discord = require("@discordjs/collection");
const { pathfinder, Movements } = require("mineflayer-pathfinder");
const collectBlock = require("mineflayer-collectblock");

// Config Validation

if (!config.owner)
  console.log("No Owner name provided, continuing without it!");

if (!config.email) {
  console.log("No Email provided, exiting..");
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
  host: "0b0t.org",
  auth: "microsoft",
  version: "1.12.2",
  username: config.email,
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
  }, 5000);
}
