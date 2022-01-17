const fs = require("fs");
const HDWalletProvider = require("truffle-hdwallet-provider"); //HD Wallet provider
const web3 = require("web3");
const userData = require("./userData-filtered.json");
const { mnemonic } = require("../secret.json");

// Read config variables
const MNEMONIC = mnemonic; //wallet MNEMONIC
const CONTRACT_ADDRESS = "0x87a1C0803e709ad461a96aC34b7ad5B182554fAB";
const SIGNER_ADDRESS = "0x1C4A0724DC884076B9196FFf7606623409613Adf";

// ABI used to encode information while interacting onchain smart contract functions
const CONTRACT_ABI = require("./EinsteinStaking.json").abi;

if (!MNEMONIC) {
    console.error(
        "Please set a mnemonic, Alchemy/Infura key, owner, network, and contract address."
    );
    return;
}

let provider;
let web3Instance;
var contract;

// let web3SocketInstance;

const setUpWeb3 = async function () {
    provider = new HDWalletProvider(MNEMONIC, "https://cool-blue-resonance.bsc.quiknode.pro/6edd98a1bc4b399442ea9581007e96a1f225ccf0/");

    web3Instance = new web3(provider); //create a web3 instance
    contract = new web3Instance.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);
    console.log(contract.methods);
};

const upgradeUsers = async function (address, balances, timestamps, claimedReward) {
    await contract.methods
        .upgradeUsers(address, balances, timestamps, claimedReward)
        .send({ from: SIGNER_ADDRESS, chainId: 56 })
        .then(async (result) => {
            console.log(result.transactionHash);
        })
        .catch((error) => console.log(error));
};

const main = async () => {
    await setUpWeb3();
    let users = Object.keys(userData);
    for (user of users) {
        let address = user;
        let balances = [...userData[user].balances];
        let timestamps = [...userData[user].timestamps];
        let claimedRewards;
        if (userData[user].rewards !== undefined) {
            claimedRewards = userData[user].rewards[0];
        } else {
            claimedRewards = 0;
        }
        console.log(address, balances, timestamps, claimedRewards);
        await upgradeUsers(address, balances, timestamps, claimedRewards);
    }
};

main();
