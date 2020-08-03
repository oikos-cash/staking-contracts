pragma solidity ^0.5.0;

import "./utility/Proxyable.sol";
import "./StakingPool.sol";

import "./interfaces/IVault.sol";
import "./interfaces/IOwned.sol";
import "./interfaces/ILPToken.sol";
import "./interfaces/IStakingPoolFactory.sol";
import "./interfaces/IStakingPoolFactoryStorage.sol";



contract StakingPoolFactory is IStakingPoolFactory, Proxyable {

    uint256 private version = 1;
    bool public upgraded = false;

    IStakingPoolFactoryStorage public factoryStorage;

    constructor(
        address _factoryStorage, // Staking pool factory storage
        address payable _proxy, // Staking pool factory proxy
        address _owner // Staking pool factory owner address
    )
        public
        Proxyable(_proxy, _owner)
    {
        require(_factoryStorage != address(0), "StakingPoolFactory: factory storage is zero address");
        factoryStorage = IStakingPoolFactoryStorage(_factoryStorage);
    }

    modifier isNotUpgraded() {
        require(!upgraded, "StakingPoolFactory: the factory was upgraded");
        _;
    }

    function deployStakingPool(
        string memory _name,
        address _vault,
        address _lpToken,
        address _owner,
        address _rewardDistributionAddr
    )
    	public
        isNotUpgraded
    	optionalProxy_onlyOwner
    {
        StakingPool stakingPool = StakingPool(
            createStakingPool(
                _name,
                address(this),
                _vault,
                _lpToken,
                _owner,
                _rewardDistributionAddr
            )
        );

        IVault(_vault).nominateNewOwner(address(stakingPool));
        ILPToken(_lpToken).nominateNewOwner(address(stakingPool));

        stakingPool.acceptOwnership(_vault);
        stakingPool.acceptOwnership(_lpToken);

        factoryStorage.addStakingPool(address(stakingPool));
    }

    function upgradeStakingPool(
        address payable _pool,
        address _rewardDistributionAddr
    )
        public
        isNotUpgraded
        optionalProxy_onlyOwner
    {

        factoryStorage.getStakingPoolIndex(_pool);

        StakingPool oldPool = StakingPool(_pool);
        StakingPool newPool = StakingPool(
            createStakingPool(
                oldPool.name(),
                _pool,
                address(oldPool.getVault()),
                address(oldPool.getLPToken()),
                oldPool.owner(),
                _rewardDistributionAddr
            )
        );
        oldPool.upgrade(address(newPool));
        factoryStorage.removeStakingPool(address(oldPool));
        factoryStorage.addStakingPool(address(newPool));
    }

    function disableStakingPool(/*address payable _pool*/)
        public
        isNotUpgraded
        optionalProxy_onlyOwner
    {
        this;
    }

    function upgradeFactory(address _facotry)
        public
        isNotUpgraded
        optionalProxy_onlyOwner
    {
        require(_facotry != address(0), "StakingPoolFactory: FACTORY is zero address");
        require(IStakingPoolFactory(_facotry).getVersion() > version, "StakingPoolFactory: pool factory version has to be higher");
        Owned(address(factoryStorage)).nominateNewOwner(_facotry);
        upgraded = true;
    }

    function acceptOwnership(address _addr)
        public
        isNotUpgraded
        optionalProxy_onlyOwner
    {
        IOwned(_addr).acceptOwnership();
    }

    function getVersion() public view returns(uint256) {
        return version;
    }

    function createStakingPool(
        string memory _name,
        address _oldPool,
        address _vault,
        address _lpToken,
        address _owner,
        address _rewardDistributionAddr
    )
        internal
        returns (address payable)
    {
        return address(
            new StakingPool(
                _name,
                address(proxy),
                _oldPool,
                _vault,
                _lpToken,
                factoryStorage.getOKS(),
                _owner,
                _rewardDistributionAddr
            )
        );
    }
}