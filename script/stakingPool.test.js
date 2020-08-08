const {
    BN, 
    time,
    constants,
    expectEvent,
    expectRevert
} = require("@openzeppelin/test-helpers");

const chai = require("chai");

chai.use(require("chai-bn")(BN));

const OKSMock = artifacts.require("OKSMock");
const FeePoolMock = artifacts.require("FeePoolMock");
const RewardEscrowMock = artifacts.require("RewardEscrowMock");

const Vault = artifacts.require("Vault");
const LPToken = artifacts.require("LPToken");
const StakingPool = artifacts.require("StakingPool");
const ProxyContract = artifacts.require("Proxy");
const ProxyERC20 = artifacts.require("ProxyERC20");
const StakingPoolFactory = artifacts.require("StakingPoolFactory");
const StakingPoolFactoryV2 = artifacts.require("StakingPoolFactoryMock");
const StakingPoolFactoryStorage = artifacts.require("StakingPoolFactoryStorage");

contract("StakingPool", (accounts) => {

    const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
    const admin = accounts[1];
    const user1 = accounts[2];
    const oks = accounts[3];
    const address = accounts[4];
    const rewardDistributor = accounts[5];
    const version = new BN("1");

    beforeEach(async () => {
        this.proxyERC20 = await ProxyERC20.new(admin, {from: admin});
        this.oks = await OKSMock.new("TOKEN", "TKN", this.proxyERC20.address, admin, {from: admin});
        await this.proxyERC20.setTarget(this.oks.address, {from: admin});
        this.oksProxy = await OKSMock.at(this.proxyERC20.address);

        this.feePool = await FeePoolMock.new({from: admin});
        this.rewardEscrow = await RewardEscrowMock.new(this.oksProxy.address, {from: admin});
        
        await this.oksProxy.setFeePool(this.feePool.address, {from: admin});
        await this.oksProxy.setRewardEscrow(this.rewardEscrow.address, {from: admin});
        await this.oksProxy.setRewardsDistribution(rewardDistributor, {from: admin});
        await this.oksProxy.mint(this.rewardEscrow.address, web3.utils.toWei("21"), {from: admin});


        this.proxy = await ProxyContract.new(admin, {from: admin});
        this.stakingPoolFactoryStorage = await StakingPoolFactoryStorage.new(this.oksProxy.address, {from: admin});
        this.stakingPoolFactory = await StakingPoolFactory.new(this.stakingPoolFactoryStorage.address, this.proxy.address, admin, {from: admin});
        await this.proxy.setTarget(this.stakingPoolFactory.address, {from: admin});

        this.stakingPoolFactoryProxy = await StakingPoolFactory.at(this.proxy.address);

        await this.stakingPoolFactoryStorage.nominateNewOwner(this.stakingPoolFactory.address, {from: admin});
        await this.stakingPoolFactoryProxy.acceptOwnership(this.stakingPoolFactoryStorage.address, {from: admin});
        await this.stakingPoolFactoryProxy.deployStakingPool("OKSPOOL", "OKSPOOL TOKEN", "TKN", admin, {from: admin});
        let stakingPools = await this.stakingPoolFactory.getStakingPools();
        this.stakingPool = await StakingPool.at(stakingPools[0]);
        this.lpToken = await LPToken.at(await this.stakingPool.getLPToken());
        this.vault = await Vault.at(await this.stakingPool.getVault());
    });

    it("Test state variable", async () => {
        chai.expect(await this.stakingPool.getVersion()).to.be.bignumber.equal(version);
        chai.expect(await this.stakingPool.name()).to.be.equal("OKSPOOL");
        chai.expect(await this.stakingPool.stakingPoolFactory()).to.be.equal(this.stakingPoolFactoryProxy.address);
        chai.expect(await this.stakingPool.oldAddress()).to.be.equal(this.stakingPoolFactory.address);
        chai.expect(await this.stakingPool.newAddress()).to.be.equal(ZERO_ADDRESS);
        chai.expect(await this.lpToken.name()).to.be.equal("OKSPOOL TOKEN");
        chai.expect(await this.lpToken.symbol()).to.be.equal("TKN");
        chai.expect(await this.lpToken.decimals()).to.be.bignumber.equal("18");
        chai.expect(await this.lpToken.owner()).to.be.equal(this.stakingPool.address);
        chai.expect(await this.vault.owner()).to.be.equal(this.stakingPool.address);
    });

    it("Test zero addresses", async () => {
        await expectRevert(
            StakingPool.new("OKSPOOL", ZERO_ADDRESS, address, address, address, address, 1, admin,{from: admin}),
            "StakingPool: staking pool factory is zero address"
        );
        await expectRevert(
            StakingPool.new("OKSPOOL", address, ZERO_ADDRESS, address, address, address, 1, admin,{from: admin}),
            "StakingPool: previous pool address is zero address"
        );
        await expectRevert(
            StakingPool.new("OKSPOOL", address, address, ZERO_ADDRESS, address, address, 1, admin,{from: admin}),
            "StakingPool: vault is zero address"
        );
    });

    it("Upgrade pool from an unauthorized address", async () => {
        await expectRevert(
            this.stakingPool.upgrade(ZERO_ADDRESS, {from: admin}),
            "StakingPool: only staking pool factory is allowed to upgrade"
        );
    });

    it("Notify reward amount from a different address than rewardDistribution", async () => {
        await this.oksProxy.mint(this.stakingPool.address, web3.utils.toWei("1"), {from: admin});
        await expectRevert(
            this.stakingPool.notifyRewardAmount(web3.utils.toWei("1"), {from: admin}),
            "DSA: only reward distribution contract is allowed"
        );
    });

    it("Notify reward amount from rewardDistribution", async () => {
        await this.oksProxy.mint(this.stakingPool.address, web3.utils.toWei("1"), {from: admin});
        await this.stakingPool.notifyRewardAmount(web3.utils.toWei("1"), {from: rewardDistributor});
    });

    it("Check the reimplemented stake & withdraw functions", async () => {
        await this.oksProxy.mint(admin, web3.utils.toWei("1"), {from: admin});
        await this.oksProxy.approve(this.stakingPool.address, web3.utils.toWei("1"), {from: admin});
        await this.stakingPool.stake(web3.utils.toWei("1"), {from: admin});
        await this.stakingPool.withdraw(await this.lpToken.balanceOf(admin),{from: admin});
    });

    it("Check if functions are disabled after stakingPool upgrade", async () => {
        let stakingPoolFactoryV2 = await StakingPoolFactoryV2.new(this.stakingPoolFactoryStorage.address, this.proxy.address, admin, {from: admin});
        await this.stakingPoolFactoryProxy.upgradeFactory(stakingPoolFactoryV2.address, {from: admin});
        await this.proxy.setTarget(stakingPoolFactoryV2.address, {from: admin});
        await this.stakingPoolFactoryProxy.acceptOwnership(this.stakingPoolFactoryStorage.address, {from: admin});
        await this.stakingPoolFactoryProxy.upgradeStakingPool(await this.stakingPoolFactoryStorage.getStakingPool(0), {from: admin});

        await this.oksProxy.mint(this.stakingPool.address, web3.utils.toWei("1"), {from: admin});
        await expectRevert(
            this.stakingPool.notifyRewardAmount(web3.utils.toWei("1"), {from: admin}),
            "StakingPool: upgraded"
        );

        await this.oksProxy.mint(admin, web3.utils.toWei("1"), {from: admin});
        await this.oksProxy.approve(this.stakingPool.address, web3.utils.toWei("1"), {from: admin});
        await expectRevert(
            this.stakingPool.stake(web3.utils.toWei("1"), {from: admin}),
            "StakingPool: upgraded"
        );
        await expectRevert(
            this.stakingPool.withdraw(await this.lpToken.balanceOf(admin),{from: admin}),
            "StakingPool: upgraded"
        );
    });

    it("Check if token and ether transfer to upgraded pool are disabled initially", async () => {
        await expectRevert(
            this.stakingPool.transferTokenBalance(this.oksProxy.address),
            "StakingPool: pool not upgraded"
        );
        await expectRevert(
            this.stakingPool.transferTrxBalance(),
            "StakingPool: pool not upgraded"
        );
    });

    it("Check token & trx withdrawal after upgrade", async () => {
        let stakingPoolFactoryV2 = await StakingPoolFactoryV2.new(this.stakingPoolFactoryStorage.address, this.proxy.address, admin, {from: admin});
        await this.stakingPoolFactoryProxy.upgradeFactory(stakingPoolFactoryV2.address, {from: admin});
        await this.proxy.setTarget(stakingPoolFactoryV2.address, {from: admin});
        await this.stakingPoolFactoryProxy.acceptOwnership(this.stakingPoolFactoryStorage.address, {from: admin});
        await this.stakingPoolFactoryProxy.upgradeStakingPool(await this.stakingPoolFactoryStorage.getStakingPool(0), {from: admin});

        let newStakingPool = await StakingPool.at(await this.stakingPoolFactoryStorage.getStakingPool(0));
        let oldStakingPool = await StakingPool.at(await newStakingPool.oldAddress());

        chai.expect(await oldStakingPool.newAddress()).to.be.equal(newStakingPool.address);

        await this.oksProxy.mint(this.stakingPool.address, web3.utils.toWei("1.1"), {from: admin});
        await web3.eth.sendTransaction({from: admin, to: oldStakingPool.address, value: web3.utils.toWei("1.2")});

        await oldStakingPool.transferTokenBalance(this.oksProxy.address,{from: admin});
        await oldStakingPool.transferTrxBalance({from: admin});

        chai.expect(await this.oksProxy.balanceOf(newStakingPool.address)).to.be.bignumber.equal(web3.utils.toWei("1.1"));
        chai.expect(await web3.eth.getBalance(newStakingPool.address)).to.be.bignumber.equal(web3.utils.toWei("1.2"));

    });

    it("Check acceptOwnership & setExchangeRate", async () => {
        await expectRevert(
            this.stakingPool.setExchangeRate(new BN("0"), {from: admin}),
            "StakingPool: address not allowed"
        );
        await expectRevert(
            this.stakingPool.acceptOwnership(ZERO_ADDRESS),
            "StakingPool: address not allowed"
        );
    });
});