const { Client, GatewayIntentBits, TextChannel } = require("discord.js");
const Scanner = require("./scaner.js");
const fs = require("fs");
const path = require("path");

class Bot {
  constructor(token) {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
    });

    this.client.on("ready", () => {
      console.log(`Logged in as ${this.client.user.tag}!`);
    });

    this._users = this.loadUsers();
    this._users == false ? this.createUsersFile() : true;
    this.client.login(token);
  }

  async subscribe(userId, validatorMoniker) {
    const scanner = new Scanner();
    scanner.setAvailableAPI(await scanner.findAvailableAPI());

    const isActive = await scanner.checkValidatorIsActiveBy(validatorMoniker);

    if (!isActive) return false;

    if (this._users.length == 0) {
      this._users.push({ moniker: validatorMoniker, subscribers: [userId] });
      this.saveUsers();
      return true;
    }

    for (let validator of this._users) {
      if (validator.moniker == validatorMoniker) {
        validator.subscribers.push(userId);
      } else {
        this._users.push({ moniker: validatorMoniker, subscribers: [userId] });
      }

      this.saveUsers();
      return true;
    }
  }
  unsubscribe(userId, moniker) {
    let subscribers = this.getSubscribersBy(moniker);

    for (let subscriber in subscribers) {
      if (subscribers[subscriber] == userId) {
        subscribers.splice(subscriber, 1);
      }
    }

    this.saveUsers();
    return true;
  }
  async sendMessage(chatId, message, cb) {
    const channel = await this.client.channels.fetch(chatId);
    return channel.send(message);
  }
  loadUsers() {
    try {
      this._users = require("../users.json");
      return this._users;
    } catch (e) {
      return false;
    }
  }
  saveUsers() {
    try {
      const filePath = path.resolve(__dirname, "../users.json");
      fs.writeFileSync(filePath, JSON.stringify(this._users, 0, 2));
      return true;
    } catch (e) {
      console.log(e);
      return false;
    }
  }
  createUsersFile() {
    try {
      const filePath = path.resolve(__dirname, "../users.json");

      if (!fs.existsSync(filePath)) {
        fs.writeFile(filePath, JSON.stringify([], 0, 2), (err) => {
          if (err) console.log(err);

          this._users = [];
          return this._users;
        });
      } // if bot already created file
      else return false;
    } catch (err) {
      console.error(err);
    }
  }

  getSubscribersBy(moniker) {
    for (let validator of this._users) {
      if (validator.moniker == moniker) return validator.subscribers;
    }
  }
  destroy() {
    this.client.destroy();
  }
}

module.exports = Bot;
