const Web3 = require("web3");
const HDWalletProvider = require("truffle-hdwallet-provider"); //HD Wallet provider
const fs = require("fs");
const events = require("./events.json");

const { mnemonic } = require("../secret.json");
const contractABI = require(`./EinsteinStaking.json`).abi;
const contractAddress = "0x87a1C0803e709ad461a96aC34b7ad5B182554fAB";

const web3 = new Web3(
    new HDWalletProvider(mnemonic, `https://speedy-nodes-nyc.moralis.io/e3771a4194ca1a8d20c96277/bsc/mainnet`),
);
let contract = new web3.eth.Contract(contractABI, contractAddress);

async function filterEvents() {
    let userData = {};
    for (let i = 0; i < events.length; i++) {
        for (let j = 0; j < events[i].length; j++) {
            if (events[i][j].returnValues && events[i][j].event === "Reward") {
                let address = events[i][j].returnValues.to;
                let amount = events[i][j].returnValues.amount;
                let block = await web3.eth.getBlock(events[i][j].blockNumber);
                let timestamp = block.timestamp;
                console.log(timestamp);
                if (!userData[address]) {
                    userData[address] = {
                        rewards: [],
                        timestamps: [],
                    }
                }
                userData[address]["rewards"].push(amount);
                userData[address]["timestamps"].push(timestamp);
            }
        }
    }
    console.log(Object.keys(userData).length);
    fs.writeFileSync("userData-reward.json", JSON.stringify(userData, null, 2));
}

async function filterUsers() {
    let userData = require("./userData.json");
    let userRewards = require("./userData-reward.json");
    let users = Object.keys(userData);
    for (user of users) {
        if (userRewards[user]) {
            userData[user]["rewards"] = userRewards[user]["rewards"];
        }
    }
    await fs.writeFileSync("userData-filtered.json", JSON.stringify(userData, null, 2));
}

// filterEvents();
filterUsers();