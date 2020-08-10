pragma solidity ^0.5.0;

interface ISynthetix {
    function issueSynths(uint amount) external;
    function issueMaxSynths() external;
    function exchange(bytes32 sourceCurrencyKey, uint256 sourceAmount, bytes32 destinationCurrencyKey) external returns (bool);
    function collateralisationRatio(address issuer) external view returns (uint256);
    function getSynth(bytes32 currencyKey) external view returns (address);

    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 value) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 value) external returns (bool);
    function transferFrom(address from, address to, uint256 value) external returns (bool);

    function feePool() external view returns(address);
    function rewardEscrow() external view returns(address);
    function rewardsDistribution() external view returns(address);
}