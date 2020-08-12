pragma solidity ^0.5.0;

import "./utility/Owned.sol";


contract StakingPoolFactoryStorage is Owned {

    mapping(address => uint256) private stakingPoolIndex;
    address[] private stakingPools;
    address private oks;
    address private uniswapFactory;

    constructor()
        public
        Owned(msg.sender)
    {
    }

    function setOKS(address _oks)
        public
        onlyOwner
    {
        require(_oks != address(0), "StakingPoolFactoryStorage: OKS is zero address");
        oks = _oks;
    }

    function setUniswapFactory(address _uniswapFactory)
        public
        onlyOwner
    {
        require(_uniswapFactory != address(0), "StakingPoolFactoryStorage: Uniswap factory is zero address");
        uniswapFactory = _uniswapFactory;
    }

    function getOKS() public view returns(address) {
        return oks;
    }

    function getUniswapFactory() public view returns(address) {
        return uniswapFactory;
    }

    function addStakingPool(address _pool)
        public
        onlyOwner
        returns(bool)
    {
        require(_pool != (address(0)), "StakingPoolFactoryStorage: pool is zero address");
        stakingPools.push(_pool);
        stakingPoolIndex[_pool] = stakingPools.length;
        return true;
    }

    function removeStakingPool(address _pool)
        public
        onlyOwner
        returns(bool)
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
        return true;
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