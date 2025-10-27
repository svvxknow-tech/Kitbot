const config = require("../config.json");
const { goals } = require("mineflayer-pathfinder");

module.exports = {
  name: "setbed",
  description: "Find nearest bed and set as respawn point (owner only)",
  async execute(bot, args, username) {
    if (username !== config.owner) {
      return bot.chat(`/w ${username} Only the owner can use this command.`);
    }

    const bed = bot.findBlock({
      matching: (block) => block.name.includes("bed"),
      maxDistance: 64,
    });

    if (!bed) {
      return bot.chat(`/w ${username} No bed found nearby.`);
    }

    bot.chat(`/w ${username} Found bed at X: ${bed.position.x}, Y: ${bed.position.y}, Z: ${bed.position.z}`);
    
    try {
      bot.pathfinder.setGoal(new goals.GoalNear(bed.position.x, bed.position.y, bed.position.z, 2));

      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Pathfinding timeout"));
        }, 30000);
        
        bot.once("goal_reached", () => {
          clearTimeout(timeout);
          resolve();
        });

        bot.pathfinder.on("path_stop", () => {
          clearTimeout(timeout);
          resolve();
        });
      });

      await bot.sleep(bed);
      bot.chat(`/w ${username} Respawn point set!`);

    } catch (error) {
      bot.chat(`/w ${username} Error: ${error.message}`);
      console.error("Setbed error:", error);
    }
  },
};
