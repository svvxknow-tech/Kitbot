const fs = require("fs");
const path = require("path");
const util = require("../util");

module.exports = {
  name: "count",
  execute(bot, args, username) {
    if (!util.isWhitelisted(username)) {
      return bot.chat(`/w ${username} You are not authorized to use this command.`);
    }
    const kitDataPath = path.join(__dirname, "..", "kitdata.json");
    let kitData = { deliveries: {}, totalKits: 0, totalOrders: 0, totalDupes: 0 };
    
    if (fs.existsSync(kitDataPath)) {
      kitData = JSON.parse(fs.readFileSync(kitDataPath, "utf8"));
    }

    const type = args[0] ? args[0].toLowerCase() : "total";
    const targetUser = args[1] || null;

    if (targetUser) {
      const userData = kitData.deliveries[targetUser] || { kits: 0, orders: 0, dupes: 0 };
      
      switch (type) {
        case "dupes":
          bot.chat(`/w ${username} ${targetUser} has received ${userData.dupes} duplicate kits.`);
          break;
        case "kits":
          bot.chat(`/w ${username} ${targetUser} has received ${userData.kits} kits.`);
          break;
        case "orders":
          bot.chat(`/w ${username} ${targetUser} has placed ${userData.orders} kit orders.`);
          break;
        case "total":
          bot.chat(`/w ${username} ${targetUser}: Orders: ${userData.orders}, Kits: ${userData.kits}, Dupes: ${userData.dupes}`);
          break;
        default:
          bot.chat(`/w ${username} Unknown type. Use: dupes, kits, orders, or total`);
      }
    } else {
      switch (type) {
        case "dupes":
          bot.chat(`/w ${username} Total duplicate kits delivered: ${kitData.totalDupes}`);
          break;
        case "kits":
          bot.chat(`/w ${username} Total kits delivered: ${kitData.totalKits}`);
          break;
        case "orders":
          bot.chat(`/w ${username} Total kit orders: ${kitData.totalOrders}`);
          break;
        case "total":
          bot.chat(`/w ${username} Total - Orders: ${kitData.totalOrders}, Kits: ${kitData.totalKits}, Dupes: ${kitData.totalDupes}`);
          break;
        default:
          bot.chat(`/w ${username} Unknown type. Use: dupes, kits, orders, or total`);
      }
    }
  },
};
