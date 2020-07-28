pragma solidity ^0.5.0;


interface IStakingPoolFactoryStorage {

    function setOKS(address _oks) external;
    function getOKS() external view returns(address);

    function addStakingPool(address _pool) external;
    function removeStakingPool(address _pool) external;

    function getStakingPools() external view returns(address[] memory);
    function getStakingPool(uint256 _index) external view returns(address);
    function getStakingPoolIndex(address _pool) external view returns(uint256);
}