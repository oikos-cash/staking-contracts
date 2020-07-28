const {
    BN, 
    time,
    constants,
    expectEvent,
    expectRevert
} = require("@openzeppelin/test-helpers");

const chai = require("chai");

chai.use(require("chai-bn")(BN));

const StakingPoolFactory = artifacts.require("StakingPoolFactory");

contract("StakingPoolFactory", (accounts) => {

});