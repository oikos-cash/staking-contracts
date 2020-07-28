pragma solidity ^0.5.0;

interface IVault {
    function safeApprove(address _token, address _spender, uint256 _amount) external;
    function safeTransfer(address _token, address _to, uint256 _amount) external;
    function safeTransferFrom(address _token, address _from, address _to, uint256 _amount) external;
    function safeTransferTrx(address payable _to, uint256 _amount) external;
    function getStakingPool() external view returns(address);
}


