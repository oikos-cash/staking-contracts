pragma solidity ^0.5.0;

interface IOwned {
	function owner() external;
    function nominateNewOwner(address _owner) external;
	function acceptOwnership() external;
}
