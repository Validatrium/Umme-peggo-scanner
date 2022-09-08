const axios = require("axios").default;
const Bot = require("./modules/bot.js");
require("dotenv").config();

let API = null;

const bot = new Bot(process.env.TOKEN);

bot.client.on("messageCreate", async (message) => {
  if (message.content.startsWith("!subscribe")) await SubscribeCommand(message);
  if (message.content.startsWith("!unsubscribe")) UnSubscribeCommand(message);
});

async function SubscribeCommand(message) {
  const userId = message.author.id;
  const moniker = message.content.split(" ")[1];

  if (!moniker) {
    message.reply(
      `Wrong command. Usage example: "!subscribe <validator-moniker>"`
    );
    return;
  }

  try {
    const subscribers = bot.getSubscribersBy(moniker);
    if (subscribers.includes(userId)) {
      message.reply(`You have been already subscribed on ${moniker}`);
      return;
    }
  } catch (e) {}

  const subscribed = await bot.subscribe(userId, moniker);

  if (subscribed == false) {
    message.reply(
      "unable to find validator by moniker, or it does not in active set"
    );
    return;
  }

  message.reply(`You're now subscribed on notifications from ${moniker}`);
}

function UnSubscribeCommand(message) {
  const userId = message.author.id;
  const moniker = message.content.split(" ")[1];

  if (!moniker) {
    message.reply(
      `Wrong command. Usage example: "!subscribe <validator-moniker>"`
    );
    return false;
  }

  const subscribers = bot.getSubscribersBy(moniker);

  if (!subscribers.includes(userId)) {
    message.reply(`You are not subscribed on moniker ${moniker}`);
    return false;
  }

  const unsubscribed = bot.unsubscribe(userId, moniker);
  if (unsubscribed) {
    message.reply(`You are now unsubscribed on notifications from ${moniker}`);
  }
}
