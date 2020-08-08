pragma solidity ^0.5.0;

import "./ERC20Mock.sol";
import "../utility/Proxyable.sol";


contract OKSMock is ERC20Mock, Proxyable {

    address private _feePool;
    address private _rewardEscrow;
    address private _rewardsDistribution;

    constructor(
        string memory _name,
        string memory _symbol,
        address payable _proxy,
        address _owner
    )
        public
        Proxyable(_proxy, _owner)
        ERC20Mock(_name, _symbol)
    {

    }

    function feePool() public view returns(address) {
        return _feePool;
    }

    function rewardEscrow() public view returns(address) {
        return _rewardEscrow;
    }

    function rewardsDistribution() public view returns(address) {
        return _rewardsDistribution;
    }

    function setFeePool(address _addr)
        public
        optionalProxy_onlyOwner
    {
        _feePool = _addr;
    }

    function setRewardEscrow(address _addr)
        public
        optionalProxy_onlyOwner
    {
        _rewardEscrow = _addr;
    }

    function setRewardsDistribution(address _addr)
        public
        optionalProxy_onlyOwner
    {
        _rewardsDistribution = _addr;
    }

    function mint(address account, uint256 value)
        public
        optionalProxy_onlyOwner
        returns(bool)
    {
        _mint(account, value);
        return true;

    }

    function burn(address account, uint256 value)
        public
        optionalProxy_onlyOwner
        returns(bool)
    {
        _burn(account, value);
        return true;
    }

    function transfer(address to, uint256 value)
        public
        optionalProxy
        returns (bool)
    {
        _transfer(messageSender, to, value);
        return true;
    }

    function approve(address spender, uint256 value)
        public
        optionalProxy
        returns (bool)
    {
        _approve(messageSender, spender, value);
        return true;
    }

    function transferFrom(address from, address to, uint256 value)
        public
        optionalProxy
        returns (bool)
    {
        _transfer(from, to, value);
        _approve(from, messageSender, _allowed[from][messageSender].sub(value));
        return true;
    }

    function increaseAllowance(address spender, uint256 addedValue)
        public
        optionalProxy
        returns (bool)
    {
        _approve(messageSender, spender, _allowed[messageSender][spender].add(addedValue));
        return true;
    }

    function decreaseAllowance(address spender, uint256 subtractedValue)
        public
        optionalProxy
        returns (bool)
    {
        _approve(messageSender, spender, _allowed[messageSender][spender].sub(subtractedValue));
        return true;
    }
}
