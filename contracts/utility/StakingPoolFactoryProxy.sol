
pragma solidity ^0.5.0;

import "./Proxy.sol";
import "../interfaces/IStakingPoolFactory.sol";


contract StakingPoolFactoryProxy is Proxy {

    constructor(address _owner)
        public
        Proxy(_owner)
    {
    }

    function getVersion() public view returns(uint256) {
        return IStakingPoolFactory(address(target)).getVersion();
    }

    function getFactoryStorage() public view returns(address) {
        return IStakingPoolFactory(address(target)).getFactoryStorage();
    }

    function getStakingPools() public view returns(address[] memory) {
        return IStakingPoolFactory(address(target)).getStakingPools();
    }
}
