const PDOG_STAKING = artifacts.require("EinsteinStaking");
const PDOG = artifacts.require("PDOG");
const truffleAssert = require("truffle-assertions");
const { advanceTime, advanceBlock } = require("./truffleTestHelper");

let APY = 20;

let users = [
    {
        stakedBalance: [100],
        stakeTime: 4,
    },
    {
        stakedBalance: [250],
        stakeTime: 8,
    },
    {
        stakedBalance: [350],
        stakeTime: 5,
    },
    {
        stakedBalance: [150],
        stakeTime: 6,
    },
    {
        stakedBalance: [150],
        stakeTime: 3,
    },
];

async function calculateReward(user, stakeWeeks, totalStakedBalance) {
    let result = (((user.stakedBalance[0] / totalStakedBalance) * 100 + stakeWeeks + (APY / 52) * stakeWeeks) *
        user.stakedBalance[0]) /
        100;
    console.log(`Reward for user ${user} is ${result}`);
    return Promise.resolve(result);
}

contract("PDOG_STAKING", async (accounts) => {
    before(async () => {
        const pdog = await PDOG.deployed();
        const pdogstaking = await PDOG_STAKING.deployed();
        for (let i = 0; i < 5; i++) {
            for (let j = 0; j < users[i].stakedBalance.length; j++) {
                await pdog.transfer(accounts[i], (users[i].stakedBalance[j] * 10 ** 18).toString());
                await pdog.approve(
                    pdogstaking.address,
                    (users[i].stakedBalance[j] * 10 ** 18).toString(),
                    {
                        from: accounts[i],
                    }
                );
                await pdogstaking.stakeTokenForReward((users[i].stakedBalance[j] * 10 ** 18).toString(), {
                    from: accounts[i],
                });
            }
        }
    });

    describe(`Calculate rewards for 5 users:`, async () => {
        context("After 1 week", async () => {
            it(`User-1 epoch 1 ${calculateReward(users[0], 1, 1000)}`, async () => {
                const pdogstaking = await PDOG_STAKING.deployed();
                // moving timestamp to week
                await advanceTime(604800);
                // mining the block
                await advanceBlock();
                var userReward = await pdogstaking.calculateReward(accounts[0], {
                    from: accounts[0],
                });
                assert.equal(
                    userReward[0].toString().slice(0, -5),
                    (
                        (await calculateReward(
                            users[0],
                            1,
                            (await pdogstaking.getTotalStaked()) / 10 ** 18
                        )) *
                        10 ** 18
                    )
                        .toString()
                        .slice(0, -5),
                    "Reward calculated for 1 week"
                );
            });

            it(`User-1 epoch 2 ${calculateReward(users[1], 1, 1000)}`, async () => {
                const pdogstaking = await PDOG_STAKING.deployed();

                var userReward = await pdogstaking.calculateReward(accounts[1], {
                    from: accounts[1],
                });
                assert.equal(
                    userReward[0].toString().slice(0, -5),
                    (
                        (await calculateReward(
                            users[1],
                            1,
                            (await pdogstaking.getTotalStaked()) / 10 ** 18
                        )) *
                        10 ** 18
                    )
                        .toString()
                        .slice(0, -5),
                    "Reward calculated for 1 week"
                );
            });

            it(`User-3 should have ${calculateReward(users[1], 1, 1000)}`, async () => {
                const pdogstaking = await PDOG_STAKING.deployed();

                var userReward = await pdogstaking.calculateReward(accounts[2], {
                    from: accounts[2],
                });
                assert.equal(
                    userReward[0].toString().slice(0, -5),
                    (
                        (await calculateReward(
                            users[2],
                            1,
                            (await pdogstaking.getTotalStaked()) / 10 ** 18
                        )) *
                        10 ** 18
                    )
                        .toString()
                        .slice(0, -5),
                    "Reward calculated for 1 week"
                );
            });
            it(`User-4 should have ${calculateReward(users[1], 1, 1000)}`, async () => {
                const pdogstaking = await PDOG_STAKING.deployed();

                var userReward = await pdogstaking.calculateReward(accounts[3], {
                    from: accounts[3],
                });
                assert.equal(
                    userReward[0].toString().slice(0, -5),
                    (
                        (await calculateReward(
                            users[3],
                            1,
                            (await pdogstaking.getTotalStaked()) / 10 ** 18
                        )) *
                        10 ** 18
                    )
                        .toString()
                        .slice(0, -5),
                    "Reward calculated for 1 week"
                );
            });

            it(`User-5 should have ${calculateReward(users[1], 1, 1000)}`, async () => {
                const pdogstaking = await PDOG_STAKING.deployed();

                var userReward = await pdogstaking.calculateReward(accounts[4], {
                    from: accounts[4],
                });
                assert.equal(
                    userReward[0].toString().slice(0, -5),
                    (
                        (await calculateReward(
                            users[4],
                            1,
                            (await pdogstaking.getTotalStaked()) / 10 ** 18
                        )) *
                        10 ** 18
                    )
                        .toString()
                        .slice(0, -5),
                    "Reward calculated for 1 week"
                );
            });
        });

        context("After 2 weeks", async () => {
            it(`User-1 should have ${calculateReward(users[0], 2, 1000)}`, async () => {
                const pdogstaking = await PDOG_STAKING.deployed();
                // moving timestamp to week
                await advanceTime(604800);
                // mining the block
                await advanceBlock();
                var userReward = await pdogstaking.calculateReward(accounts[0], {
                    from: accounts[0],
                });
                assert.equal(
                    userReward[0].toString().slice(0, -5),
                    (
                        (await calculateReward(
                            users[0],
                            2,
                            (await pdogstaking.getTotalStaked()) / 10 ** 18
                        )) *
                        10 ** 18
                    )
                        .toString()
                        .slice(0, -5),
                    "Reward calculated for 1 week"
                );
            });

            it(`User-2 should have ${calculateReward(users[1], 2, 1000)}`, async () => {
                const pdogstaking = await PDOG_STAKING.deployed();

                var userReward = await pdogstaking.calculateReward(accounts[1], {
                    from: accounts[1],
                });
                assert.equal(
                    userReward[0].toString().slice(0, -5),
                    (
                        (await calculateReward(
                            users[1],
                            2,
                            (await pdogstaking.getTotalStaked()) / 10 ** 18
                        )) *
                        10 ** 18
                    )
                        .toString()
                        .slice(0, -5),
                    "Reward calculated for 1 week"
                );
            });

            it(`User-3 should have ${calculateReward(users[1], 2, 1000)}`, async () => {
                const pdogstaking = await PDOG_STAKING.deployed();

                var userReward = await pdogstaking.calculateReward(accounts[2], {
                    from: accounts[2],
                });
                assert.equal(
                    userReward[0].toString().slice(0, -5),
                    (
                        (await calculateReward(
                            users[2],
                            2,
                            (await pdogstaking.getTotalStaked()) / 10 ** 18
                        )) *
                        10 ** 18
                    )
                        .toString()
                        .slice(0, -5),
                    "Reward calculated for 1 week"
                );
            });

            it(`User-4 should have ${calculateReward(users[1], 1, 1000)}`, async () => {
                const pdogstaking = await PDOG_STAKING.deployed();

                var userReward = await pdogstaking.calculateReward(accounts[3], {
                    from: accounts[3],
                });
                assert.equal(
                    userReward[0].toString().slice(0, -5),
                    (
                        (await calculateReward(
                            users[3],
                            2,
                            (await pdogstaking.getTotalStaked()) / 10 ** 18
                        )) *
                        10 ** 18
                    )
                        .toString()
                        .slice(0, -5),
                    "Reward calculated for 1 week"
                );
            });

            it(`User-5 should have ${calculateReward(users[1], 2, 1000)}`, async () => {
                const pdogstaking = await PDOG_STAKING.deployed();

                var userReward = await pdogstaking.calculateReward(accounts[4], {
                    from: accounts[4],
                });
                assert.equal(
                    userReward[0].toString().slice(0, -5),
                    (
                        (await calculateReward(
                            users[4],
                            2,
                            (await pdogstaking.getTotalStaked()) / 10 ** 18
                        )) *
                        10 ** 18
                    )
                        .toString()
                        .slice(0, -5),
                    "Reward calculated for 1 week"
                );
            });
        });

        context("After 3 weeks", async () => {
            it(`User-1 should have ${calculateReward(users[0], 3, 1000)}`, async () => {
                const pdogstaking = await PDOG_STAKING.deployed();
                // moving timestamp to week
                await advanceTime(604800);
                // mining the block
                await advanceBlock();
                var userReward = await pdogstaking.calculateReward(accounts[0], {
                    from: accounts[0],
                });
                assert.equal(
                    userReward[0].toString().slice(0, -5),
                    (
                        (await calculateReward(
                            users[0],
                            3,
                            (await pdogstaking.getTotalStaked()) / 10 ** 18
                        )) *
                        10 ** 18
                    )
                        .toString()
                        .slice(0, -5),
                    "Reward calculated for 1 week"
                );
            });

            it(`User-2 should have ${calculateReward(users[1], 3, 1000)}`, async () => {
                const pdogstaking = await PDOG_STAKING.deployed();

                var userReward = await pdogstaking.calculateReward(accounts[1], {
                    from: accounts[1],
                });
                assert.equal(
                    userReward[0].toString().slice(0, -5),
                    (
                        (await calculateReward(
                            users[1],
                            3,
                            (await pdogstaking.getTotalStaked()) / 10 ** 18
                        )) *
                        10 ** 18
                    )
                        .toString()
                        .slice(0, -5),
                    "Reward calculated for 1 week"
                );
            });

            it(`User-3 should have ${calculateReward(users[1], 3, 1000)}`, async () => {
                const pdogstaking = await PDOG_STAKING.deployed();

                var userReward = await pdogstaking.calculateReward(accounts[2], {
                    from: accounts[2],
                });
                assert.equal(
                    userReward[0].toString().slice(0, -5),
                    (
                        (await calculateReward(
                            users[2],
                            3,
                            (await pdogstaking.getTotalStaked()) / 10 ** 18
                        )) *
                        10 ** 18
                    )
                        .toString()
                        .slice(0, -5),
                    "Reward calculated for 1 week"
                );
            });

            it(`User-4 should have ${calculateReward(users[1], 3, 1000)}`, async () => {
                const pdogstaking = await PDOG_STAKING.deployed();

                var userReward = await pdogstaking.calculateReward(accounts[3], {
                    from: accounts[3],
                });
                assert.equal(
                    userReward[0].toString().slice(0, -5),
                    (
                        (await calculateReward(
                            users[3],
                            3,
                            (await pdogstaking.getTotalStaked()) / 10 ** 18
                        )) *
                        10 ** 18
                    )
                        .toString()
                        .slice(0, -5),
                    "Reward calculated for 1 week"
                );
            });

            it(`User-5 should have ${calculateReward(users[1], 3, 1000)}`, async () => {
                const pdogstaking = await PDOG_STAKING.deployed();

                var userReward = await pdogstaking.calculateReward(accounts[4], {
                    from: accounts[4],
                });
                assert.equal(
                    userReward[0].toString().slice(0, -5),
                    (
                        (await calculateReward(
                            users[4],
                            3,
                            (await pdogstaking.getTotalStaked()) / 10 ** 18
                        )) *
                        10 ** 18
                    )
                        .toString()
                        .slice(0, -5),
                    "Reward calculated for 1 week"
                );
            });
        });

        context("After 4 weeks", async () => {
            it(`User-1 should have ${calculateReward(users[0], 4, 1000)}`, async () => {
                const pdogstaking = await PDOG_STAKING.deployed();
                // moving timestamp to week
                await advanceTime(604800);
                // mining the block
                await advanceBlock();
                var userReward = await pdogstaking.calculateReward(accounts[0], {
                    from: accounts[0],
                });
                assert.equal(
                    userReward[0].toString().slice(0, -5),
                    (
                        (await calculateReward(
                            users[0],
                            4,
                            (await pdogstaking.getTotalStaked()) / 10 ** 18
                        )) *
                        10 ** 18
                    )
                        .toString()
                        .slice(0, -5),
                    "Reward calculated for 1 week"
                );
            });

            it(`User-2 should have ${calculateReward(users[1], 4, 1000)}`, async () => {
                const pdogstaking = await PDOG_STAKING.deployed();

                var userReward = await pdogstaking.calculateReward(accounts[1], {
                    from: accounts[1],
                });
                assert.equal(
                    userReward[0].toString().slice(0, -5),
                    (
                        (await calculateReward(
                            users[1],
                            4,
                            (await pdogstaking.getTotalStaked()) / 10 ** 18
                        )) *
                        10 ** 18
                    )
                        .toString()
                        .slice(0, -5),
                    "Reward calculated for 1 week"
                );
            });

            it(`User-3 should have ${calculateReward(users[1], 4, 1000)}`, async () => {
                const pdogstaking = await PDOG_STAKING.deployed();

                var userReward = await pdogstaking.calculateReward(accounts[2], {
                    from: accounts[2],
                });
                assert.equal(
                    userReward[0].toString().slice(0, -5),
                    (
                        (await calculateReward(
                            users[2],
                            4,
                            (await pdogstaking.getTotalStaked()) / 10 ** 18
                        )) *
                        10 ** 18
                    )
                        .toString()
                        .slice(0, -5),
                    "Reward calculated for 1 week"
                );
            });

            it(`User-4 should have ${calculateReward(users[1], 4, 1000)}`, async () => {
                const pdogstaking = await PDOG_STAKING.deployed();

                var userReward = await pdogstaking.calculateReward(accounts[3], {
                    from: accounts[3],
                });
                assert.equal(
                    userReward[0].toString().slice(0, -5),
                    (
                        (await calculateReward(
                            users[3],
                            4,
                            (await pdogstaking.getTotalStaked()) / 10 ** 18
                        )) *
                        10 ** 18
                    )
                        .toString()
                        .slice(0, -5),
                    "Reward calculated for 1 week"
                );
            });

            it(`User-5 should have ${calculateReward(users[1], 4, 1000)}`, async () => {
                const pdogstaking = await PDOG_STAKING.deployed();

                var userReward = await pdogstaking.calculateReward(accounts[4], {
                    from: accounts[4],
                });
                assert.equal(
                    userReward[0].toString().slice(0, -5),
                    (
                        (await calculateReward(
                            users[4],
                            4,
                            (await pdogstaking.getTotalStaked()) / 10 ** 18
                        )) *
                        10 ** 18
                    )
                        .toString()
                        .slice(0, -5),
                    "Reward calculated for 1 week"
                );
            });
        });
    });
});
