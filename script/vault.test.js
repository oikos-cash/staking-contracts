
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

contract("Vault", (accounts) => {
    let admin = accounts[0];
    let user1 = accounts[1];
    let user2 = accounts[2];
    
    beforeEach(async () => {
        this.vault = await Vault.new({ from: admin });
        this.token = await LPToken.new("TOKEN","TKN", { from: admin });
        this.token.mint(admin, new BN(60000), { from: admin });
    });

    it("Deployed successfully", async () => {
        chai.expect(await this.token.decimals()).to.be.bignumber.equal("18");
        chai.expect(await this.token.balanceOf.call(admin)).to.be.bignumber.greaterThan("1");
        chai.expect(await this.token.balanceOf.call(user1)).to.be.bignumber.equal("0");
        chai.expect(await this.vault.owner()).to.be.equal(admin);
        chai.expect(await this.vault.getStakingPool()).to.be.equal(admin);
    });

    it("Approve allowance", async () => {
        await this.token.transfer(this.vault.address, new BN(100), {from: admin});
        await this.vault.safeApprove(this.token.address, user1, new BN(90), {from: admin});
        chai.expect(await this.token.allowance(this.vault.address, user1)).to.be.bignumber.equal(new BN(90));
    });

    it("Approve allowance only owner", async () => {
        await this.token.transfer(this.vault.address, new BN(100), {from: admin});
        await expectRevert(
            this.vault.safeApprove(this.token.address, user1, new BN(90), {from: user1}),
            "Owned: Only the contract owner may perform this action"
        );
    });
    
    it("check transferFrom", async () => {
        await this.token.transfer(user1, new BN(100), {from: admin});
        await this.token.approve(this.vault.address, new BN(90), {from: user1});
        await this.vault.safeTransferFrom(this.token.address, user1, user2, new BN(80), { from: admin });
        chai.expect(await this.token.allowance(user1, this.vault.address)).to.be.bignumber.equal(new BN(10));
        chai.expect(await this.token.balanceOf(user2)).to.be.bignumber.equal(new BN(80));
    });

    it("check transferFrom only owner", async () => {
        await this.token.transfer(user1, new BN(100), {from: admin});
        await this.token.approve(this.vault.address, new BN(90), {from: user1});
        await expectRevert(
            this.vault.safeTransferFrom(this.token.address, user1, user2, new BN(80), { from: user1 }),
            "Owned: Only the contract owner may perform this action"
        );
    });

    it("check tranfer", async () => {
        await this.token.transfer(this.vault.address, new BN(100), {from: admin});
        await this.vault.safeTransfer(this.token.address, user1, new BN(80), { from: admin });        
        chai.expect(await this.token.balanceOf(this.vault.address)).to.be.bignumber.equal(new BN(20));
        chai.expect(await this.token.balanceOf(user1)).to.be.bignumber.equal(new BN(80));

    });

    it("check tranfer only owner", async () => {
        await this.token.transfer(this.vault.address, new BN(100), {from: admin});
        await expectRevert(
            this.vault.safeTransfer(this.token.address, user1, new BN(80), { from: user1 }),
            "Owned: Only the contract owner may perform this action"
        );
    });

    it("check TRX reception", async () => {
        await web3.eth.sendTransaction({ from: admin, to: this.vault.address, value: new BN(100)});
        chai.expect(await web3.eth.getBalance(this.vault.address)).to.be.bignumber.equal(new BN(100));
    });

    it("send TRX", async () => {
        await web3.eth.sendTransaction({ from: admin, to: this.vault.address, value: new BN(100)});
        chai.expect(await web3.eth.getBalance(this.vault.address)).to.be.bignumber.equal(new BN(100));
        const user1Balance = await web3.eth.getBalance(user1);
        await this.vault.safeTransferTrx(user1, new BN(100), { from: admin });
        chai.expect(await web3.eth.getBalance(user1)).to.be.bignumber.greaterThan(user1Balance);
        chai.expect(await web3.eth.getBalance(this.vault.address)).to.be.bignumber.equal(new BN(0));
    });

    it("send TRX only owner", async () => {
        await web3.eth.sendTransaction({ from: admin, to: this.vault.address, value: new BN(100)});
        chai.expect(await web3.eth.getBalance(this.vault.address)).to.be.bignumber.equal(new BN(100));

        await expectRevert(
            this.vault.safeTransferTrx(user1, new BN(100), { from: user1 }),
            "Owned: Only the contract owner may perform this action"
        );
    });
});