pragma solidity ^0.5.0;


interface IFeePool  {
	function claimFees() external returns (bool);
}
