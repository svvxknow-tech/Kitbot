// Imports of the required modules.

const mineflayer = require("mineflayer");
const config = require("./config.json");
const discord = require("@discordjs/collection");
const { pathfinder, Movements } = require("mineflayer-pathfinder");
const collectBlock = require("mineflayer-collectblock");
const gui = require("mineflayer-gui");
const readline = require("readline");
const { mineflayer: mineflayerViewer } = require("prismarine-viewer");

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
  version: false, // Auto-detect server version
  username: "SvvxKnow_BOT",
};

// Creation of the Bot.

var bot = mineflayer.createBot(options);

// Load plugins

bot.loadPlugin(pathfinder);
bot.loadPlugin(collectBlock.plugin);
bot.loadPlugin(gui);

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

// Console input handler
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: ''
});

rl.on('line', (input) => {
  if (input.trim()) {
    bot.chat(input.trim());
    console.log(`[CONSOLE] Sent: ${input.trim()}`);
  }
});

// Bind Events function

function bind(bot) {
  // Set up pathfinder movements once bot spawns
  bot.once("spawn", () => {
    const defaultMove = new Movements(bot);
    bot.pathfinder.setMovements(defaultMove);
    console.log("Bot spawned and pathfinder initialized!");
    
    // Start prismarine-viewer
    mineflayerViewer(bot, { port: 5000, firstPerson: true });
    console.log("Prismarine viewer started on port 5000");
    console.log("View what the bot sees at: https://" + process.env.REPL_SLUG + "." + process.env.REPL_OWNER + ".repl.co");
    
    if (global.firstJoin) {
      setTimeout(() => {
        bot.chat("/login lol123");
        console.log("Sent login command");
        console.log("Bot ready!");
        global.firstJoin = false;
        
        // Start periodic advertising messages
        let messageIndex = 0;
        const messages = [
          "Do ?kitlist to see available kits!",
          "Do ?commands to see all of the bot commands!",
          "This bot is coord logger free! Your privacy is respected.",
          "This bot is made by SvvxKnow!, you can find him on discord: prodsire"
        ];
        
        setInterval(() => {
          bot.chat(messages[messageIndex]);
          messageIndex = (messageIndex + 1) % messages.length;
        }, 20000);
      }, 1000);
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
