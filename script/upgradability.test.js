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
const ProxyContract = artifacts.require("Proxy");
const StakingPoolFactory = artifacts.require("StakingPoolFactory");
const StakingPoolFactoryV2 = artifacts.require("StakingPoolFactoryMock");
const StakingPoolFactoryStorage = artifacts.require("StakingPoolFactoryStorage");

contract("StakingPool & Factory Upgradability Tests", (accounts) => {

    const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
    const admin = accounts[1];
    const user1 = accounts[0];
    const oks = accounts[2];

    beforeEach(async () => {
        this.proxy = await ProxyContract.new(admin, {from: admin});
        this.stakingPoolFactoryStorage = await StakingPoolFactoryStorage.new(oks, {from: admin});
        this.stakingPoolFactory = await StakingPoolFactory.new(this.stakingPoolFactoryStorage.address, this.proxy.address, admin, {from: admin});
        await this.proxy.setTarget(this.stakingPoolFactory.address, {from: admin});
        await this.stakingPoolFactoryStorage.nominateNewOwner(this.stakingPoolFactory.address, {from: admin});
        await this.stakingPoolFactory.acceptOwnership(this.stakingPoolFactoryStorage.address, {from: admin});
    });

    it("Deploying staking pool factory", async () => {
    });

    it("Upgrading staking pool factory & staking pool", async () => {
        let vault = await Vault.new({from: admin});
        let lpToken = await LPToken.new("TOKEN", "TKN", {from: admin});

        await lpToken.nominateNewOwner(this.stakingPoolFactory.address, {from: admin});
        await vault.nominateNewOwner(this.stakingPoolFactory.address, {from: admin});
        await this.stakingPoolFactory.acceptOwnership(lpToken.address, {from: admin});
        await this.stakingPoolFactory.acceptOwnership(vault.address, {from: admin});

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