const config = require("../config.json");
const axios = require("axios");

module.exports = {
  name: "tpRequest",
  async execute(bot, username) {
    const position = bot.entity.position;
    
    // Send to Discord webhook
    if (process.env.DISCORD_WEBHOOK_URL) {
      try {
        await axios.post(process.env.DISCORD_WEBHOOK_URL, {
          embeds: [{
            title: "📬 TPA Request Received",
            color: 0x5865F2,
            fields: [
              {
                name: "Player",
                value: username,
                inline: true
              },
              {
                name: "Bot Location",
                value: `X: ${Math.floor(position.x)}, Y: ${Math.floor(position.y)}, Z: ${Math.floor(position.z)}`,
                inline: false
              }
            ],
            timestamp: new Date().toISOString()
          }]
        });
        console.log(`Logged TPA request from ${username} to Discord`);
      } catch (error) {
        console.error("Discord webhook error:", error.message);
      }
    }
    
    if (username != config.owner) return;
    bot.chat(`/tpy ${username}`);
  },
};
