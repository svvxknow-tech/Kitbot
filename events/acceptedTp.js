const util = require("../util");
const config = require("../config.json");

module.exports = {
  name: "acceptedTp",
  async execute(bot, username) {
    console.log(`[ACCEPTED TP EVENT FIRED!] TPed to ${username}`);
    
    if (global.onTpAccepted) {
      global.onTpAccepted(bot, username);
    } else {
      setTimeout(async () => {
        bot.chat("/kill");
        global.cooldowns.push(username);
        setTimeout(() => {
          util.removeCooldown(username);
        }, config.cooldown);
      }, 1000);
    }
  },
};
