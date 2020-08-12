pragma solidity ^0.5.0;

import "./utility/ERC20.sol";
import "./utility/Owned.sol";
import "./utility/TokenHandler.sol";


contract Vault is Owned, TokenHandler {

    constructor() Owned(msg.sender) public {

    }

    function() external payable {
    }

    function safeApprove(address _token, address _spender, uint256 _amount) public onlyOwner {
        _safeApprove(_token, _spender, _amount);
    }

    function safeTransfer(address _token, address _to, uint256 _amount) public onlyOwner {
        _safeTransfer(_token, _to, _amount);
    }

    function safeTransferFrom(address _token, address _from, address _to, uint256 _amount) public onlyOwner {
        _safeTransferFrom(_token, _from, _to, _amount);
    }

    function safeTransferTrx(address payable _to, uint256 _amount) public onlyOwner {
        _to.transfer(_amount);
    }

    function getStakingPool() public view returns(address) {
        return owner;
    }
}
