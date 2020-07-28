pragma solidity ^0.5.0;

import "./utility/SafeMath.sol";
import "./utility/Owned.sol";
import "./utility/TokenHandler.sol";

import "./interfaces/ILPToken.sol";
import "./interfaces/IVault.sol";
import "./interfaces/IERC20.sol";
import "./interfaces/IStakingPool.sol";
import "./interfaces/IOwned.sol";
import "./interfaces/ISynthetix.sol";


contract StakingPool is IStakingPool, TokenHandler, Owned {

    using SafeMath for uint256;
    string public name;

    IVault public vault;
    ILPToken public lpToken;
    ISynthetix public oks;

    uint256 public exchangeRate;

    address public oldAddress; // previous staking pool version address, if the address equal zero then it is the initial version
    address public newAddress; // previous staking pool version
    address public stakingPoolFactory;

    uint256 private version = 1;

    constructor(
        string memory _name,
        address _spf, // staking pool factory proxy address
        address _oldAddress, // previous staking pool version address, if the address equal zero then it is the initial version
        address _vault,
        address _lpToken,
        address _oks,
        address _owner) public Owned(_owner)
    {
        require(_spf != address(0), "StakingPool: staking pool factory is zero address");
        require(_vault != address(0), "StakingPool: vault is zero address");
        require(_lpToken != address(0), "StakingPool: LPToken is zero address");
        require(_oks != address(0), "StakingPool: OKS is zero address");

        name = _name;
        vault = IVault(_vault);
        lpToken = ILPToken(_lpToken);
        oldAddress = _oldAddress;
        stakingPoolFactory = _spf;
        oks = ISynthetix(_oks);
        exchangeRate = 10**18;
    }

    function() external payable {
    }

    modifier isActive() {
        require(newAddress == address(0), "StakingPool: upgraded");
        _;
    }

    modifier isUpgraded() {
        require(newAddress != address(0), "StakingPool: pool not upgraded");
        require(msg.sender == newAddress, "StakingPool: address not allowed");
        _;
    }

    modifier onlyPreviousVersion() {
        require(oldAddress == msg.sender, "StakingPool: address not allowed");
        _;
    }

    modifier isStakingPoolFactory() {
        require(msg.sender != stakingPoolFactory, "StakingPool: only staking pool factory is allowed");
        _;
    }

    function getVersion() public view returns(uint256) {
        return version;
    }

    function upgrade(address _stakingPool) public isStakingPoolFactory {
        require(newAddress == address(0), "StakingPool: contract already upgraded");
        require(IStakingPool(_stakingPool).getVersion() > version, "StakingPool: staking pool version has to be higher");
        newAddress = _stakingPool;
        IOwned(address(vault)).nominateNewOwner(_stakingPool);
        IOwned(address(lpToken)).nominateNewOwner(_stakingPool);
        IStakingPool(_stakingPool).acceptOwnership(address(vault));
        IStakingPool(_stakingPool).acceptOwnership(address(lpToken));
        IStakingPool(_stakingPool).setExchangeRate(exchangeRate);
    }

    function transferTokenBalance(address _token) public isUpgraded {
        _safeTransfer(_token, newAddress, IERC20(_token).balanceOf(address(this)));
    }

    function transferTrxBalance() public isUpgraded {
        address payable addr = address(this);
        addr.transfer(newAddress.balance);
    }

    function acceptOwnership(address _addr) public onlyPreviousVersion {
        IOwned(_addr).acceptOwnership();
    }

    function setExchangeRate(uint256 _exchangeRate) public onlyPreviousVersion {
        exchangeRate = _exchangeRate;
    }
}


