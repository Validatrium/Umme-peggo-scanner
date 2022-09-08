const axios = require("axios").default;
require("dotenv").config();
const Scanner = require("./modules/scaner.js");
const Bot = require("./modules/bot.js");

const bot = new Bot(process.env.TOKEN);
const chatId = process.env.CHANNEL_ID;

const Main = (async () => {
  let validators = []; // [ {moniker: ..., valoper addres: ..., orch address: ..., event_nonce: ...} ]
  let maxNonce = 0; // currently highest event_nonce in network

  const scanner = new Scanner();
  scanner.setAvailableAPI(await scanner.findAvailableAPI());

  // get active validators info: moniker, operator address,orchestrator address and even nonce
  validators = await scanner.getActiveValidators();
  validators = await scanner.setValidatorsOrchestratorAddressFor(validators);
  validators = await scanner.setValidatorsEventNonceFor(validators);
  // find validators with problems
  maxNonce = scanner.getNetworkMaxEventNonceFrom(validators);
  const withProblems = scanner.sortValidatorsWithProblems(validators, maxNonce);
  //alert subscribers if they have low performance
  const message = generateDiscordMessage(withProblems);
  const sent = await bot.sendMessage(chatId, message);
  if (sent) process.exit(0);
})();

function stringifyValidators(obj) {
  let output = "";

  obj.validators.forEach((validator) => (output += `*${validator.moniker}*, `));
  return output;
}

function generateDiscordMessage(report) {
  const subscribersArray = findSubscribers(report);
  const subscribers = stringifySubscribers(subscribersArray);

  const lowPerf = stringifyValidators(report.lowPerformance);
  const unableToScan = stringifyValidators(report.unableToScan);

  const output = `

Report by <t:${Math.floor(Date.now() / 1000)}>

Hey! Validators${subscribers}!

🟡 Low performance: 
${lowPerf}

🔴 Unable to scan:
${unableToScan}
`;
  return output;
}

function stringifyValidators(obj) {
  let output = "";

  obj.validators.forEach((validator) => (output += `*${validator.moniker}*, `));
  return output;
}

function findSubscribers(report) {
  const output = [];

  report.lowPerformance.validators.forEach((validator) => {
    const reportedValidator = validator;

    const subscribers = bot.getSubscribersBy(reportedValidator.moniker);

    if (subscribers) output.push(...subscribers);
  });

  report.unableToScan.validators.forEach((validator) => {
    const reportedValidator = validator;

    const subscribers = bot.getSubscribersBy(reportedValidator.moniker);

    if (subscribers) output.push(...subscribers);
  });

  return [...new Set(output)];
}

function stringifySubscribers(subscribersArray) {
  let output = "";

  subscribersArray.forEach((subscriber) => (output += ` <@${subscriber}>`));

  return output;
}
