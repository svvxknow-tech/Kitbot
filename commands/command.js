const config = require("../config.json");

module.exports = {
  name: "command",
  description: "Show all available commands and their descriptions",
  execute(bot, args, username) {
    const commandList = [];
    
    global.commands.forEach((cmd, name) => {
      const desc = cmd.description || "No description available";
      commandList.push(`${config.prefix}${name} - ${desc}`);
    });

    bot.chat(`/w ${username} Available commands:`);
    
    commandList.forEach((cmdText) => {
      setTimeout(() => {
        bot.chat(`/w ${username} ${cmdText}`);
      }, 500 * commandList.indexOf(cmdText));
    });
  },
};
