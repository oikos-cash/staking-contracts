
pragma solidity ^0.5.0;


interface IStakingPool {

    function upgrade(address _stakingPool) external;
    function transferTokenBalance(address _token) external;
    function transferTrxBalance() external;
	function acceptOwnership(address _addr) external;
	function setExchangeRate(uint256 _exchangeRate) external;

	function getVersion() external view returns(uint256);
	function getVault() external view returns(address);
	function getLPToken() external view returns(address);
	// function stake(uint256 _amount) external;
	// function withdraw(uint256 _amount) external;
}


