const {
    BN, 
    time,
    constants,
    expectEvent,
    expectRevert
} = require("@openzeppelin/test-helpers");

const chai = require("chai");

chai.use(require("chai-bn")(BN));

const StakingPool = artifacts.require("StakingPool");

contract("StakingPool", (accounts) => {

});