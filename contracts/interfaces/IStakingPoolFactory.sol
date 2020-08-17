
pragma solidity ^0.5.0;

interface IStakingPoolFactory {
	function getVersion() external view returns(uint256);
    function getStakingPools() external view returns(address[] memory);
	function getFactoryStorage() external view returns(address);

    function setOKS(address _oks) external;
    function setUniswapFactory(address _unifactory) external;

    function deployStakingPool(string calldata _name, address _vault, address _lpToken, address _owner) external;
	function addStakingPool(string calldata _name, address _vault, address _lpToken, address payable _stakingPool, address _owner) external;

    function upgradeStakingPool(address payable _pool) external;
    function replaceStakingPool(address payable _oldPool, address payable _newPool) external;

    function upgradeFactory(address _facotry) external;
    function acceptContractOwnership(address _addr) external;
}


