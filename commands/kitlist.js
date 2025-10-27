const config = require("../config.json");

module.exports = {
  name: "kitlist",
  description: "Lists all available kits (available to all players)",
  async execute(bot, args, username) {
    if (!config.kits || config.kits.length === 0) {
      return bot.chat(`/w ${username} No kits available.`);
    }

    bot.chat(`/w ${username} Available kits:`);
    
    for (const kit of config.kits) {
      bot.chat(`/w ${username} - ${kit.name}: ${kit.description}`);
    }

    bot.chat(`/w ${username} Use ?kit <type> to request a kit.`);
  },
};
