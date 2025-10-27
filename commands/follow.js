const config = require("../config.json");
const util = require("../util");
const { goals } = require("mineflayer-pathfinder");

module.exports = {
  name: "follow",
  description: "Bot follows you (whitelist only)",
  execute(bot, args, username) {
    if (!util.isWhitelisted(username)) {
      return bot.chat(`/w ${username} You are not authorized to use this command.`);
    }

    const player = bot.players[username];
    
    if (!player || !player.entity) {
      return bot.chat(`/w ${username} I can't see you!`);
    }

    global.followingPlayer = username;
    bot.chat(`/w ${username} Now following you.`);

    const followInterval = setInterval(() => {
      if (global.followingPlayer !== username) {
        clearInterval(followInterval);
        return;
      }

      const target = bot.players[username];
      if (!target || !target.entity) {
        bot.chat(`/w ${username} Lost sight of you.`);
        global.followingPlayer = null;
        clearInterval(followInterval);
        return;
      }

      const pos = target.entity.position;
      bot.pathfinder.setGoal(new goals.GoalNear(pos.x, pos.y, pos.z, 2), true);
    }, 1000);
  },
};
