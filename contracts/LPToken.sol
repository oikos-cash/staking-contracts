pragma solidity ^0.5.0;

import "./utility/SafeMath.sol";
import "./utility/ERC20.sol";
import "./utility/Owned.sol";
import "./interfaces/ILPToken.sol";


contract LPToken is ILPToken, ERC20, Owned {

    using SafeMath for uint256;

    string private _name;
    string private _symbol;
    uint8  private _decimals;

    constructor(string memory name, string memory symbol) public Owned(msg.sender) {
        _name = name;
        _symbol = symbol;
        _decimals = 18;
    }

    function name() public view returns (string memory) {
        return _name;
    }

    function symbol() public view returns (string memory) {
        return _symbol;
    }

    function decimals() public view returns (uint8) {
        return _decimals;
    }

    function mint(address account, uint256 value) public onlyOwner returns(bool) {
        _mint(account, value);
        return true;

    }

    function burn(address account, uint256 value) public onlyOwner returns(bool) {
        _burn(account, value);
        return true;
    }

    function getStakingPool() public view returns(address) {
        return owner;
    }
}
