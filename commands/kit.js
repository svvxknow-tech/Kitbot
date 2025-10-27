const util = require("../util");
const config = require("../config.json");
const fs = require("fs");
const path = require("path");

module.exports = {
  name: "kit",
  description: "Bot teleports to you and /kills to deliver kit (available to all players)",
  async execute(bot, args, username) {
    if (util.hasCooldown(username))
      return bot.chat(`/w ${username} You're still on cooldown.`);

    if (!global.kitQueue) global.kitQueue = [];
    if (!global.processingKit) global.processingKit = false;

    if (global.kitQueue.includes(username)) {
      return bot.chat(`/w ${username} You already have a kit request in queue.`);
    }

    global.kitQueue.push(username);

    const kitDataPath = path.join(__dirname, "..", "kitdata.json");
    let kitData = { deliveries: {}, totalKits: 0, totalOrders: 0 };
    
    if (fs.existsSync(kitDataPath)) {
      kitData = JSON.parse(fs.readFileSync(kitDataPath, "utf8"));
    }

    if (!kitData.deliveries[username]) {
      kitData.deliveries[username] = { kits: 0, orders: 0 };
    }

    kitData.deliveries[username].orders++;
    kitData.totalOrders++;

    fs.writeFileSync(kitDataPath, JSON.stringify(kitData, null, 2));

    bot.chat(`/w ${username} Kit request added to queue. Position: ${global.kitQueue.length}`);

    if (!global.processingKit) {
      processKitQueue(bot);
    }
  },
};

async function processKitQueue(bot) {
  if (global.processingKit || global.kitQueue.length === 0) return;

  global.processingKit = true;
  const username = global.kitQueue[0];

  try {
    bot.chat(`/tpa ${username}`);

    const tpTimeout = setTimeout(() => {
      bot.chat(`/w ${username} Teleport request timed out.`);
      global.kitQueue.shift();
      global.processingKit = false;
      if (global.kitQueue.length > 0) processKitQueue(bot);
    }, 60000);

    global.currentTpTimeout = tpTimeout;

  } catch (error) {
    console.error("Kit processing error:", error);
    bot.chat(`/w ${username} Error processing kit: ${error.message}`);
    global.kitQueue.shift();
    global.processingKit = false;
    if (global.kitQueue.length > 0) processKitQueue(bot);
  }
}

global.onTpAccepted = async function (bot, username) {
  if (global.currentTpTimeout) {
    clearTimeout(global.currentTpTimeout);
    global.currentTpTimeout = null;
  }

  const kitDataPath = path.join(__dirname, "..", "kitdata.json");
  let kitData = { deliveries: {}, totalKits: 0, totalOrders: 0 };
  
  if (fs.existsSync(kitDataPath)) {
    kitData = JSON.parse(fs.readFileSync(kitDataPath, "utf8"));
  }

  if (!kitData.deliveries[username]) {
    kitData.deliveries[username] = { kits: 0, orders: 0 };
  }

  kitData.deliveries[username].kits++;
  kitData.totalKits++;

  fs.writeFileSync(kitDataPath, JSON.stringify(kitData, null, 2));

  console.log(`[KIT DELIVERY] ${username} - Kit delivered at ${new Date().toISOString()}`);
  bot.chat(`/w ${username} Delivering kit!`);
  
  setTimeout(() => {
    bot.chat("/kill");
  }, 1000);

  global.cooldowns.push(username);
  setTimeout(() => {
    util.removeCooldown(username);
  }, config.cooldown);

  global.kitQueue.shift();
  global.processingKit = false;

  if (global.kitQueue.length > 0) {
    processKitQueue(bot);
  }
};
