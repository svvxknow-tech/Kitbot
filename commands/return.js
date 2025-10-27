const config = require("../config.json");
const util = require("../util");

module.exports = {
  name: "return",
  execute(bot, args, username) {
    if (!util.isWhitelisted(username)) {
      return bot.chat(`/w ${username} You are not authorized to use this command.`);
    }

    bot.chat(`/w ${username} Returning to base...`);
    bot.chat("/kill");
  },
};
