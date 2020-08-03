
pragma solidity ^0.5.0;

import "../StakingPoolFactory.sol";


contract StakingPoolFactoryMock is StakingPoolFactory {

    constructor(
        address _factoryStorage, // Staking pool factory storage
        address payable _proxy, // Staking pool factory proxy
        address _owner // Staking pool factory owner address
    ) 
        public
        StakingPoolFactory(_factoryStorage, _proxy, _owner)
    {
        version = 2;
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
            new StakingPool(
                _name,
                address(proxy),
                _oldPool,
                _vault,
                _lpToken,
                factoryStorage.getOKS(),
                2,
                _owner
            )
        );
    }
}