const config = require("../config.json");
const util = require("../util");

module.exports = {
  name: "stop",
  description: "Stop following (whitelist only)",
  execute(bot, args, username) {
    if (!util.isWhitelisted(username)) {
      return bot.chat(`/w ${username} You are not authorized to use this command.`);
    }

    if (global.followingPlayer) {
      global.followingPlayer = null;
      bot.pathfinder.setGoal(null);
      bot.chat(`/w ${username} Stopped following.`);
    } else {
      bot.chat(`/w ${username} I'm not following anyone.`);
    }
  },
};
