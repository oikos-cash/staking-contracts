pragma solidity ^0.5.0;

interface IUniswapFactory {
  event NewExchange(address indexed token, address indexed exchange);

  function getExchange(address token) external view returns (address payable);
  function getToken(address token) external view returns (address);
}