const {
    BN, 
    time,
    constants,
    expectEvent,
    expectRevert
} = require("@openzeppelin/test-helpers");

const chai = require("chai");

chai.use(require("chai-bn")(BN));

const StakingPoolFactoryStorage = artifacts.require("StakingPoolFactoryStorage");

contract("StakingPoolFactoryStorage", (accounts) => {

});