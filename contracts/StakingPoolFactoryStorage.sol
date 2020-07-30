pragma solidity ^0.5.0;

import "./utility/Owned.sol";
import "./interfaces/IStakingPoolFactoryStorage.sol";


// TO DO: cross check index values

contract StakingPoolFactoryStorage is IStakingPoolFactoryStorage, Owned {

    mapping(address => uint256) private stakingPoolIndex;
    address[] private stakingPools;
    address private oks;

    constructor(address _oks)
        public
        Owned(msg.sender)
    {
        require(_oks != address(0), "StakingPoolFactoryStorage: OKS is zero address");
        oks = _oks;
    }

    function setOKS(address _oks)
        public
        onlyOwner
    {
        require(_oks != address(0), "StakingPoolFactoryStorage: OKS is zero address");
        oks = _oks;
    }

    function getOKS() public view returns(address) {
        return oks;
    }

    function addStakingPool(address _pool)
        public
        onlyOwner
    {
        require(_pool != (address(0)), "StakingPoolFactoryStorage: pool is zero address");
        stakingPools.push(_pool);
        stakingPoolIndex[_pool] = stakingPools.length;
    }

    function removeStakingPool(address _pool)
        public
        onlyOwner
    {
        uint index = stakingPoolIndex[_pool];
        require(index != 0, "StakingPoolFactoryStorage: pool is not listed");

        uint256 length = stakingPools.length;
        address lastPool = stakingPools[length-1];

        stakingPoolIndex[_pool] = 0;
        stakingPools[index-1] = lastPool;
        stakingPoolIndex[lastPool] = index;
        delete stakingPools[length-1];
        stakingPools.length = length - 1;
    }

    function getStakingPools() public view returns(address[] memory) {
        return stakingPools;
    }

    function getStakingPool(uint256 _index) public view returns(address) {
        require(_index < stakingPools.length, "StakingPoolFactoryStorage: index out of bound");
        return stakingPools[_index];
    }

    function getStakingPoolIndex(address _pool) public view returns(uint256) {
        require(stakingPoolIndex[_pool] != 0, "StakingPoolFactoryStorage: pool is not listed");
        return stakingPoolIndex[_pool] - 1;
    }
}