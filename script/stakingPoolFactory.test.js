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

contract("StakingPoolFactory", (accounts) => {

    const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
    const admin = accounts[1];
    const user1 = accounts[0];
    const oks = accounts[2];
    const version = new BN("1");

    beforeEach(async () => {
        this.proxy = await ProxyContract.new(admin, {from: admin});
        this.stakingPoolFactoryStorage = await StakingPoolFactoryStorage.new(oks, {from: admin});
        this.stakingPoolFactory = await StakingPoolFactory.new(this.stakingPoolFactoryStorage.address, this.proxy.address, admin, {from: admin});
        await this.proxy.setTarget(this.stakingPoolFactory.address, {from: admin});
        this.stakingPoolFactoryProxy = await StakingPoolFactory.at(this.proxy.address);

        await this.stakingPoolFactoryStorage.nominateNewOwner(this.stakingPoolFactory.address, {from: admin});
        await this.stakingPoolFactory.acceptOwnership(this.stakingPoolFactoryStorage.address, {from: admin});

        await this.stakingPoolFactory.deployStakingPool("OKSPOOL", "OKSPOOL TOKEN", "TKN", admin, {from: admin});
        let stakingPools = await this.stakingPoolFactory.getStakingPools();
        this.initialStakingPool = await StakingPool.at(stakingPools[0]);

        this.vault = await Vault.at(await this.initialStakingPool.getVault());
        this.lpToken = await LPToken.at(await this.initialStakingPool.getLPToken());
    });

    it("Test state variable", async () => {
        chai.expect(await this.proxy.target()).to.be.equal(this.stakingPoolFactory.address);
        chai.expect(await this.stakingPoolFactory.getVersion()).to.be.bignumber.equal(version);
        chai.expect(await this.stakingPoolFactory.getFactoryStorage()).to.be.equal(this.stakingPoolFactoryStorage.address);
        chai.expect((await this.stakingPoolFactory.getStakingPools()).length).to.be.equal(1);

    });

    it("acceptOwnership by owner", async () => {
        let token1 = await LPToken.new("TOKEN", "TKN", {from: admin});
        let token2 = await LPToken.new("TOKEN", "TKN", {from: admin});

        await token1.nominateNewOwner(this.stakingPoolFactory.address, {from: admin});
        await token2.nominateNewOwner(this.stakingPoolFactory.address, {from: admin});

        await this.stakingPoolFactory.acceptOwnership(token1.address, {from: admin});
        await this.stakingPoolFactoryProxy.acceptOwnership(token2.address, {from: admin});
    });

    it("acceptOwnership by non owner", async () => {
        let token = await LPToken.new("TOKEN", "TKN", {from: admin});
        await token.nominateNewOwner(this.stakingPoolFactory.address, {from: admin});
        await expectRevert(
            this.stakingPoolFactory.acceptOwnership(token.address, {from: user1}),
            "Owner only function"
        );
        await expectRevert(
            this.stakingPoolFactoryProxy.acceptOwnership(token.address, {from: user1}),
            "Owner only function"
        );
    });

    it("Deploying staking pool by owner using proxy", async () => {
        await this.stakingPoolFactoryProxy.deployStakingPool("OKSPOOL", "OKSPOOL TKN", "TKN", admin, {from: admin});
        let stakingPoolFactory = await StakingPoolFactory.at(await this.proxy.target());
        let stakingPools = await stakingPoolFactory.getStakingPools();
        chai.expect(stakingPools.length).to.be.equal(2);
        let sp = await StakingPool.at(stakingPools[1]);

        let vault = await Vault.at(await sp.getVault());
        let lpToken = await LPToken.at(await sp.getLPToken());

        chai.expect(await sp.owner()).to.be.equal(admin);
        chai.expect(await vault.owner()).to.be.equal(stakingPools[1]);
        chai.expect(await lpToken.owner()).to.be.equal(stakingPools[1]);
    });

    it("Deploying staking pool by owner without proxy", async () => {
        await this.stakingPoolFactory.deployStakingPool("OKSPOOL", "OKSPOOL TKN", "TKN", admin, {from: admin});
        let stakingPools = await this.stakingPoolFactory.getStakingPools();

        chai.expect(stakingPools.length).to.be.equal(2);
        let sp = await StakingPool.at(stakingPools[1]);

        let vault = await Vault.at(await sp.getVault());
        let lpToken = await LPToken.at(await sp.getLPToken());

        chai.expect(await sp.owner()).to.be.equal(admin);
        chai.expect(await vault.owner()).to.be.equal(stakingPools[1]);
        chai.expect(await lpToken.owner()).to.be.equal(stakingPools[1]);
    });

    it("Deploying staking pool by non-owner using proxy", async () => {
        await expectRevert(
            this.stakingPoolFactoryProxy.deployStakingPool("OKSPOOL", "OKSPOOL TKN", "TKN", admin, {from: user1}),
            "Owner only function"
        );
    });

    it("Deploying staking pool by non-owner without proxy", async () => {
        await expectRevert(
            this.stakingPoolFactory.deployStakingPool("OKSPOOL", "OKSPOOL TKN", "TKN", admin, {from: user1}),
            "Owner only function"
        );
    });

    it("Upgrading staking pool by owner using proxy", async () => {

        let stakingPoolFactoryV2 = await StakingPoolFactoryV2.new(await this.stakingPoolFactory.getFactoryStorage(), this.proxy.address, admin, {from: admin});
        await this.stakingPoolFactoryProxy.upgradeFactory(stakingPoolFactoryV2.address, {from: admin});
        await this.proxy.setTarget(stakingPoolFactoryV2.address, {from: admin});
        await stakingPoolFactoryV2.acceptOwnership(await this.stakingPoolFactory.getFactoryStorage(), {from: admin});
        await this.stakingPoolFactoryProxy.upgradeStakingPool(this.initialStakingPool.address, {from: admin});


        let stakingPools = await stakingPoolFactoryV2.getStakingPools();
        let sp = await StakingPool.at(stakingPools[0]);

        chai.expect(await this.vault.owner()).to.be.equal(sp.address);
        chai.expect(await this.lpToken.owner()).to.be.equal(sp.address);

        chai.expect(await sp.oldAddress()).to.be.equal(this.initialStakingPool.address);
        chai.expect(await sp.stakingPoolFactory()).to.be.equal(this.proxy.address);
        chai.expect(await this.initialStakingPool.newAddress()).to.be.equal(sp.address);
    });

    it("Upgrading staking pool by owner without proxy", async () => {

        let stakingPoolFactoryV2 = await StakingPoolFactoryV2.new(await this.stakingPoolFactory.getFactoryStorage(), this.proxy.address, admin, {from: admin});
        await this.stakingPoolFactory.upgradeFactory(stakingPoolFactoryV2.address, {from: admin});
        await this.proxy.setTarget(stakingPoolFactoryV2.address, {from: admin});
        await stakingPoolFactoryV2.acceptOwnership(await this.stakingPoolFactory.getFactoryStorage(), {from: admin});
        await stakingPoolFactoryV2.upgradeStakingPool(this.initialStakingPool.address, {from: admin});

        let stakingPools = await stakingPoolFactoryV2.getStakingPools();
        let sp = await StakingPool.at(stakingPools[0]);

        chai.expect(await this.vault.owner()).to.be.equal(sp.address);
        chai.expect(await this.lpToken.owner()).to.be.equal(sp.address);

        chai.expect(await sp.oldAddress()).to.be.equal(this.initialStakingPool.address);
        chai.expect(await sp.stakingPoolFactory()).to.be.equal(this.proxy.address);
        chai.expect(await this.initialStakingPool.newAddress()).to.be.equal(sp.address);
    });

    it("Upgrading staking pool by non-owner using proxy", async () => {

        let stakingPoolFactoryV2 = await StakingPoolFactoryV2.new(await this.stakingPoolFactory.getFactoryStorage(), this.proxy.address, admin, {from: admin});
        await this.stakingPoolFactory.upgradeFactory(stakingPoolFactoryV2.address, {from: admin});
        await this.proxy.setTarget(stakingPoolFactoryV2.address, {from: admin});
        await stakingPoolFactoryV2.acceptOwnership(await this.stakingPoolFactory.getFactoryStorage(), {from: admin});
        await expectRevert(
            this.stakingPoolFactoryProxy.upgradeStakingPool(this.initialStakingPool.address, {from: user1}),
            "Owner only function"
        );
    });

    it("Upgrading staking pool by non-owner without proxy", async () => {

        let stakingPoolFactoryV2 = await StakingPoolFactoryV2.new(await this.stakingPoolFactory.getFactoryStorage(), this.proxy.address, admin, {from: admin});
        await this.stakingPoolFactory.upgradeFactory(stakingPoolFactoryV2.address, {from: admin});
        await this.proxy.setTarget(stakingPoolFactoryV2.address, {from: admin});
        await stakingPoolFactoryV2.acceptOwnership(await this.stakingPoolFactory.getFactoryStorage(), {from: admin});
        await expectRevert(
            stakingPoolFactoryV2.upgradeStakingPool(this.initialStakingPool.address, {from: user1}),
            "Owner only function"
        );
    });

    it("Upgrading staking pool factory by owner using proxy", async () => {

        let stakingPoolFactory = await StakingPoolFactory.at(await this.proxy.target());
        let stakingPoolFactoryV2 = await StakingPoolFactoryV2.new(await stakingPoolFactory.getFactoryStorage(), this.proxy.address, admin, {from: admin});
        
        await this.stakingPoolFactoryProxy.upgradeFactory(stakingPoolFactoryV2.address, {from: admin});
        await this.proxy.setTarget(stakingPoolFactoryV2.address, {from: admin});
        await stakingPoolFactoryV2.acceptOwnership(await stakingPoolFactory.getFactoryStorage(), {from: admin});

        chai.expect(await this.proxy.target()).to.be.equal(stakingPoolFactoryV2.address);

        let stakingPoolFactoryStorage = await StakingPoolFactoryStorage.at(await stakingPoolFactory.getFactoryStorage());
        chai.expect(await stakingPoolFactoryStorage.owner()).to.be.equal(stakingPoolFactoryV2.address);

        await expectRevert(
            stakingPoolFactory.upgradeFactory(this.stakingPoolFactory.address,{from: admin}),
            "StakingPoolFactory: the factory was upgraded"
        );

        await expectRevert(
            stakingPoolFactory.upgradeStakingPool(this.initialStakingPool.address,{from: admin}),
            "StakingPoolFactory: the factory was upgraded"
        );
    });

    it("Upgrading staking pool factory by owner without proxy", async () => {

        let stakingPoolFactoryV2 = await StakingPoolFactoryV2.new(await this.stakingPoolFactory.getFactoryStorage(), this.proxy.address, admin, {from: admin});
        
        await this.stakingPoolFactory.upgradeFactory(stakingPoolFactoryV2.address, {from: admin});
        await this.proxy.setTarget(stakingPoolFactoryV2.address, {from: admin});
        await stakingPoolFactoryV2.acceptOwnership(await this.stakingPoolFactory.getFactoryStorage(), {from: admin});

        chai.expect(await this.proxy.target()).to.be.equal(stakingPoolFactoryV2.address);

        let stakingPoolFactoryStorage = await StakingPoolFactoryStorage.at(await this.stakingPoolFactory.getFactoryStorage());
        chai.expect(await stakingPoolFactoryStorage.owner()).to.be.equal(stakingPoolFactoryV2.address);
        
        await expectRevert(
            this.stakingPoolFactory.upgradeFactory(this.stakingPoolFactory.address,{from: admin}),
            "StakingPoolFactory: the factory was upgraded"
        );
        
        await expectRevert(
            this.stakingPoolFactory.upgradeStakingPool(this.initialStakingPool.address,{from: admin}),
            "StakingPoolFactory: the factory was upgraded"
        );
    });

    it("Upgrading staking pool factory by non-owner using proxy", async () => {

        let stakingPoolFactory = await StakingPoolFactory.at(await this.proxy.target());
        let stakingPoolFactoryV2 = await StakingPoolFactoryV2.new(await stakingPoolFactory.getFactoryStorage(), this.proxy.address, admin, {from: admin});        
        await expectRevert(
            this.stakingPoolFactoryProxy.upgradeFactory(stakingPoolFactoryV2.address, {from: user1}),
            "Owner only function"
        );
    });

    it("Upgrading staking pool factory by non-owner without proxy", async () => {

        let stakingPoolFactoryV2 = await StakingPoolFactoryV2.new(await this.stakingPoolFactory.getFactoryStorage(), this.proxy.address, admin, {from: admin});        
        await expectRevert(
            this.stakingPoolFactory.upgradeFactory(stakingPoolFactoryV2.address, {from: user1}),
            "Owner only function"
        );
    });

    it("Check if functions are disabled when the factory is upgraded", async () => {

        let stakingPoolFactory = await StakingPoolFactory.at(await this.proxy.target());
        let stakingPoolFactoryV2 = await StakingPoolFactoryV2.new(await stakingPoolFactory.getFactoryStorage(), this.proxy.address, admin, {from: admin});
        
        await this.stakingPoolFactoryProxy.upgradeFactory(stakingPoolFactoryV2.address, {from: admin});
        await this.proxy.setTarget(stakingPoolFactoryV2.address, {from: admin});
        await stakingPoolFactoryV2.acceptOwnership(await stakingPoolFactory.getFactoryStorage(), {from: admin});

        await expectRevert(
            stakingPoolFactory.upgradeFactory(ZERO_ADDRESS,{from: admin}),
            "StakingPoolFactory: the factory was upgraded"
        );

        await expectRevert(
            stakingPoolFactory.deployStakingPool("OKSPOOL","TOKEN NAME", "NME", admin,{from: admin}),
            "StakingPoolFactory: the factory was upgraded"
        );

        await expectRevert(
            stakingPoolFactory.upgradeStakingPool(ZERO_ADDRESS,{from: admin}),
            "StakingPoolFactory: the factory was upgraded"
        );

        await expectRevert(
            stakingPoolFactory.acceptOwnership(ZERO_ADDRESS,{from: admin}),
            "StakingPoolFactory: the factory was upgraded"
        );
    });
});