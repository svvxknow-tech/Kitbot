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
    
    bot.chat(`/w ${username} Fetching your ${kitType} kit...`);
    
    // First, try to find chests near current position (including trapped chests)
    let chests = bot.findBlocks({
      matching: (block) => block.name.includes("chest"),
      maxDistance: 32,
      count: 30
    });

    // If no chests found nearby, navigate to configured chest location
    if (chests.length === 0 && config.chestLocation) {
      bot.chat(`/w ${username} No nearby chests, navigating to kit storage...`);
      const chestPos = config.chestLocation;
      bot.pathfinder.setGoal(new goals.GoalNear(chestPos.x, chestPos.y, chestPos.z, 3));

      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Navigation timeout - cannot reach kit storage"));
        }, 30000);
        
        bot.once("goal_reached", () => {
          clearTimeout(timeout);
          resolve();
        });
      });

      // Find chests again after navigating (including trapped chests)
      chests = bot.findBlocks({
        matching: (block) => block.name.includes("chest"),
        maxDistance: 20,
        count: 20
      });
    }

    if (chests.length === 0) {
      throw new Error("No chests found - cannot fetch kit");
    }

    let shulkerFound = false;

    // Check each chest for the named shulkerbox
    for (let i = 0; i < chests.length; i++) {
      const chestPos = chests[i];
      
      try {
        const chestBlock = bot.blockAt(chestPos);
        if (!chestBlock) {
          console.log(`[KIT] No block at ${chestPos}, skipping`);
          continue;
        }
        
        const distance = bot.entity.position.distanceTo(chestBlock.position);
        console.log(`[KIT] Checking chest at ${chestPos}, distance: ${distance.toFixed(2)}`);
        
        // Navigate to the chest if too far
        if (distance > 4) {
          bot.pathfinder.setGoal(new goals.GoalNear(chestPos.x, chestPos.y, chestPos.z, 1));
          await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
              reject(new Error("Navigation timeout to chest"));
            }, 10000);
            
            bot.once("goal_reached", () => {
              clearTimeout(timeout);
              resolve();
            });
          });
          
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        // Look at the chest before opening (important!)
        await bot.lookAt(chestBlock.position);
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Try to open the chest (simple approach from mineflayer example)
        let chest;
        try {
          chest = await bot.openContainer(chestBlock);
        } catch (openError) {
          console.log(`[KIT] Could not open chest at ${chestPos}: ${openError.message}`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue;
        }
        
        // Look for any shulkerbox with matching kit name (case-insensitive)
        const items = chest.containerItems();
        console.log(`[KIT] Chest has ${items.length} items`);
        
        for (const item of items) {
          if (item && item.name.includes("shulker_box")) {
            // Try different NBT paths to get the display name
            let displayName = "unnamed";
            
            // Debug: log the NBT structure
            if (item.nbt) {
              console.log(`[KIT] NBT structure:`, JSON.stringify(item.nbt, null, 2));
            }
            
            // Try different paths for the display name
            if (item.nbt?.value?.display?.value?.Name?.value) {
              displayName = item.nbt.value.display.value.Name.value;
            } else if (item.nbt?.value?.display?.Name?.value) {
              displayName = item.nbt.value.display.Name.value;
            } else if (item.displayName) {
              displayName = item.displayName;
            } else if (item.customName) {
              displayName = item.customName;
            }
            
            console.log(`[KIT] Found shulker: "${displayName}"`);
            
            // Match any shulker box name containing the kit type (case-insensitive)
            if (displayName.toLowerCase().includes(kitType.toLowerCase())) {
              // Found a matching shulkerbox - take it
              await chest.withdraw(item.type, null, item.count);
              shulkerFound = true;
              shulkerWithdrawn = true;
              console.log(`[KIT] ✓ Successfully withdrew ${kitType} kit shulker: "${displayName}"`);
              break;
            }
          }
        }

        chest.close();
        
        if (shulkerFound) break;
        
        // Add delay between chest checks to avoid server rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (err) {
        // Skip this chest if we can't open it and try the next one
        console.log(`[KIT] Error with chest at ${chestPos}: ${err.message}`);
        // Add delay even on error to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
        continue;
      }
    }

    if (!shulkerFound) {
      throw new Error(`No ${kitType} kit shulkerbox found in any nearby chests`);
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
