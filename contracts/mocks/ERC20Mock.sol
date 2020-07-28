pragma solidity ^0.5.0;

import "../utility/SafeMath.sol";
import "../utility/ERC20.sol";
import "../utility/Owned.sol";


contract ERC20Mock is ERC20, Owned {

    using SafeMath for uint256;

    string private _name;
    string private _symbol;
    uint8  private _decimals;

    constructor(string memory name, string memory symbol) Owned(msg.sender) public {
        _name = name;
        _symbol = symbol;
        _decimals = 18;
        uint256 initialSupply = 1000000 * (10**18);
        _totalSupply = initialSupply;
        _balances[msg.sender] = initialSupply;
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
}
