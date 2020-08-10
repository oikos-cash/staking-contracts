pragma solidity ^0.5.0;

import "./utility/SafeMath.sol";
import "./utility/TokenHandler.sol";
import "./interfaces/IVault.sol";
import "./interfaces/IProxy.sol";
import "./interfaces/IStakingPool.sol";
import "./interfaces/IOwned.sol";
import "./interfaces/IStakingPoolFactory.sol";

import "./DSA.sol";


contract StakingPool is IStakingPool, TokenHandler, DSA {

    using SafeMath for uint256;
    string public name;

    IVault private vault;
    address public stakingPoolFactory;

    address public oldAddress; // previous staking pool version address, if the address equal zero then it is the initial version
    address public newAddress; // previous staking pool version
    uint256 private version = 1;

    constructor(
        string memory _name,
        address _stakingPoolFactory, // staking pool factory proxy address
        address _oldAddress, // previous staking pool version address, if the address equal zero then it is the initial version
        address _vault,
        address _lpToken,
        address _oks,
        uint256 _version,
        address _owner
    )
        public
        DSA(
            _oks,
            _lpToken,
            _owner
        )
    {
        require(_stakingPoolFactory != address(0), "StakingPool: staking pool factory is zero address");
        require(_oldAddress != address(0), "StakingPool: previous pool address is zero address");
        require(_vault != address(0), "StakingPool: vault is zero address");
        name = _name;
        vault = IVault(_vault);
        oldAddress = _oldAddress;
        version = _version;
        stakingPoolFactory = _stakingPoolFactory;
    }

    function() external payable {
    }

    modifier isActive() {
        require(newAddress == address(0), "StakingPool: upgraded");
        _;
    }

    modifier isUpgraded() {
        require(newAddress != address(0), "StakingPool: pool not upgraded");
        // require(msg.sender == newAddress, "StakingPool: address not allowed");
        _;
    }

    modifier onlyPreviousVersion() {
        require(oldAddress == msg.sender, "StakingPool: address not allowed");
        _;
    }

    modifier isStakingPoolFactory() {
        require(msg.sender == IProxy(stakingPoolFactory).target(), "StakingPool: only staking pool factory is allowed to upgrade");
        _;
    }

    function notifyRewardAmount(uint256 _reward)
        public
        isActive
    {
        super.notifyRewardAmount(_reward);
    }

    function stake(uint256 _amount)
        public
        isActive
    {
        super.stake(_amount);
    }

    function withdraw(uint256 _sAmount)
        public
        isActive
    {
        super.withdraw(_sAmount);
    }

    // manager functionsn

    /**
     * @notice Issue synths against the stakinPool's OKS.
     * @dev Issuance is only allowed by staking pool's owner.
     * @param _amount The amount of synths you wish to issue.
     */
    function issueSynths(uint256 _amount)
        public
        onlyOwner
    {
        ISynthetix(oks).issueSynths(_amount);
    }

    /**
     * @notice Issue the maximum amount of Synths possible against the stakinPool's OKS.
     * @dev Issuance is only allowed by staking pool's owner.
     */
    function issueMaxSynths()
        public
        onlyOwner
    {
        ISynthetix(oks).issueMaxSynths();
    }

    /**
     * @notice Function that allows you to exchange synths you hold in one flavour for another.
     * @param _sourceCurrencyKey The source currency you wish to exchange from
     * @param _sourceAmount The amount if the source currency you wish to exchange
     * @param _destinationCurrencyKey The destination currency you wish to obtain.
     */
    function exchange(bytes32 _sourceCurrencyKey, uint _sourceAmount, bytes32 _destinationCurrencyKey)
        public
        onlyOwner
    {
        ISynthetix(oks).exchange(_sourceCurrencyKey, _sourceAmount, _destinationCurrencyKey);
    }

    // upgrade functions

    function upgrade(address payable _stakingPool) public isStakingPoolFactory {
        IStakingPool sp = IStakingPool(_stakingPool);
        require(newAddress == address(0), "StakingPool: contract already upgraded");
        require(sp.getVersion() > version, "StakingPool: staking pool version has to be higher");
        newAddress = _stakingPool;
        IOwned(address(vault)).nominateNewOwner(_stakingPool);
        IOwned(address(lpToken)).nominateNewOwner(_stakingPool);
        sp.acceptOwnership(address(vault));
        sp.acceptOwnership(address(lpToken));
        sp.setExchangeRate(exchangeRate);
    }

    function transferTokenBalance(address _token) public isUpgraded {
        _safeTransfer(_token, newAddress, ILPToken(_token).balanceOf(address(this)));
    }

    function transferTrxBalance() public isUpgraded {
        address payable addr = address(uint160(newAddress));
        addr.transfer(address(this).balance);
    }

    function acceptOwnership(address _addr) public onlyPreviousVersion {
        IOwned(_addr).acceptOwnership();
    }

    function setExchangeRate(uint256 _exchangeRate) public onlyPreviousVersion {
        exchangeRate = _exchangeRate;
    }

    // view functions

    function getVault() public view returns(address) {
        return address(vault);
    }

    function getVersion() public view returns(uint256) {
        return version;
    }
}