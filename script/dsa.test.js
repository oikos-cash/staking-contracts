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

const LPToken = artifacts.require("LPToken");
const DSA = artifacts.require("DSA");
const ProxyContract = artifacts.require("Proxy");


contract("DSA", (accounts) => {

    const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
    const admin = accounts[1];
    const user1 = accounts[2];
    const user2 = accounts[3];
    const user3 = accounts[5];
    const rewardDistributor = accounts[4];

    let deployedPools = 0;

    beforeEach(async () => {
        this.proxy = await ProxyContract.new(admin, {from: admin});
        this.oks = await OKSMock.new("TOKEN", "TKN", this.proxy.address, admin, {from: admin});
        await this.proxy.setTarget(this.oks.address, {from: admin});
        this.oksProxy = await OKSMock.at(this.proxy.address);

        this.feePool = await FeePoolMock.new({from: admin});
        this.lpToken = await LPToken.new("TOKEN", "LPT", {from: admin});
        this.rewardEscrow = await RewardEscrowMock.new(this.oksProxy.address, {from: admin});

        await this.oksProxy.mint(this.rewardEscrow.address, web3.utils.toWei("21"), {from: admin});

        await this.oksProxy.mint(user1, web3.utils.toWei("1"), {from: admin});
        await this.oksProxy.mint(user2, web3.utils.toWei("1"), {from: admin});
        await this.oksProxy.mint(user3, web3.utils.toWei("1"), {from: admin});

        await this.oksProxy.setFeePool(this.feePool.address, {from: admin});
        await this.oksProxy.setRewardEscrow(this.rewardEscrow.address, {from: admin});
        await this.oksProxy.setRewardsDistribution(rewardDistributor, {from: admin});

        this.dsa = await DSA.new(this.oksProxy.address, this.lpToken.address, admin, {from: admin});
        await this.lpToken.nominateNewOwner(this.dsa.address, {from: admin});
        await this.dsa.acceptOwnership(this.lpToken.address, {from: admin});

    });

    it("Check state variable", async () => {
        chai.expect(await this.dsa.getLPToken()).to.be.equal(this.lpToken.address);
        chai.expect(await this.dsa.exchangeRate()).to.be.bignumber.equal(web3.utils.toWei("1"));
    });

    it("Check zero addresses", async () => {
        await expectRevert(
            DSA.new(ZERO_ADDRESS, this.lpToken.address, admin, {from: admin}),
            "DSA: OKS is zero address"
        );
        await expectRevert(
            DSA.new(this.oks.address, ZERO_ADDRESS, admin, {from: admin}),
            "DSA: LPToken is zero address"
        );
        await expectRevert(
            DSA.new(this.oks.address, this.lpToken.address, ZERO_ADDRESS, {from: admin}),
            "Owned: Owner address cannot be 0"
        );
    });

    it("acceptOwnership by owner", async () => {
        let token = await LPToken.new("TOKEN", "TKN", {from: admin});
        await token.nominateNewOwner(this.dsa.address, {from: admin});
        await this.dsa.acceptOwnership(token.address, {from: admin});
    });

    it("acceptOwnership by non-owner", async () => {
        let token = await LPToken.new("TOKEN", "TKN", {from: admin});
        await token.nominateNewOwner(this.dsa.address, {from: admin});
        await expectRevert(
            this.dsa.acceptOwnership(token.address, {from: user1}),
            "Owned: Only the contract owner may perform this action"
        );
    });

    it("notifyRewardAmount by rewardDistribution address", async () => {
        await this.dsa.notifyRewardAmount(new BN("100"),{from: rewardDistributor});
        chai.expect(await this.dsa.rewardLeft()).to.be.bignumber.equal("100");
    });

    it("notifyRewardAmount by non-rewardDistribution address", async () => {
        await expectRevert(
            this.dsa.notifyRewardAmount(new BN("100"),{from: admin}),
            "DSA: only reward distribution contract is allowed"
        );
        chai.expect(await this.dsa.rewardLeft()).to.be.bignumber.equal("0");
    });

    it("claimFees test", async () => {
        await this.dsa.claimFees({from: admin});
        await this.dsa.claimFees({from: user1});
        await this.dsa.claimFees({from: user3});
    });

    it("Check if reward accumulates when LP token supply is zero", async () => {
        await this.dsa.notifyRewardAmount(new BN("100"),{from: rewardDistributor});
        await time.increase(7*24*3600);
        await this.dsa.notifyRewardAmount(new BN("101"),{from: rewardDistributor});
        await time.increase(7*24*3600);
        chai.expect(await this.dsa.rewardLeft()).to.be.bignumber.equal("201");
    });

    it("Check if reward accumulates when LP token supply is zero", async () => {
        await this.dsa.notifyRewardAmount(new BN("100"),{from: rewardDistributor});
        await time.increase(7*24*3600);
        await this.dsa.notifyRewardAmount(new BN("101"),{from: rewardDistributor});
        await time.increase(7*24*3600);
        chai.expect(await this.dsa.rewardLeft()).to.be.bignumber.equal("201");
    });

    it("Check if staker does not get extra reward after the reward duration", async () => {
        let rewardAmount = new BN("300");
        let stakeAmount = new BN("100");

        await this.oksProxy.mint(this.dsa.address, rewardAmount, {from: admin});
        await this.dsa.notifyRewardAmount(rewardAmount, {from: rewardDistributor});
        await this.oksProxy.approve(this.dsa.address, stakeAmount, {from: user1});
        
        let balanceBefore = await this.oks.balanceOf(user1);
        
        await this.dsa.stake(stakeAmount, {from: user1});
        await time.increase(8*24*3600);
        await this.dsa.withdraw(await this.lpToken.balanceOf(user1), {from: user1});

        let balanceAfter = await this.oks.balanceOf(user1);
        chai.expect(balanceAfter.sub(balanceBefore)).to.be.bignumber.equal(rewardAmount);
        chai.expect(await this.dsa.rewardLeft()).to.be.bignumber.equal("0");
    });

    it("Check reward with two users staking at the same time", async () => {
        let rewardAmount = new BN("300");
        let stakeAmount = new BN("100");

        await this.oksProxy.mint(this.dsa.address, rewardAmount, {from: admin});
        await this.dsa.notifyRewardAmount(rewardAmount, {from: rewardDistributor});

        await this.oksProxy.approve(this.dsa.address, stakeAmount, {from: user1});
        await this.oksProxy.approve(this.dsa.address, stakeAmount, {from: user2});
            
        let balanceBefore1 = await this.oks.balanceOf(user1);
        let balanceBefore2 = await this.oks.balanceOf(user2);

        await this.dsa.stake(stakeAmount, {from: user1});
        await this.dsa.stake(stakeAmount, {from: user2});

        await time.increase(8*24*3600);

        await this.dsa.withdraw(await this.lpToken.balanceOf(user1), {from: user1});
        await this.dsa.withdraw(await this.lpToken.balanceOf(user2), {from: user2});

        let balanceAfter1 = await this.oks.balanceOf(user1);
        let balanceAfter2 = await this.oks.balanceOf(user2);
        chai.expect(balanceAfter1.sub(balanceBefore1)).to.be.bignumber.equal(balanceAfter2.sub(balanceBefore2));
    });

    it("Check generated incomes with two deposit", async () => {
        let rewardAmount = new BN("300");
        let stakeAmount = new BN("100");

        await this.oksProxy.mint(this.dsa.address, rewardAmount, {from: admin});
        await this.dsa.notifyRewardAmount(rewardAmount, {from: rewardDistributor});

        await this.oksProxy.approve(this.dsa.address, stakeAmount, {from: user1});
        await this.oksProxy.approve(this.dsa.address, stakeAmount, {from: user2});

        let balanceBefore1 = await this.oks.balanceOf(user1);
        let balanceBefore2 = await this.oks.balanceOf(user2);

        await this.dsa.stake(stakeAmount, {from: user1});
        await this.dsa.stake(stakeAmount, {from: user2});

        await time.increase(8*24*3600);

        await this.oksProxy.mint(this.dsa.address, rewardAmount, {from: admin});
        await this.dsa.notifyRewardAmount(rewardAmount, {from: rewardDistributor});

        await time.increase(8*24*3600);

        await this.dsa.withdraw(await this.lpToken.balanceOf(user1), {from: user1});
        await this.dsa.withdraw(await this.lpToken.balanceOf(user2), {from: user2});

        chai.expect(await this.dsa.rewardLeft()).to.be.bignumber.equal("0");

        let balanceAfter1 = await this.oks.balanceOf(user1);
        let balanceAfter2 = await this.oks.balanceOf(user2);
        
        chai.expect(balanceAfter1.sub(balanceBefore1)).to.be.bignumber.closeTo(balanceAfter2.sub(balanceBefore2),"5");
    });


    it("Check reward with three users staking at different times", async () => {
        let rewardAmount = new BN(web3.utils.toWei("7"));
        let stakeAmount = new BN(web3.utils.toWei("1"));

        await this.oksProxy.mint(this.dsa.address, rewardAmount, {from: admin});
        await this.dsa.notifyRewardAmount(rewardAmount, {from: rewardDistributor});

        let balanceBefore1 = await this.oks.balanceOf(user1);
        let balanceBefore2 = await this.oks.balanceOf(user2);
        let balanceBefore3 = await this.oks.balanceOf(user3);

        await this.oksProxy.approve(this.dsa.address, stakeAmount, {from: user1});
        await this.oksProxy.approve(this.dsa.address, stakeAmount, {from: user2});
        await this.oksProxy.approve(this.dsa.address, stakeAmount, {from: user3});

        await this.dsa.stake(stakeAmount, {from: user1});
        await time.increase(1*24*3600);

        await this.dsa.stake(stakeAmount, {from: user2});
        await time.increase(1*24*3600);

        await this.dsa.stake(stakeAmount, {from: user3});
        await time.increase(6*24*3600);

        await this.dsa.withdraw(await this.lpToken.balanceOf(user1), {from: user1});
        await this.dsa.withdraw(await this.lpToken.balanceOf(user2), {from: user2});
        await this.dsa.withdraw(await this.lpToken.balanceOf(user3), {from: user3});

        let balanceAfter1 = await this.oks.balanceOf(user1);
        let balanceAfter2 = await this.oks.balanceOf(user2);
        let balanceAfter3 = await this.oks.balanceOf(user3);

        chai.expect(balanceAfter1.sub(balanceBefore1)).to.be.bignumber.closeTo("4333333333333333300","100000000000000");
        chai.expect(balanceAfter2.sub(balanceBefore2)).to.be.bignumber.closeTo("1666666666666666600","100000000000000");
        chai.expect(balanceAfter3.sub(balanceBefore3)).to.be.bignumber.closeTo("999999999999999900","100000000000000");
    });

    it("Withdraw and distribute escrowed OKS reward", async () => {
        let stakeAmount = new BN(web3.utils.toWei("1"));

        let balanceBefore1 = await this.oks.balanceOf(user1);
        let balanceBefore2 = await this.oks.balanceOf(user2);
        let balanceBefore3 = await this.oks.balanceOf(user3);

        await this.oksProxy.approve(this.dsa.address, stakeAmount, {from: user1});
        await this.oksProxy.approve(this.dsa.address, stakeAmount, {from: user2});
        await this.oksProxy.approve(this.dsa.address, stakeAmount, {from: user3});


        chai.expect(await this.dsa.rewardLeft()).to.be.bignumber.equal("0");
        await this.dsa.withdrawEscrowedReward();
        chai.expect(await this.dsa.rewardLeft()).to.be.bignumber.equal(web3.utils.toWei("7"));

        await this.dsa.stake(stakeAmount, {from: user1});
        await time.increase(1*24*3600);

        await this.dsa.stake(stakeAmount, {from: user2});
        await time.increase(1*24*3600);

        await this.dsa.stake(stakeAmount, {from: user3});
        await time.increase(5*24*3600+1);

        await this.dsa.withdraw(await this.lpToken.balanceOf(user1), {from: user1});
        await this.dsa.withdraw(await this.lpToken.balanceOf(user2), {from: user2});
        await this.dsa.withdraw(await this.lpToken.balanceOf(user3), {from: user3});

        let balanceAfter1 = await this.oks.balanceOf(user1);
        let balanceAfter2 = await this.oks.balanceOf(user2);
        let balanceAfter3 = await this.oks.balanceOf(user3);

        chai.expect(balanceAfter1.sub(balanceBefore1)).to.be.bignumber.closeTo("4333333333333333300","100000000000000");
        chai.expect(balanceAfter2.sub(balanceBefore2)).to.be.bignumber.closeTo("1666666666666666600","100000000000000");
        chai.expect(balanceAfter3.sub(balanceBefore3)).to.be.bignumber.closeTo("999999999999999900","100000000000000");
    });
});