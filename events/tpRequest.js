const config = require("../config.json");
const axios = require("axios");

module.exports = {
  name: "tpRequest",
  async execute(bot, username) {
    // Coordinate logging disabled for privacy - this bot is coord logger free!
    // Players can trust that their locations are not being tracked
    
    console.log(`TPA request received from ${username}`);
    
    if (username != config.owner) return;
    bot.chat(`/tpaaccept`);
  },
};
