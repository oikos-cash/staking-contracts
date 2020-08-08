pragma solidity ^0.5.0;

import "../utility/TokenHandler.sol";
import "../interfaces/IRewardEscrow.sol";


contract RewardEscrowMock is IRewardEscrow, TokenHandler {
    address token;

    constructor(address _token) public {
        token = _token;
    }

    function vest() public {
        _safeTransfer(token, msg.sender, 7*10**18);
    }
}
