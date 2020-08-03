pragma solidity ^0.5.0;

import "./utility/SafeMath.sol";
import "./utility/Owned.sol";

import "./interfaces/IFeePool.sol";
import "./interfaces/IRewardEscrow.sol";
import "./interfaces/ILPToken.sol";
import "./interfaces/ISynthetix.sol";
import "./interfaces/IStakingPoolFactory.sol";
import "./interfaces/IStakingPoolFactoryStorage.sol";
import "./interfaces/IRewardDistributionRecipient.sol";


contract DSA is Owned, IRewardDistributionRecipient {

	using SafeMath for uint256;
    ILPToken internal lpToken;
    ISynthetix internal oks;

    IStakingPoolFactory public stakingPoolFactory;

    uint256 internal exchangeRate;
    uint256 internal denominator;
    uint256 internal lastExRateUpdate;
    uint256 internal lastUpdate;
    uint256 internal DURATION = 7 days;
    uint256 internal rewardPerSec;
    uint256 internal rewardLeft;

    constructor(
        address _oks,
        address _lpToken,
        address _owner,
        address _stakingPoolFactory
    )
        public
        Owned(_owner)
    {
        require(_stakingPoolFactory != address(0), "DSA: reward distribution is zero address");
        require(_lpToken != address(0), "DSA: LPToken is zero address");
        require(_oks != address(0), "DSA: OKS is zero address");

        lpToken = ILPToken(_lpToken);
        oks = ISynthetix(_oks);
        exchangeRate = 10**18;
        denominator =  10**18;
        lastUpdate = block.timestamp;
        lastExRateUpdate = block.timestamp;
        stakingPoolFactory = IStakingPoolFactory(_stakingPoolFactory);
    }

    modifier updateExchangeRate() {
        uint256 intervalReward = rewardPerSec.mul(block.timestamp.sub(lastExRateUpdate));
        if(intervalReward > rewardLeft) {
            intervalReward = rewardLeft;
            rewardLeft = 0;
        } else {
            rewardLeft = rewardLeft.sub(intervalReward);
        }
        exchangeRate = exchangeRate.add(intervalReward.mul(denominator).div(lpToken.totalSupply()));
        lastExRateUpdate = block.timestamp;
        _;
    }

    modifier onlyRewardDistribution() {
        require(
            msg.sender == oks.rewardsDistribution(),
            "DSA: only reward distribution contract is allowed"
        );
        _;
    }
    
    function stake(uint256 _amount)
    	public
    	updateExchangeRate
    {
    	require(oks.transferFrom(msg.sender,address(this),_amount), "DSA: OKS deposit failed");
    	uint256 amountToMint = _amount.mul(denominator).div(exchangeRate);
    	require(lpToken.mint(msg.sender, amountToMint), "DSA: cannot mint LP tokens");
    }

    function withdraw(uint256 _sAmount)
    	public
    	updateExchangeRate
    {
    	require(lpToken.burn(msg.sender, _sAmount), "DSA: cannot burn LP tokens");
    	uint256 amountToRelease = _sAmount.mul(exchangeRate).div(denominator);
    	require(oks.transfer(msg.sender, amountToRelease), "DSA: cannot transfer OKS tokens");
    }

    function notifyRewardAmount(uint256 _reward)
        public
        onlyRewardDistribution
    {
        _notifyRewardAmount(_reward);
    }

    function _notifyRewardAmount(uint256 _reward)
        internal
        updateExchangeRate
    {
        uint256 periodEnd = lastUpdate.add(DURATION);
        if (block.timestamp >= periodEnd) {
            rewardLeft = _reward;
            rewardPerSec = _reward.div(DURATION);
        } else {
            uint256 m_rewardLeft = rewardLeft;
            m_rewardLeft = m_rewardLeft.add(_reward);
            rewardPerSec = m_rewardLeft.div(DURATION);
            rewardLeft = m_rewardLeft;
        }
        lastUpdate = block.timestamp;
    }

    function claimFees() public {
        IFeePool(oks.feePool()).claimFees();
    }

    function withdrawEscrowedReward() public {
        uint256 balance = oks.balanceOf(address(this));
        IRewardEscrow(oks.rewardEscrow()).vest();
        uint256 reward = oks.balanceOf(address(this)).sub(balance);
        _notifyRewardAmount(reward);
    }

    function getLPToken() public view returns(address) {
        return address(lpToken);
    }
}