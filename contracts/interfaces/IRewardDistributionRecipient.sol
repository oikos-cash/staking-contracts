pragma solidity ^0.5.0;

interface IRewardDistributionRecipient {
    function notifyRewardAmount(uint256 reward) external;
}
