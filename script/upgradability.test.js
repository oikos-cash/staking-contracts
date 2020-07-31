const {
    BN, 
    time,
    constants,
    expectEvent,
    expectRevert
} = require("@openzeppelin/test-helpers");

const chai = require("chai");

chai.use(require("chai-bn")(BN));

const Vault = artifacts.require("Vault");
const LPToken = artifacts.require("LPToken");
const StakingPool = artifacts.require("StakingPool");
const StakingPoolV2 = artifacts.require("StakingPoolMock");
const ProxyContract = artifacts.require("Proxy");
const StakingPoolFactory = artifacts.require("StakingPoolFactory");
const StakingPoolFactoryV2 = artifacts.require("StakingPoolFactoryMock");
const StakingPoolFactoryStorage = artifacts.require("StakingPoolFactoryStorage");

contract("StakingPool & Factory Upgradability Tests", (accounts) => {

    const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
    const admin = accounts[0];
    const user1 = accounts[1];
    const oks = accounts[2];
    let deployedPools = 0;

    beforeEach(async () => {
        this.proxy = await ProxyContract.new(admin, {from: admin});
        this.stakingPoolFactoryStorage = await StakingPoolFactoryStorage.new(oks, {from: admin});
        this.stakingPoolFactory = await StakingPoolFactory.new(this.stakingPoolFactoryStorage.address, this.proxy.address, admin, {from: admin});
        await this.stakingPoolFactoryStorage.nominateNewOwner(this.stakingPoolFactory.address, {from: admin});
        await this.stakingPoolFactory.acceptOwnership(this.stakingPoolFactoryStorage.address, {from: admin});
    });

    it("Deploying staking pool factory", async () => {
    });

    it("Deploying staking pool from the factory", async () => {
        let vault = await Vault.new();
        let lpToken = await LPToken.new("TOKEN","TKN");

        await lpToken.nominateNewOwner(this.stakingPoolFactory.address, {from: admin});
        await vault.nominateNewOwner(this.stakingPoolFactory.address, {from: admin});
        await this.stakingPoolFactory.acceptOwnership(lpToken.address);
        await this.stakingPoolFactory.acceptOwnership(vault.address);

        await this.stakingPoolFactory.deployStakingPool("OKSPOOL", vault.address, lpToken.address, admin, {from: admin});

        let stakingPools = await this.stakingPoolFactoryStorage.getStakingPools();
        chai.expect(stakingPools.length).to.be.equal(1);
               
        let sp = await StakingPool.at(stakingPools[0]);

        chai.expect(await sp.getVault()).to.be.equal(vault.address);
        chai.expect(await sp.getLPToken()).to.be.equal(lpToken.address);
        chai.expect(await vault.owner()).to.be.equal(stakingPools[0]);
        chai.expect(await lpToken.owner()).to.be.equal(stakingPools[0]);
    });

    it("Upgrading staking pool factory & staking pool", async () => {
        let vault = await Vault.new();
        let lpToken = await LPToken.new("TOKEN","TKN");

        await lpToken.nominateNewOwner(this.stakingPoolFactory.address, {from: admin});
        await vault.nominateNewOwner(this.stakingPoolFactory.address, {from: admin});
        await this.stakingPoolFactory.acceptOwnership(lpToken.address);
        await this.stakingPoolFactory.acceptOwnership(vault.address);

        await this.stakingPoolFactory.deployStakingPool("OKSPOOL", vault.address, lpToken.address, admin, {from: admin});

        let initialStakingPool = await StakingPool.at(await this.stakingPoolFactoryStorage.getStakingPool(0));
        let stakingPoolFactoryV2 = await StakingPoolFactoryV2.new(this.stakingPoolFactoryStorage.address, this.proxy.address, admin, {from: admin});

        await this.stakingPoolFactory.upgradeFactory(stakingPoolFactoryV2.address, {from: admin});
        await stakingPoolFactoryV2.acceptOwnership(this.stakingPoolFactoryStorage.address, {from: admin});
        await this.proxy.setTarget(stakingPoolFactoryV2.address, {from: admin});
        await stakingPoolFactoryV2.upgradeStakingPool(await this.stakingPoolFactoryStorage.getStakingPool(0), {from: admin});


        let upgradedStakingPool = await StakingPool.at(await this.stakingPoolFactoryStorage.getStakingPool(0));

        chai.expect(await upgradedStakingPool.address).to.be.not.equal(initialStakingPool.address);
        chai.expect((await this.stakingPoolFactoryStorage.getStakingPools()).length).to.be.equal(1);
        chai.expect(await vault.owner()).to.be.equal(upgradedStakingPool.address);
        chai.expect(await lpToken.owner()).to.be.equal(upgradedStakingPool.address);
        chai.expect(await upgradedStakingPool.oldAddress()).to.be.equal(initialStakingPool.address);
        chai.expect(await upgradedStakingPool.stakingPoolFactory()).to.be.equal(this.proxy.address);
        chai.expect(await initialStakingPool.newAddress()).to.be.equal(upgradedStakingPool.address);
    });
});