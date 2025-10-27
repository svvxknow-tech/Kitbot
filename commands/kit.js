const util = require("../util");
const config = require("../config.json");
const fs = require("fs");
const path = require("path");
const { goals } = require("mineflayer-pathfinder");

module.exports = {
  name: "kit",
  description: "Bot teleports to you and /kills to deliver kit (available to all players). Usage: ?kit <type>",
  async execute(bot, args, username) {
    if (util.hasCooldown(username))
      return bot.chat(`/w ${username} You're still on cooldown.`);

    const kitType = args[0] ? args[0].toLowerCase() : "basic";
    const kitConfig = config.kits.find(k => k.name === kitType);

    if (!kitConfig) {
      return bot.chat(`/w ${username} Invalid kit type. Use ?kitlist to see available kits.`);
    }

    if (!global.kitQueue) global.kitQueue = [];
    if (!global.processingKit) global.processingKit = false;

    if (global.kitQueue.some(req => req.username === username)) {
      return bot.chat(`/w ${username} You already have a kit request in queue.`);
    }

    global.kitQueue.push({ username, kitType: kitConfig.name, shulkerName: kitConfig.shulkerName });

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

    bot.chat(`/w ${username} ${kitConfig.name.toUpperCase()} kit request added to queue. Position: ${global.kitQueue.length}`);

    if (!global.processingKit) {
      processKitQueue(bot);
    }
  },
};

async function cleanupInventory(bot) {
  // Drop all shulker boxes from inventory to prevent wrong kit delivery
  const shulkers = bot.inventory.items().filter(item => item.name.includes("shulker_box"));
  for (const shulker of shulkers) {
    try {
      await bot.tossStack(shulker);
      console.log(`Dropped shulker: ${shulker.displayName || shulker.name}`);
    } catch (error) {
      console.error("Error dropping shulker:", error);
    }
  }
  
  // If still have shulkers, kill bot to clear inventory
  if (bot.inventory.items().some(item => item.name.includes("shulker_box"))) {
    console.log("Force clearing inventory with /kill");
    bot.chat("/kill");
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
}

async function processKitQueue(bot) {
  if (global.processingKit || global.kitQueue.length === 0) return;

  global.processingKit = true;
  const request = global.kitQueue[0];
  const { username, kitType, shulkerName } = request;
  let shulkerWithdrawn = false;

  try {
    // Clean inventory before starting to prevent wrong kit delivery
    await cleanupInventory(bot);
    
    // Navigate to chest location
    bot.chat(`/w ${username} Fetching your ${kitType} kit...`);
    
    const chestPos = config.chestLocation;
    bot.pathfinder.setGoal(new goals.GoalNear(chestPos.x, chestPos.y, chestPos.z, 3));

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Navigation timeout"));
      }, 30000);
      
      bot.once("goal_reached", () => {
        clearTimeout(timeout);
        resolve();
      });
    });

    // Find nearby chests
    const chests = bot.findBlocks({
      matching: (block) => block.name.includes("chest") && !block.name.includes("ender"),
      maxDistance: 10,
      count: 20
    });

    if (chests.length === 0) {
      throw new Error("No chests found at kit location");
    }

    let shulkerFound = false;

    // Check each chest for the named shulkerbox
    for (const chestPos of chests) {
      const chest = await bot.openContainer(bot.blockAt(chestPos));
      
      // Look for shulkerbox with matching name
      for (const item of chest.containerItems()) {
        if (item && item.name.includes("shulker_box")) {
          const displayName = item.nbt?.value?.display?.value?.Name?.value;
          
          if (displayName && displayName.includes(shulkerName)) {
            // Found the correct shulkerbox
            await chest.withdraw(item.type, null, item.count);
            shulkerFound = true;
            shulkerWithdrawn = true;
            break;
          }
        }
      }

      chest.close();
      
      if (shulkerFound) break;
    }

    if (!shulkerFound) {
      throw new Error(`No ${kitType} kit shulkerbox found in chests`);
    }

    // Now teleport to player
    bot.chat(`/tpa ${username}`);

    const tpTimeout = setTimeout(async () => {
      bot.chat(`/w ${username} Teleport request timed out.`);
      
      // Clean up withdrawn shulker before clearing queue
      if (shulkerWithdrawn) {
        await cleanupInventory(bot);
      }
      
      global.kitQueue.shift();
      global.processingKit = false;
      if (global.kitQueue.length > 0) processKitQueue(bot);
    }, 60000);

    global.currentTpTimeout = tpTimeout;

  } catch (error) {
    console.error("Kit processing error:", error);
    bot.chat(`/w ${username} Error processing kit: ${error.message}`);
    
    // Clean up any withdrawn items before clearing queue
    if (shulkerWithdrawn) {
      await cleanupInventory(bot);
    }
    
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

  const request = global.kitQueue[0];
  console.log(`[KIT DELIVERY] ${username} - ${request.kitType.toUpperCase()} kit delivered at ${new Date().toISOString()}`);
  bot.chat(`/w ${username} Delivering ${request.kitType} kit!`);
  
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
