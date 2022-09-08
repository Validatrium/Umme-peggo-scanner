const axios = require("axios").default;

const ALERT_LIMIT = 5; // if highiest - validator 'event nonce' is more than LIMIT - alert

const APIs = [
  "https://api.athena.main.network.umee.cc",
  "https://api.aphrodite.main.network.umee.cc",
  "https://api.apollo.main.network.umee.cc",
  "https://api.artemis.main.network.umee.cc",
  "https://api.beluga.main.network.umee.cc",
  "https://api.blue.main.network.umee.cc",
  "https://api.bottlenose.main.network.umee.cc",
];

class Scanner {
  constructor() {
    this._api = null;
  }

  async setAvailableAPI(api) {
    if (api === false) {
      console.log("Did not found available API server");
      proccess.exit(1);
    }

    this._api = api;
    return this._api;
  }

  async findAvailableAPI() {
    for (let api of APIs) {
      const apiWorks = async (api) => {
        return axios
          .get(`${api}/node_info`)
          .then((res) => (res.status == 200 ? true : false))
          .catch((err) => false);
      };

      if ((await apiWorks(api)) == true) return api;
    }
    return false; // if no available api has been found
  }

  async getActiveValidators() {
    const URL = `${this._api}/cosmos/staking/v1beta1/validators?status=BOND_STATUS_BONDED&limit=1000`;

    const output = [];
    const req = await axios.get(URL);
    const dataRaw = await req.data.validators;

    dataRaw.forEach((validator) => {
      output.push({
        moniker: validator.description.moniker,
        operatorAddress: validator.operator_address,
      });
    });

    return output;
  }

  async setValidatorsOrchestratorAddressFor(validators) {
    for (let val of validators) {
      val.orchestratorAddress = await this.getOrchestratorAddressBy(
        val.operatorAddress
      );
    }
    return validators;
  }

  async getOrchestratorAddressBy(operatorAddress) {
    const URL = `${this._api}/gravity/v1beta/query_delegate_keys_by_validator?validator_address=${operatorAddress}`;
    return new Promise((resolve, reject) => {
      setTimeout(async () => {
        axios
          .get(URL)
          .then((res) => resolve(res.data.orchestrator_address))
          .catch((err) => resolve(false));
      }, 100); // I need this timout to not spam with my requests a lot :)
    });
  }

  async setValidatorsEventNonceFor(validators) {
    for (let val of validators) {
      if (!val.orchestratorAddress) val.eventNonce = false;

      val.eventNonce = await this.getEventNonceBy(val.orchestratorAddress);
    }
    return validators;
  }

  async getEventNonceBy(orchestratorAddress) {
    const URL = `${this._api}/gravity/v1beta/oracle/eventnonce/${orchestratorAddress}`;

    return new Promise((resolve, reject) => {
      setTimeout(async () => {
        axios
          .get(URL)
          .then((res) => resolve(parseInt(res.data.event_nonce)))
          .catch((err) => resolve(false));
      }, 100); // I need this timout to not spam with my requests a lot :)
    });
  }

  getNetworkMaxEventNonceFrom(validators) {
    const eventNonces = validators.map((obj) => obj.eventNonce);
    return Math.max(...eventNonces);
  }

  sortValidatorsWithProblems(validators, maxNonce) {
    const lowPerformance = {
      validators: [],
      maxNonce: maxNonce,
      error: "low peggod performance",
    };
    const unableToScan = {
      validators: [],
      error: "Unable to find orchestrator address",
    };
    validators.forEach((validator) => {
      if (maxNonce - validator.eventNonce >= ALERT_LIMIT)
        lowPerformance.validators.push(validator);

      if (!validator.orchestratorAddress) {
        validator.eventNonce = 0;
        unableToScan.validators.push(validator);
      }
    });

    return { lowPerformance, unableToScan };
  }
  async checkValidatorIsActiveBy(moniker) {
    const activeValidators = await this.getActiveValidators();

    for (let validator of activeValidators) {
      if (validator.moniker == moniker) return true;
    }
    return false;
  }
}

module.exports = Scanner;
