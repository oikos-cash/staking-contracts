
pragma solidity ^0.5.0;

interface IStakingPoolFactory {
	function getVersion() external view returns(uint256);
    function getStakingPools() external view returns(address[] memory);
	function getFactoryStorage() external view returns(address);

	function acceptOwnership(address _addr) external;
}


