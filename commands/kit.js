const util = require("../util");
const config = require("../config.json");
const { goals } = require("mineflayer-pathfinder");
const fs = require("fs");
const path = require("path");

module.exports = {
  name: "kit",
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
    let kitData = { deliveries: {}, totalKits: 0, totalOrders: 0, totalDupes: 0 };
    
    if (fs.existsSync(kitDataPath)) {
      kitData = JSON.parse(fs.readFileSync(kitDataPath, "utf8"));
    }

    if (!kitData.deliveries[username]) {
      kitData.deliveries[username] = { kits: 0, orders: 0, dupes: 0 };
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
    await withdrawKitFromChest(bot);

    const hasKit = checkInventoryForKit(bot);
    
    if (!hasKit) {
      bot.chat(`/w ${username} No kits available in chest. Please try again later.`);
      global.kitQueue.shift();
      global.processingKit = false;
      if (global.kitQueue.length > 0) processKitQueue(bot);
      return;
    }

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

async function withdrawKitFromChest(bot) {
  const chestPos = config.chestLocation;
  
  try {
    bot.pathfinder.setGoal(new goals.GoalNear(chestPos.x, chestPos.y, chestPos.z, 1));

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("Pathfinding timeout")), 30000);
      
      bot.once("goal_reached", () => {
        clearTimeout(timeout);
        resolve();
      });

      bot.pathfinder.on("path_stop", () => {
        clearTimeout(timeout);
        resolve();
      });
    });

    const chest = bot.findBlock({
      matching: (block) => block.name.includes("chest"),
      maxDistance: 5,
    });

    if (!chest) {
      throw new Error("Chest not found");
    }

    const chestWindow = await bot.openChest(chest);

    const kitItem = chestWindow.containerItems().find((item) => 
      item.name.toLowerCase().includes(config.kitName.toLowerCase())
    );

    if (kitItem) {
      await chestWindow.withdraw(kitItem.type, null, kitItem.count);
    }

    chestWindow.close();
  } catch (error) {
    console.error("Chest withdrawal error:", error.message);
  }
}

function checkInventoryForKit(bot) {
  const kitItem = bot.inventory.items().find((item) =>
    item.name.toLowerCase().includes(config.kitName.toLowerCase())
  );
  return !!kitItem;
}

global.onTpAccepted = function (bot, username) {
  if (global.currentTpTimeout) {
    clearTimeout(global.currentTpTimeout);
    global.currentTpTimeout = null;
  }

  const kitDataPath = path.join(__dirname, "..", "kitdata.json");
  let kitData = { deliveries: {}, totalKits: 0, totalOrders: 0, totalDupes: 0 };
  
  if (fs.existsSync(kitDataPath)) {
    kitData = JSON.parse(fs.readFileSync(kitDataPath, "utf8"));
  }

  const kitsInInventory = bot.inventory.items().filter((item) =>
    item.name.toLowerCase().includes(config.kitName.toLowerCase())
  );

  const kitCount = kitsInInventory.reduce((sum, item) => sum + item.count, 0);

  kitsInInventory.forEach((item) => {
    bot.tossStack(item);
  });

  if (!kitData.deliveries[username]) {
    kitData.deliveries[username] = { kits: 0, orders: 0, dupes: 0 };
  }

  kitData.deliveries[username].kits += kitCount;
  kitData.totalKits += kitCount;

  if (kitCount > 1) {
    kitData.deliveries[username].dupes += (kitCount - 1);
    kitData.totalDupes += (kitCount - 1);
  }

  fs.writeFileSync(kitDataPath, JSON.stringify(kitData, null, 2));

  console.log(`[KIT DELIVERY] ${username} - ${kitCount} kit(s) delivered at ${new Date().toISOString()}`);
  bot.chat(`/w ${username} Delivered ${kitCount} kit(s)!`);

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
