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
    
    const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
    const admin = accounts[0];
    const user1 = accounts[1];
    const oks = accounts[2];
    const oks2 = accounts[3];
    const sp1 = accounts[4];
    const sp2 = accounts[5];
    const sp3 = accounts[6];
    const rewardDistributor = accounts[7];
    const fakeUniFactory = accounts[3];
    const fakeUniFactory2 = accounts[7];

    beforeEach(async () => {
        this.spfs = await StakingPoolFactoryStorage.new({ from: admin });
        await this.spfs.setOKS(oks, {from: admin});
        await this.spfs.setUniswapFactory(fakeUniFactory, {from: admin});
    });

    it("Checking storage initialization", async () => {
        chai.expect(await this.spfs.getOKS()).to.be.equal(oks);
        chai.expect(await this.spfs.getUniswapFactory()).to.be.equal(fakeUniFactory);
        chai.expect( (await this.spfs.getStakingPools()).length).to.be.equal(0);
    });

    it("Setting OKS to zero address", async () => {
        await expectRevert(
            this.spfs.setOKS(ZERO_ADDRESS, {from: admin}),
            "StakingPoolFactoryStorage: OKS is zero address"
        );
    });

    it("Setting OKS with non-owner address", async () => {
        await expectRevert(
            this.spfs.setOKS(oks2, {from: user1}),
            "Owned: Only the contract owner may perform this action"
        );
    });

    it("Setting OKS with correct address and owner access", async () => {
        await this.spfs.setOKS(oks2, {from: admin});
        chai.expect(await this.spfs.getOKS()).to.be.equal(oks2);
    });

    it("Setting Uniswap Factory to zero address", async () => {
        await expectRevert(
            this.spfs.setUniswapFactory(ZERO_ADDRESS, {from: admin}),
            "StakingPoolFactoryStorage: Uniswap factory is zero address"
        );
    });

    it("Setting Uniswap Factory with non-owner address", async () => {
        await expectRevert(
            this.spfs.setUniswapFactory(fakeUniFactory, {from: user1}),
            "Owned: Only the contract owner may perform this action"
        );
    });

    it("Setting Uniswap Factory with correct address and owner access", async () => {
        await this.spfs.setOKS(fakeUniFactory2, {from: admin});
        chai.expect(await this.spfs.getOKS()).to.be.equal(fakeUniFactory2);
    });

    it("Adding staking pool with non-owner", async () => {
        await expectRevert(
            this.spfs.addStakingPool(sp1, {from: user1}),
            "Owned: Only the contract owner may perform this action"
        );
    });

    it("Adding staking pool with zero address", async () => {
        await expectRevert(
            this.spfs.addStakingPool(ZERO_ADDRESS, {from: admin}),
            "StakingPoolFactoryStorage: pool is zero address"
        );
    });

    it("Adding staking pools", async () => {
        await this.spfs.addStakingPool(sp1, {from: admin});
        chai.expect( (await this.spfs.getStakingPools()).length).to.be.equal(1);
        await this.spfs.addStakingPool(sp2, {from: admin});
        chai.expect( (await this.spfs.getStakingPools()).length).to.be.equal(2);
    });

    it("Adding staking pools", async () => {
        await this.spfs.addStakingPool(sp1, {from: admin});
        chai.expect( (await this.spfs.getStakingPools()).length).to.be.equal(1);
        await this.spfs.addStakingPool(sp2, {from: admin});
        chai.expect( (await this.spfs.getStakingPools()).length).to.be.equal(2);
    });

    it("Checking staking pools index", async () => {
        await this.spfs.addStakingPool(sp1, {from: admin});
        await this.spfs.addStakingPool(sp2, {from: admin});
        await this.spfs.addStakingPool(sp3, {from: admin});

        let stakingPools = await this.spfs.getStakingPools();

        for(let i=0; i<stakingPools.length; i++) {
            let sp = stakingPools[i];
            let index = await this.spfs.getStakingPoolIndex(sp);
            chai.expect(await this.spfs.getStakingPool(index)).to.be.equal(sp);
        }
    });
    
    it("Checking index out of bound", async () => {
        await this.spfs.addStakingPool(sp1, {from: admin});
        await expectRevert(
            this.spfs.getStakingPool(1),
            "StakingPoolFactoryStorage: index out of bound"
        );
    });

    it("Getiing index out of bound", async () => {
        await this.spfs.addStakingPool(sp1, {from: admin});
        await expectRevert(
            this.spfs.getStakingPool(1),
            "StakingPoolFactoryStorage: index out of bound"
        );
    });

    it("Getting a non listed pool index", async () => {
        await this.spfs.addStakingPool(sp1, {from: admin});
        await expectRevert(
            this.spfs.getStakingPoolIndex(sp2),
            "StakingPoolFactoryStorage: pool is not listed"
        );
    });

    it("removing staking pool with non-owner", async () => {
        await this.spfs.addStakingPool(sp1, {from: admin});
        await expectRevert(
            this.spfs.removeStakingPool(sp1, {from: user1}),
            "Owned: Only the contract owner may perform this action"
        );
    });

    it("removing a non listed staking pool", async () => {
        await expectRevert(
            this.spfs.removeStakingPool(sp1, {from: admin}),
            "StakingPoolFactoryStorage: pool is not listed"
        );
    });

    it("removing staking pools", async () => {
        await this.spfs.addStakingPool(sp1, {from: admin});
        await this.spfs.addStakingPool(sp2, {from: admin});
        await this.spfs.addStakingPool(sp3, {from: admin});
        chai.expect( (await this.spfs.getStakingPools()).length).to.be.equal(3);
        await this.spfs.removeStakingPool(sp1, {from: admin});
        chai.expect( (await this.spfs.getStakingPools()).length).to.be.equal(2);
        let stakingPools = await this.spfs.getStakingPools();
        chai.expect(stakingPools[0]).to.be.equal(sp3);
        chai.expect(stakingPools[1]).to.be.equal(sp2);
        await this.spfs.removeStakingPool(sp2, {from: admin});
        chai.expect( (await this.spfs.getStakingPools()).length).to.be.equal(1);
        chai.expect(await this.spfs.getStakingPool(0)).to.be.equal(sp3);
        chai.expect(await this.spfs.getStakingPoolIndex(sp3)).to.be.bignumber.equal("0");
        await this.spfs.removeStakingPool(sp3, {from: admin});
        chai.expect( (await this.spfs.getStakingPools()).length).to.be.equal(0);

    });

});