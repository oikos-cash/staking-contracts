pragma solidity ^0.5.0;

import "./utility/SafeMath.sol";
import "./utility/TokenHandler.sol";

import "./interfaces/IVault.sol";
import "./interfaces/IOwned.sol";
import "./interfaces/IStakingPoolFactory.sol";
import "./interfaces/IStakingPoolFactoryStorage.sol";
import "./interfaces/IUniswapFactory.sol";
import "./interfaces/IUniswapExchange.sol";

import "./DSA.sol";


contract StakingPool is TokenHandler, DSA {

    using SafeMath for uint256;
    string public name;

    IVault private vault;
    address public factory;
    IStakingPoolFactoryStorage private factoryStorage;

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
        factory = _stakingPoolFactory;
        factoryStorage = IStakingPoolFactoryStorage(IStakingPoolFactory(factory).getFactoryStorage());
    }

    function() external payable {
        require(msg.data.length == 0, "Only TRX deposit is allowed");
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
        require(msg.sender == IProxy(factory).target(), "StakingPool: only staking pool factory is allowed to upgrade");
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
    function synthExchange(bytes32 _sourceCurrencyKey, uint _sourceAmount, bytes32 _destinationCurrencyKey)
        public
        onlyOwner
    {
        ISynthetix(oks).exchange(_sourceCurrencyKey, _sourceAmount, _destinationCurrencyKey);
    }

    /**
    * @notice Deposit TRX && Tokens (token) at current ratio to mint UNI tokens in the selected pool.
    * @dev min_liquidity does nothing when total UNI supply is 0.
    * @param _token address used in the exchange to add liquidity to.
    * @param _min_liquidity Minimum number of UNI sender will mint if total UNI supply is greater than 0.
    * @param _max_tokens Maximum number of tokens deposited. Deposits max amount if total UNI supply is 0.
    * @return The amount of UNI minted.
    */
    function addLiquidity(address _token, uint256 _min_liquidity, uint256 _max_tokens)
        public
        payable
        onlyOwner
        returns (uint256)
    {

        IUniswapExchange uniExchange = IUniswapExchange(
            IUniswapFactory(factoryStorage.getUniswapFactory()).getExchange(_token)
        );
        _safeApprove(_token, address(uniExchange), _max_tokens);
        uint256 deadline = block.timestamp + 10 minutes;
        return uniExchange.addLiquidity.value(msg.value)(_min_liquidity, _max_tokens, deadline);
    }

    /**
    * @dev Burn UNI tokens to withdraw TRX && Tokens at current ratio.
    * @param _token address used in the exchange to remove liquidity from
    * @param _amount Amount of UNI burned.
    * @param _min_trx Minimum TRX withdrawn.
    * @param _min_tokens Minimum Tokens withdrawn.
    * @return The amount of TRX && Tokens withdrawn.
    */
    function removeLiquidity(address _token, uint256 _amount, uint256 _min_trx, uint256 _min_tokens)
        public
        onlyOwner
        returns (uint256 trxWithdrawn, uint256 tokensWithdraw)
    {
        IUniswapExchange uniExchange = IUniswapExchange(
            IUniswapFactory(factoryStorage.getUniswapFactory()).getExchange(_token)
        );
        uint256 deadline = block.timestamp + 10 minutes;
        (trxWithdrawn, tokensWithdraw) = uniExchange.removeLiquidity(_amount, _min_trx, _min_tokens, deadline);
    }

    function execute(address _contract, bytes memory _data, uint256 _value)
        public
        onlyOwner
    {
        require(factoryStorage.isAllowedMethod(_contract,getMethodID(_data)), "StakingPool: the method is not allowed for the provided address");
        (bool success, ) = _contract.call.value(_value)(_data);
        require(success, "StakingPool: low level call throw");
    }

    // upgrade functions
    function upgrade(address payable _stakingPool) public isStakingPoolFactory {
        StakingPool sp = StakingPool(_stakingPool);
        require(newAddress == address(0), "StakingPool: contract already upgraded");
        require(sp.getVersion() > version, "StakingPool: staking pool version has to be higher");
        newAddress = _stakingPool;
        IOwned(address(vault)).nominateNewOwner(_stakingPool);
        IOwned(address(lpToken)).nominateNewOwner(_stakingPool);
        sp.acceptContractOwnership(address(vault));
        sp.acceptContractOwnership(address(lpToken));
        sp.setExchangeRate(exchangeRate);
    }

    function transferTokenBalance(address _token) public isUpgraded {
        _safeTransfer(_token, newAddress, ILPToken(_token).balanceOf(address(this)));
    }

    function transferTrxBalance() public isUpgraded {
        address payable addr = address(uint160(newAddress));
        addr.transfer(address(this).balance);
    }

    function acceptContractOwnership(address _addr) public onlyPreviousVersion {
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

    function getMethodID(bytes memory _data) internal pure returns (bytes4) {
        return (bytes4(_data[0]) | bytes4(_data[1]) >> 8 | bytes4(_data[2]) >> 16 | bytes4(_data[3]) >> 24);
    }
}