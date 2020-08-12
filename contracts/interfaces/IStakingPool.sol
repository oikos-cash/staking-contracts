
pragma solidity ^0.5.0;


interface IStakingPool {

    function() external payable;
    function notifyRewardAmount(uint256 _reward) external;
    function stake(uint256 _amount) external;
    function withdraw(uint256 _sAmount) external;
    function issueSynths(uint256 _amount) external;
    function issueMaxSynths() external;
    function synthExchange(bytes32 _sourceCurrencyKey, uint _sourceAmount, bytes32 _destinationCurrencyKey) external;

    function addLiquidity(
        address _token,
        uint256 _min_liquidity,
        uint256 _max_tokens
    ) external payable returns (uint256);

    function removeLiquidity(
        address _token,
        uint256 _amount,
        uint256 _min_trx,
        uint256 _min_tokens
    ) external returns(uint256, uint256);

    function upgrade(address payable _stakingPool) external;
    function transferTokenBalance(address _token) external;
    function transferTrxBalance() external;
    function acceptContractOwnership(address _addr) external;
    function setExchangeRate(uint256 _exchangeRate) external;

    function getVault() external view returns(address);
    function getVersion() external view returns(uint256);
    function getLPToken() external view returns(address);
}


