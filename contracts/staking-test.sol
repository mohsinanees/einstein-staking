// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

interface IERC20 {
    function totalSupply() external view returns (uint256);

    function balanceOf(address account) external view returns (uint256);

    function allowance(address owner, address spender)
        external
        view
        returns (uint256);

    function transfer(address recipient, uint256 amount)
        external
        returns (bool);

    function approve(address spender, uint256 amount) external returns (bool);

    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) external returns (bool);

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );
}

contract EinsteinStaking is
    Ownable,
    Pausable,
    ReentrancyGuard
{
    using SafeMath for uint256;
    string public constant name = "EINSTEIN - Staking";

    IERC20 public stakeToken; // Token which users stake to get reward
    IERC20 public rewardToken; // holds token address which we are giving it as reward
    uint256 public rewardRate; // APR of the staking
    uint256 public startTime; // Block number after which reward should start
    uint256 public endTime; // End time of staking
    uint256 public rewardInterval; // Time difference for calculating reward, eg., Day, Months, Years, etc.,
    address[] public stakers;
    mapping(address => uint256) public stakingStartTime; // to manage the time when the user started the staking
    mapping(address => uint256) public stakedBalance; // to manage the staking of token A  and distibue the profit as token B
    mapping(address => bool) public hasStaked;
    mapping(address => bool) public isStaking;
    mapping(address => uint256) public oldReward; // Stores the old reward
    uint256 public _totalStakedAmount; // Total amount of tokens that users have staked
    mapping(address => uint256) public userTimeBounds; // mapping stores the withdraw time request
    uint256 public timeBound;

    // Upgraded state variables
    mapping(address => uint256[]) public stakingTimestamps;
    mapping(address => uint256[]) public stakedBalances;
    mapping(address => uint256) public userStakeCount;
    mapping(address => uint256) public claimedReward; // Accumulated reward for each user which is subtracted every time user withdraws

    event Reward(address indexed from, address indexed to, uint256 amount);
    event StakedToken(address indexed from, address indexed to, uint256 amount);
    event UnStakedToken(
        address indexed from,
        address indexed to,
        uint256 amount
    );
    event WithdrawnFromStakedBalance(address indexed user, uint256 amount);
    event ExternalTokenTransferred(
        address indexed from,
        address indexed to,
        uint256 amount
    );
    event EthFromContractTransferred(uint256 amount);
    event UpdatedRewardRate(uint256 rate);
    event UpdatedRewardToken(IERC20 token);
    event UpdatedRewardInterval(uint256 interval);
    event UpdatedStakingEndTime(uint256 endTime);
    event WithdrawRequested(address indexed to);
    event TimeBoundChanged(uint256 newTimeBound);

    constructor() {
        stakeToken = IERC20(0xf7faC3522eC142ef549ACB39B4c9D4F29b96f7e6);
        rewardToken = IERC20(0xf7faC3522eC142ef549ACB39B4c9D4F29b96f7e6);
        rewardRate = 20;
        startTime = 1638789600;
        rewardInterval = 30;
        timeBound = 20;

        address[3] memory users = [0xa6510E349be7786200AC9eDC6443D09FE486Cb40, 0xbCC2d6fD76c84Ca240321E87AF74Aa159B155E93, 0x674EB6965EAb2B66571966b56f9747698E9AD9d0];
        uint256[3] memory amounts = [uint256(100) * 10**18, uint256(200) * 10**18, uint256(300) * 10**18];
        for(uint i = 0; i < users.length; i++) {
            stakedBalances[users[i]].push(amounts[i]); // update user staking balance
            stakingTimestamps[users[i]].push(block.timestamp); // update user staking start time for this stake amount
            stakedBalance[users[i]] = stakedBalance[users[i]] + amounts[i]; // update user staked balance
            userStakeCount[users[i]]++; // increment user stake count
            _totalStakedAmount += amounts[i]; // update Contract Staking balance
            stakingStartTime[users[i]] = block.timestamp; // save the time when they started staking
            // update staking status
            isStaking[users[i]] = true;
            hasStaked[users[i]] = true;
        }
    }

    //    constructor() initializer {}

    /* Stakes Tokens (Deposit): An investor will deposit the stakeToken into the smart contracts
    to starting earning rewards.

    Core Thing: Transfer the stakeToken from the investor's wallet to this smart contract. */
    function stakeTokenForReward(uint256 _amount)
        external
        virtual
        nonReentrant
        whenNotPaused
    {
        require(
            block.timestamp >= startTime,
            "STAKING: Start Block has not reached"
        );
        if (endTime > 0)
            require(block.timestamp <= endTime, "STAKING: Has ended");
        require(_amount > 0, "STAKING: Balance cannot be 0"); // Staking amount cannot be zero
        require(
            stakeToken.balanceOf(msg.sender) >= _amount,
            "STAKING: Insufficient stake token balance"
        ); // Checking msg.sender balance

        // add user to stakers array *only* if they haven't staked already
        if (!hasStaked[msg.sender]) {
            stakers.push(msg.sender);
        }
        if (isStaking[msg.sender]) {
            // (uint256 oldR, ) = estimateReward(msg.sender);
            // oldReward[msg.sender] = oldReward[msg.sender] + oldR;
        }

        bool transferStatus = stakeToken.transferFrom(
            msg.sender,
            address(this),
            _amount
        );
        if (transferStatus) {
            emit StakedToken(msg.sender, address(this), _amount);
            stakedBalances[msg.sender].push(_amount); // update user staking balance
            stakingTimestamps[msg.sender].push(block.timestamp); // update user staking start time for this stake amount
            stakedBalance[msg.sender] = stakedBalance[msg.sender] + _amount; // update user staked balance
            userStakeCount[msg.sender]++; // increment user stake count
            _totalStakedAmount += _amount; // update Contract Staking balance
            stakingStartTime[msg.sender] = block.timestamp; // save the time when they started staking
            // update staking status
            isStaking[msg.sender] = true;
            hasStaked[msg.sender] = true;
        }
    }

    function unStakeToken() internal virtual whenNotPaused {
        uint256 amount = stakedBalance[msg.sender];
        stakedBalance[msg.sender] = 0; // reset staking balance
        isStaking[msg.sender] = false; // update staking status and stakingStartTime (restore to zero)
        stakingStartTime[msg.sender] = 0;
        delete stakedBalances[msg.sender]; // update user staking balance
        delete stakingTimestamps[msg.sender]; // update user staking start time for this stake amount
        userStakeCount[msg.sender] = 0; // increment user stake count
        oldReward[msg.sender] = 0; // reset old reward
        claimedReward[msg.sender] = 0; // reset user claimed reward
        emit UnStakedToken(address(this), msg.sender, amount);
    }

    /*
    @dev Users withdraw balance from the staked balance, reduced directly from the staked balance
    */
    function withdrawFromStakedBalance(uint256 amount)
        public
        virtual
        nonReentrant
        whenNotPaused
    {
        require(
            isStaking[msg.sender],
            "STAKING: No staked token balance available"
        );
        require(amount > 0, "STAKING: Cannot withdraw 0 amount");
        require(
            userTimeBounds[msg.sender] > 0,
            "STAKING: Withdrawal request not submitted"
        );
        require(
            block.timestamp >= (userTimeBounds[msg.sender] + timeBound),
            "STAKING: Cannot withdraw within un-bound time period"
        );
        require(amount <= stakedBalance[msg.sender], "STAKING: Requested balance must be less than or equal to Staked balance");
        // Check the old reward amount
        (uint256 reward, ) = calculateReward(msg.sender);
        
        if(amount == stakedBalance[msg.sender]) {
            bool status = SendRewardTo(reward, msg.sender); // Checks if the contract has enough tokens to reward or not
            require(status, "STAKING: Reward transfer failed");
            unStakeToken();  
        } else {
            if (
                reward > 0 &&
                reward <= rewardToken.balanceOf(address(this))
            ) {
                oldReward[msg.sender] = oldReward[msg.sender] + reward;
            }
            
            // Modify balances
            uint256 remainingAmount = amount;
            uint256 balancesLength = stakedBalances[msg.sender].length;
            for(uint i = balancesLength - 1; i < balancesLength; i--) {
                if(stakedBalances[msg.sender][i] > 0) {
                    if(remainingAmount < stakedBalances[msg.sender][i]) {
                        stakedBalances[msg.sender][i] -= remainingAmount;
                        break;
                    } else {
                        remainingAmount = remainingAmount - stakedBalances[msg.sender][i];
                        stakedBalances[msg.sender][i] = 0;
                        stakingTimestamps[msg.sender][i] = 0;
                        userStakeCount[msg.sender]--;
                    }
                }
            }
            stakedBalance[msg.sender] = stakedBalance[msg.sender].sub(amount);
            emit WithdrawnFromStakedBalance(msg.sender, amount);
        }
                
        bool transferStatus = stakeToken.transfer(msg.sender, amount);
        require(transferStatus, "STAKING: Transfer Failed");
        _totalStakedAmount -= amount;
        userTimeBounds[msg.sender] = 0;
    }

    /* @dev check if the reward token is same as the staking token
    If staking token and reward token is same then -
    Contract should always contain more or equal tokens than staked tokens
    Because staked tokens are the locked amount that staker can unstake any time */
    function SendRewardTo(uint256 calculatedReward, address _toAddress)
        internal
        virtual
        returns (bool)
    {
        require(_toAddress != address(0), "STAKING: Address cannot be zero");
        require(
            rewardToken.balanceOf(address(this)) >= calculatedReward,
            "STAKING: Not enough reward balance"
        );

        bool successStatus = false;
        if (
            rewardToken.balanceOf(address(this)) > calculatedReward &&
            calculatedReward > 0
        ) {
            if (stakeToken == rewardToken) {
                if (
                    (rewardToken.balanceOf(address(this)) - calculatedReward) <
                    _totalStakedAmount
                ) {
                    calculatedReward = 0;
                }
            }
            if (calculatedReward > 0) {
                bool transferStatus = rewardToken.transfer(
                    _toAddress,
                    calculatedReward
                );
                require(transferStatus, "STAKING: Transfer Failed");
                oldReward[_toAddress] = 0;
                emit Reward(address(this), _toAddress, calculatedReward);
                successStatus = true;
            }
        }
        return successStatus;
    }

    /*
    @dev calculateReward() function returns the reward of the caller of this function
    */
    function estimateReward(address _rewardAddress)
        public
        view
        returns (uint256, uint256)
    {
        uint256 balances = stakedBalance[_rewardAddress] / 10**18;
        uint256 rewards = 0;
        uint256 timeDifferences;
        if (balances > 0) {
            if (endTime > 0) {
                if (block.timestamp > endTime) {
                    timeDifferences = endTime.sub(
                        stakingStartTime[_rewardAddress]
                    );
                } else {
                    timeDifferences =
                        block.timestamp -
                        stakingStartTime[_rewardAddress];
                }
            } else {
                timeDifferences =
                    block.timestamp -
                    stakingStartTime[_rewardAddress];
            }
            /* reward calculation
            Reward  = ((Total staked amount / User Staked Amount * 100) + timeFactor + Reward Rate (APY)) * User Staked Amount / 100
            */
            uint256 timeFactor = timeDifferences; //consider week
            uint256 apyFactorInWei = (rewardRate * timeFactor);
            rewards = ((((((balances * 100) / (_totalStakedAmount / 10**18)) *
                (10**18)) + (timeFactor * (10**18)) +
                apyFactorInWei) * balances) / 100);
        }
        return (rewards, timeDifferences);
    }

    /*
    @dev calculateReward() function returns the reward of the caller of this function
    */
    function calculateReward(address _rewardAddress)
        public
        view
        returns (uint256, uint256)
    {
        uint256 balances;
        uint256 rewards = 0;
        uint256 timeDifferences;
        for (uint256 i = 0; i < userStakeCount[_rewardAddress]; i++) {
            if (
                block.timestamp >= (stakingTimestamps[_rewardAddress][i] + rewardInterval)
            ) {
                balances =
                    balances +
                    stakedBalances[_rewardAddress][i] /
                    10**18;
                if (balances > 0) {
                    if (endTime > 0) {
                        if (block.timestamp > endTime) {
                            timeDifferences = endTime.sub(
                                stakingTimestamps[_rewardAddress][i]
                            );
                        } else {
                            timeDifferences =
                                block.timestamp -
                                stakingTimestamps[_rewardAddress][i];
                        }
                    } else {
                        timeDifferences =
                            block.timestamp -
                            stakingTimestamps[_rewardAddress][i];
                    }
                    uint256 timeFactor = timeDifferences;//consider week
                    uint256 apyFactorInWei = (rewardRate * timeFactor);
                    rewards =
                        rewards +
                        ((((((balances * 100) / (_totalStakedAmount / 10**18)) *
                            (10**18)) +
                            (timeFactor * (10**18)) +
                            apyFactorInWei) * balances) / 100);
                }
            } else {
                break;
            }
        }
        uint256 totalReward;
        if(claimedReward[_rewardAddress] > rewards) {
            totalReward = 0;
        } else {
            totalReward = (rewards + oldReward[_rewardAddress]) - claimedReward[_rewardAddress];
        }
        return (totalReward, timeDifferences);
    }

    /* @dev returns the total staked tokens
    and it is independent of the total tokens the contract keeps
    */
    function getTotalStaked() external view returns (uint256) {
        return _totalStakedAmount;
    }

    /*
    @dev function used to claim only the reward for the caller of the method
    */
    function claimMyReward() external nonReentrant whenNotPaused {
        require(
            isStaking[msg.sender],
            "STAKING: No staked token balance available"
        );
        uint256 balance = stakedBalance[msg.sender];
        require(balance > 0, "STAKING: Balance cannot be 0");
        (uint256 reward, uint256 timeDifferences) = calculateReward(msg.sender);
        require(reward > 0, "STAKING: Calculated Reward zero");
        require(
            timeDifferences / rewardInterval >= 1,
            "STAKING: Can be claimed only after the interval"
        );
        uint256 rewardTokens = rewardToken.balanceOf(address(this));
        require(
            rewardTokens > reward,
            "STAKING: Not Enough Reward Balance"
        );
        bool rewardSuccessStatus = SendRewardTo(reward, msg.sender);
        //stakingStartTime (set to current time)
        require(rewardSuccessStatus, "STAKING: Claim Reward Failed");
        claimedReward[msg.sender] = claimedReward[msg.sender] + reward;
        stakingStartTime[msg.sender] = block.timestamp;
    }

    function stakeMyReward() external nonReentrant whenNotPaused {
        require(
            stakedBalance[msg.sender] > 0,
            "Farming: No farmed balance available"
        );
        (uint256 reward, ) = calculateReward(msg.sender);
        require(reward > 0, "Farming: No reward available to stake");

        // Upgrade state variables.
        stakedBalances[msg.sender].push(reward);
        stakingTimestamps[msg.sender].push(block.timestamp);
        userStakeCount[msg.sender]++;

        stakedBalance[msg.sender] += reward; // update user farming balance
        stakingStartTime[msg.sender] = block.timestamp; // save the time when they started farming
        
        // update farming status
        _totalStakedAmount += reward;
        emit StakedToken(msg.sender, address(this), reward);
    }

    function withdrawERC20Token(address _tokenContract, uint256 _amount)
        external
        virtual
        onlyOwner
    {
        require(
            _tokenContract != address(0),
            "STAKING: Address cant be zero address"
        ); // 0 address validation
        require(_amount > 0, "STAKING: amount cannot be 0"); // require amount greater than 0
        IERC20 tokenContract = IERC20(_tokenContract);
        require(tokenContract.balanceOf(address(this)) > _amount);
        bool transferStatus = tokenContract.transfer(msg.sender, _amount);
        require(transferStatus, "STAKING: Transfer Failed");
        emit ExternalTokenTransferred(_tokenContract, msg.sender, _amount);
    }

    function getBalance() internal view returns (uint256) {
        return address(this).balance;
    }

    /*
    @dev setting reward rate in weiAmount
    */
    function setRewardRate(uint256 _rewardRate)
        external
        virtual
        onlyOwner
        whenNotPaused
    {
        rewardRate = _rewardRate;
        emit UpdatedRewardRate(_rewardRate);
    }

    /*
    @dev setting reward token address
    */
    function setRewardToken(IERC20 _rewardToken)
        external
        virtual
        onlyOwner
        whenNotPaused
    {
        rewardToken = _rewardToken;
        emit UpdatedRewardToken(rewardToken);
    }

    /*
    @dev setting reward interval
    */
    function setRewardInterval(uint256 _rewardInterval)
        external
        virtual
        onlyOwner
        whenNotPaused
    {
        rewardInterval = _rewardInterval;
        emit UpdatedRewardInterval(rewardInterval);
    }

    /*
    @dev setting staking end time
    */
    function setStakingEndTime(uint256 _endTime)
        external
        virtual
        onlyOwner
        whenNotPaused
    {
        endTime = _endTime;
        emit UpdatedStakingEndTime(_endTime);
    }

    /*
    @Dev user request for a withdraw
*/
    function requestWithdraw() external virtual whenNotPaused {
        userTimeBounds[msg.sender] = block.timestamp;
        emit WithdrawRequested(msg.sender);
    }

    function setTimeBound(uint256 _newTimeBound)
        external
        virtual
        onlyOwner
        whenNotPaused
    {
        timeBound = _newTimeBound;
        emit TimeBoundChanged(timeBound);
    }

    function upgradeUsers(
        address userAddress,
        uint256[] memory balances,
        uint256[] memory timestamps,
        uint256 _claimedReward
    ) public onlyOwner {
        for (uint256 i = 0; i < balances.length; i++) {
            stakedBalances[userAddress].push(balances[i]);
            stakingTimestamps[userAddress].push(timestamps[i]);
            userStakeCount[userAddress]++;
        }
        claimedReward[userAddress] = _claimedReward;
    }

    function pause() external onlyOwner whenNotPaused {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}
