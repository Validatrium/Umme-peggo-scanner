# How it works

This bot could be added to the discord server, and alert it's members about validators which have low "peggod" performance.
Members are able to subscribe to the specific validator, in the next report the bot will mention them, so they will not lose the notification.

# How to use

The bot have 2 commands: 
`!subscribe <moniker-name>` - to subscribe on the validator

`!unsubscribe <moniker-name>` -  to unsubcribe 

# Install steps

### prerequires
- create a discord bot, to get it's token
- get the room id where bot will write
- 
### Install

```bash
# preparing
sudo apt update && sudo apt upgrade -y 

# install nodejs
curl -sL https://deb.nodesource.com/setup_18.x | sudo -E bash -  
sudo apt install nodejs

# clone repository
git clone https://github.com/Validatrium/Umme-peggo-scanner.git
cd Umme-peggo-scanner

# install required packeges
npm install

# fill the environment1
cp .env.example .env 
nano .env # fill it with your bot token and channel room id

# run main bot proccess
node index.js # it will process subscribe/unsibscribe commands

# run alert process
node alert.js # you can paste it in your's server crontab configuration


```
