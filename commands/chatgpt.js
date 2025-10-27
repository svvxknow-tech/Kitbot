const OpenAI = require("openai");
const axios = require("axios");

module.exports = {
  name: "chatgpt",
  description: "Ask ChatGPT a question. Usage: ?chatgpt <question>",
  async execute(bot, args, username) {

    if (!process.env.OPENAI_API_KEY) {
      return bot.chat(`/w ${username} OpenAI API key not configured.`);
    }

    if (args.length === 0) {
      return bot.chat(`/w ${username} Please provide a question.`);
    }

    const question = args.join(" ");
    bot.chat(`/w ${username} Processing your question...`);

    try {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: question }],
        max_tokens: 500,
      });

      const answer = response.choices[0].message.content;

      const pastebinUrl = await uploadToPastebin(answer);

      if (pastebinUrl) {
        bot.chat(`/w ${username} Answer: ${pastebinUrl}`);
      } else {
        const truncated = answer.substring(0, 200);
        bot.chat(`/w ${username} ${truncated}...`);
      }
    } catch (error) {
      console.error("ChatGPT error:", error.message);
      bot.chat(`/w ${username} Error: ${error.message}`);
    }
  },
};

async function uploadToPastebin(text) {
  try {
    const response = await axios.post(
      "https://paste.rs",
      text,
      {
        headers: {
          "Content-Type": "text/plain",
        },
      }
    );

    return response.data.trim();
  } catch (error) {
    console.error("Pastebin error:", error.message);
    return null;
  }
}
