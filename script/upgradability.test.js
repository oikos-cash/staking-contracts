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
const StakingPoolFactoryProxy = artifacts.require("StakingPoolFactoryProxy");
const StakingPoolFactory = artifacts.require("StakingPoolFactory");
const StakingPoolFactoryV2 = artifacts.require("StakingPoolFactoryMock");
const StakingPoolFactoryStorage = artifacts.require("StakingPoolFactoryStorage");

contract("StakingPool & Factory Upgradability Tests", (accounts) => {

    const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
    const admin = accounts[0];
    const user1 = accounts[1];
    const oks = accounts[2];
    const unifactory = accounts[3];

    beforeEach(async () => {
        this.proxy = await StakingPoolFactoryProxy.new(admin, {from: admin});
        this.stakingPoolFactoryStorage = await StakingPoolFactoryStorage.new({from: admin});
        await this.stakingPoolFactoryStorage.setOKS(oks ,{from: admin});
        this.stakingPoolFactory = await StakingPoolFactory.new(this.stakingPoolFactoryStorage.address, this.proxy.address, admin, {from: admin});
        await this.proxy.setTarget(this.stakingPoolFactory.address, {from: admin});
        await this.stakingPoolFactoryStorage.nominateNewOwner(this.stakingPoolFactory.address, {from: admin});
        await this.stakingPoolFactory.acceptContractOwnership(this.stakingPoolFactoryStorage.address);
    });

    it("Deploying staking pool factory", async () => {
    });

    it("Upgrading staking pool factory & staking pool", async () => {
        this.vault = await Vault.new({from: admin});
        this.token = await LPToken.new("OKSPOOL TOKEN", "TKN", {from: admin});
        await this.vault.nominateNewOwner(this.stakingPoolFactory.address, {from: admin});
        await this.token.nominateNewOwner(this.stakingPoolFactory.address, {from: admin});
        await this.stakingPoolFactory.deployStakingPool("OKSPOOL", this.vault.address, this.token.address, admin, {from: admin});

        let initialStakingPool = await StakingPool.at(await this.stakingPoolFactoryStorage.getStakingPool(0));
        let stakingPoolFactoryV2 = await StakingPoolFactoryV2.new(this.stakingPoolFactoryStorage.address, this.proxy.address, admin, {from: admin});

        let vault = await Vault.at(await initialStakingPool.getVault());
        let lpToken = await LPToken.at(await initialStakingPool.getLPToken());

        await this.stakingPoolFactory.upgradeFactory(stakingPoolFactoryV2.address, {from: admin});
        await stakingPoolFactoryV2.acceptContractOwnership(this.stakingPoolFactoryStorage.address, {from: admin});
        await this.proxy.setTarget(stakingPoolFactoryV2.address, {from: admin});
        await stakingPoolFactoryV2.upgradeStakingPool(await this.stakingPoolFactoryStorage.getStakingPool(0), {from: admin});


        let upgradedStakingPool = await StakingPool.at(await this.stakingPoolFactoryStorage.getStakingPool(0));

        chai.expect(await upgradedStakingPool.address).to.be.not.equal(initialStakingPool.address);
        chai.expect((await this.stakingPoolFactoryStorage.getStakingPools()).length).to.be.equal(1);
        chai.expect(await vault.owner()).to.be.equal(upgradedStakingPool.address);
        chai.expect(await lpToken.owner()).to.be.equal(upgradedStakingPool.address);
        chai.expect(await upgradedStakingPool.oldAddress()).to.be.equal(initialStakingPool.address);
        chai.expect(await upgradedStakingPool.factory()).to.be.equal(this.proxy.address);
        chai.expect(await initialStakingPool.newAddress()).to.be.equal(upgradedStakingPool.address);
        chai.expect(await initialStakingPool.exchangeRate()).to.be.bignumber.equal(await upgradedStakingPool.exchangeRate());
    });
});