const config = require("../config.json");
const util = require("../util");

module.exports = {
  name: "come",
  description: "Bot sends TPA request to you (whitelist only)",
  execute(bot, args, username) {
    if (!util.isWhitelisted(username)) {
      return bot.chat(`/w ${username} You are not authorized to use this command.`);
    }

    bot.chat(`/tpa ${username}`);
    bot.chat(`/w ${username} Sending teleport request...`);
  },
};
