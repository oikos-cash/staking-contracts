
pragma solidity ^0.5.0;

interface IProxy  {
	function target() external returns(address);
}
