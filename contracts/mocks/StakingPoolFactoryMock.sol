
pragma solidity ^0.5.0;

import "../utility/Proxyable.sol";
import "../mocks/StakingPoolMock.sol";

import "../interfaces/IVault.sol";
import "../interfaces/IOwned.sol";
import "../interfaces/ILPToken.sol";
import "../interfaces/IStakingPoolFactory.sol";
import "../interfaces/IStakingPoolFactoryStorage.sol";


contract StakingPoolFactoryMock is IStakingPoolFactory, Proxyable {

    uint256 private version = 2;
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
        address _owner
    )
        public
        isNotUpgraded
        optionalProxy_onlyOwner
    {
        StakingPoolMock stakingPool = StakingPoolMock(
            createStakingPool(
                _name,
                address(this),
                _vault,
                _lpToken,
                _owner
            )
        );

        IVault(_vault).nominateNewOwner(address(stakingPool));
        ILPToken(_lpToken).nominateNewOwner(address(stakingPool));

        stakingPool.acceptOwnership(_vault);
        stakingPool.acceptOwnership(_lpToken);

        factoryStorage.addStakingPool(address(stakingPool));
    }

    function upgradeStakingPool(address payable _pool)
        public
        isNotUpgraded
        optionalProxy_onlyOwner
    {

        factoryStorage.getStakingPoolIndex(_pool);

        StakingPoolMock oldPool = StakingPoolMock(_pool);
        StakingPoolMock newPool = StakingPoolMock(
            createStakingPool(
                oldPool.name(),
                _pool,
                address(oldPool.getVault()),
                address(oldPool.getLPToken()),
                oldPool.owner()
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
        address _owner
    )
        internal
        returns (address payable)
    {
        return address(
            new StakingPoolMock(
                _name,
                address(proxy),
                _oldPool,
                _vault,
                _lpToken,
                factoryStorage.getOKS(),
                _owner
            )
        );
    }
}
// pragma solidity ^0.5.0;

// import "../StakingPoolFactory.sol";
// import "./StakingPoolMock.sol";


// contract StakingPoolFactoryMock is StakingPoolFactory {

//     constructor(
//      address _factoryStorage, // Staking pool factory storage
//      address payable _proxy, // Staking pool factory proxy
//      address _owner // Staking pool factory owner address
//     )
//      public
//      StakingPoolFactory(_factoryStorage, _proxy, _owner)
//     {
//     }

//     function getVersion() public view returns(uint256) {
//         return super.getVersion() + 1;
//     }

//     function createStakingPool(
//         string memory _name,
//         address _vault,
//         address _lpToken,
//         address _owner
//     ) internal returns (address payable) {
//         return address(new StakingPoolMock(
//             _name,
//             address(proxy),
//             address(this),
//             _vault,
//             _lpToken,
//             factoryStorage.getOKS(),
//             _owner
//         ));
//     }
// }
