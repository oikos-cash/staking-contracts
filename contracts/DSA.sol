pragma solidity ^0.5.0;

import "./utility/SafeMath.sol";
import "./utility/Owned.sol";

import "./interfaces/IProxy.sol";
import "./interfaces/IFeePool.sol";
import "./interfaces/IRewardEscrow.sol";
import "./interfaces/ILPToken.sol";
import "./interfaces/ISynthetix.sol";


contract DSA is Owned {

    using SafeMath for uint256;
    ILPToken internal lpToken;
    address internal oks;

    uint256 public exchangeRate;
    uint256 internal denominator;
    uint256 internal lastExRateUpdate;
    uint256 internal lastUpdate;
    uint256 internal DURATION = 7 days;
    uint256 internal rewardPerSec;
    uint256 public rewardLeft;

    constructor(
        address _oks,
        address _lpToken,
        address _owner
    )
        public
        Owned(_owner)
    {
        require(_lpToken != address(0), "DSA: LPToken is zero address");
        require(_oks != address(0), "DSA: OKS is zero address");
        lpToken = ILPToken(_lpToken);
        oks = _oks;
        exchangeRate = 10**18;
        denominator = 10**18;
        lastUpdate = block.timestamp;
        lastExRateUpdate = block.timestamp;
    }

    modifier updateExchangeRate() {
        uint256 totalSupply = lpToken.totalSupply();
        if (totalSupply > 0) {
            uint256 m_denominator = denominator;
            uint256 intervalReward = rewardPerSec.mul(block.timestamp.sub(lastExRateUpdate)).div(m_denominator);
            uint256 m_rewardLeft = rewardLeft;
            if (intervalReward > m_rewardLeft) {
                intervalReward = m_rewardLeft;
                rewardLeft = 0;
            } else {
                rewardLeft = m_rewardLeft.sub(intervalReward);
            }
            exchangeRate = exchangeRate.add(intervalReward.mul(m_denominator).div(totalSupply));
        }
        lastExRateUpdate = block.timestamp;
        _;
    }

    modifier onlyRewardDistribution() {
        require(
            msg.sender == ISynthetix(IProxy(oks).target()).rewardsDistribution(),
            "DSA: only reward distribution contract is allowed"
        );
        _;
    }

    function stake(uint256 _amount)
    	public
    	updateExchangeRate
    {
        ISynthetix(oks).transferFrom(msg.sender,address(this),_amount);
        uint256 amountToMint = _amount.mul(denominator).div(exchangeRate);
        lpToken.mint(msg.sender, amountToMint);
    }

    function withdraw(uint256 _sAmount)
    	public
    	updateExchangeRate
    {
        lpToken.burn(msg.sender, _sAmount);
        uint256 amountToRelease = _sAmount.mul(exchangeRate).div(denominator);
        ISynthetix(oks).transfer(msg.sender, amountToRelease);
    }

    function notifyRewardAmount(uint256 _reward)
        public
        onlyRewardDistribution
    {
        _notifyRewardAmount(_reward);
    }

    /**
    * @notice Claim fees for last period when available from OIKOS FeePool contract.
    */
    function claimFees() public {
        IFeePool(ISynthetix(IProxy(oks).target()).feePool()).claimFees();
    }

    /**
     * @notice withdraw any OKS in the staking pool schedule that have vested in OIKOS RewardEscrow contract.
     */
    function vest() public {
        ISynthetix oksTarget = ISynthetix(IProxy(oks).target());
        uint256 balance = oksTarget.balanceOf(address(this));
        IRewardEscrow(oksTarget.rewardEscrow()).vest();
        uint256 reward = oksTarget.balanceOf(address(this)).sub(balance);
        _notifyRewardAmount(reward);
    }

    function getLPToken() public view returns(address) {
        return address(lpToken);
    }

    function acceptContractOwnership(address _addr) public onlyOwner {
        IOwned(_addr).acceptOwnership();
    }

    function _notifyRewardAmount(uint256 _reward)
        internal
        updateExchangeRate
    {
        uint256 m_rewardLeft = rewardLeft;
        m_rewardLeft = m_rewardLeft.add(_reward);
        rewardPerSec = m_rewardLeft.mul(denominator).div(DURATION);
        rewardLeft = m_rewardLeft;
    }
}