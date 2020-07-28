
const {
    BN, 
    time,
    constants,
    expectEvent,
    expectRevert
} = require("@openzeppelin/test-helpers");
const BigNumber = require("bignumber.js");

const chai = require("chai");

chai.use(require("chai-bn")(BN));

const { expect } = require("chai");
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

const LPToken = artifacts.require("LPToken");

// const {
//   shouldBehaveLikeERC20,
//   shouldBehaveLikeERC20Transfer,
//   shouldBehaveLikeERC20Approve,
// } = require('./behavior/ERC20.behavior');

contract("LPToken", (accounts) => {

    const [ initialHolder, recipient, anotherAccount ] = accounts;
    const name = "Token";
    const symbol = "TKN";
    const initialSupply = new BN(60000);
    
    beforeEach(async () => {
        this.token = await LPToken.new(name, symbol, { from: initialHolder });
        this.token.mint(initialHolder, initialSupply, { from: initialHolder });
    });

    it("check name", async () => {
        expect(await this.token.name()).to.equal(name);
    });

    it("check symbol", async () => {
        expect(await this.token.symbol()).to.equal(symbol);
    });

    it("check decimals", async () => {
        expect(await this.token.decimals()).to.be.bignumber.equal("18");
    });


    it("check total supply", async () => {
        expect(await this.token.totalSupply()).to.be.bignumber.equal(initialSupply);
    });

    it("check balanceOf", async () => {
        expect(await this.token.balanceOf(anotherAccount)).to.be.bignumber.equal("0");
        expect(await this.token.balanceOf(initialHolder)).to.be.bignumber.equal(initialSupply);
    });

    it("check getStakingPool (in this case owner)", async () => {
        expect(await this.token.getStakingPool()).to.be.equal(initialHolder);
    });

    it("transfer: when the sender does not have enough balance", async () => {
        const from = initialHolder;
        const to = anotherAccount;
        const amount = initialSupply.addn(1);

        await expectRevert(
            this.token.transfer(to, amount, { "from": from}),
            "SafeMath: subtraction overflow"
        );
    });

    it("transfer: when the sender transfers all balance", async () => {
        const from = initialHolder;
        const to = anotherAccount;
        const amount = initialSupply;
        let balance = await this.token.balanceOf(from);

        const { logs } = await this.token.transfer(to, amount, { "from": from});
        expect(await this.token.balanceOf(from)).to.be.bignumber.equal(balance.sub(amount));
        expect(await this.token.balanceOf(to)).to.be.bignumber.equal(amount);
        expect(await this.token.totalSupply()).to.be.bignumber.equal(initialSupply);
        expectEvent.inLogs(logs, "Transfer", {
            from,
            to,
            value: amount,
        });
    });

    it("transfer: when the sender transfers zero token", async () => {
        const from = initialHolder;
        const to = anotherAccount;
        const amount = new BN("0");
        const balance = await this.token.balanceOf(from);

        const { logs } = await this.token.transfer(to, amount, { "from": from});
        expect(await this.token.balanceOf(from)).to.be.bignumber.equal(balance);
        expect(await this.token.balanceOf(to)).to.be.bignumber.equal("0");
        expect(await this.token.totalSupply()).to.be.bignumber.equal(initialSupply);
        expectEvent.inLogs(logs, "Transfer", {
            from: from,
            to: to,
            value: amount,
        });
    });

    it("transfer: when the recipient is the zero address", async () => {
        const from = initialHolder;
        const to = ZERO_ADDRESS;
        const amount = new BN("0");
        await expectRevert(
            this.token.transfer(to, amount, { "from": from}),
            "ERC20: to is zero address"
        );
    });

    it("approve: approve the requested amount", async () => {
        const amount = initialSupply;
        const owner = initialHolder;
        const spender = recipient;
        const { logs } = await this.token.approve(spender, amount, { from: owner});
        expect(await this.token.allowance(owner, spender)).to.be.bignumber.equal(amount);
        expectEvent.inLogs(logs, "Approval", {
            owner: owner,
            spender: spender,
            value: amount,
        });
    });

    it("approve: replace the previous approved amount", async () => {
        const amount = initialSupply;
        const owner = initialHolder;
        const spender = ZERO_ADDRESS;
        await expectRevert(
            this.token.approve(spender, amount, { from: owner}),
            "ERC20: spender is zero address"
        );
    });

    it("transferFrom: emits an approval event", async () => {
        const from = initialHolder;
        const tokenOwner = initialHolder;
        const spender = recipient;
        const to = anotherAccount;
        const amount = initialSupply;

        await this.token.approve(spender, initialSupply, { from: initialHolder });

        const { logs } = await this.token.transferFrom(tokenOwner, to, amount, { from: spender });
        expectEvent.inLogs(logs, "Approval", {
            owner: tokenOwner,
            spender: spender,
            value: await this.token.allowance(tokenOwner, spender),
        });
    });

    it("transferFrom: transfer the requested amount", async () => {
        const from = initialHolder;
        const tokenOwner = initialHolder;
        const spender = recipient;
        const to = anotherAccount;
        const amount = initialSupply;
        await this.token.approve(spender, initialSupply, { from: initialHolder });
        const { logs } = await this.token.transferFrom(tokenOwner, to, amount, { from: spender });
        expect(await this.token.balanceOf(tokenOwner)).to.be.bignumber.equal("0");
        expect(await this.token.balanceOf(to)).to.be.bignumber.equal(amount);
        expect(await this.token.allowance(tokenOwner, spender)).to.be.bignumber.equal("0");
        expectEvent.inLogs(logs, "Transfer", {
            from: tokenOwner,
            to: to,
            value: amount,
        });
    });

    it("transferFrom: transfer the requested amount when the token owner does not have enough balance", async () => {
        const from = initialHolder;
        const tokenOwner = initialHolder;
        const spender = recipient;
        const to = anotherAccount;
        const amount = initialSupply.addn(1);
        await this.token.approve(spender, initialSupply, { from: initialHolder });
        await expectRevert(this.token.transferFrom(
            tokenOwner, to, amount, { from: spender }), 
        "SafeMath: subtraction overflow"
        );
    });

    it("transferFrom: transfer the requested amount when the spender does not have enough approved balance", async () => {
        const from = initialHolder;
        const tokenOwner = initialHolder;
        const spender = recipient;
        const to = anotherAccount;
        const amount = initialSupply;
        await this.token.approve(spender, initialSupply.subn(1), { from: initialHolder });

        await expectRevert(this.token.transferFrom(
            tokenOwner, to, amount, { from: spender }), 
        "SafeMath: subtraction overflow"
        );
    });

    it("transferFrom: transfer the requested amount when the recipient is ZERO ADDRESS", async () => {
        const from = initialHolder;
        const tokenOwner = initialHolder;
        const spender = recipient;
        const to = ZERO_ADDRESS;
        const amount = initialSupply;
        await this.token.approve(spender, initialSupply, { from: initialHolder });

        await expectRevert(this.token.transferFrom(
            tokenOwner, to, amount, { from: spender }), 
        "ERC20: to is zero address"
        );
    });

    it("transferFrom: tranfer the requested amount when the token owner is the zero address", async () => {
        const tokenOwner = ZERO_ADDRESS;
        const spender = recipient;
        const to = anotherAccount;
        const amount = initialSupply;
        await expectRevert(this.token.transferFrom(
            tokenOwner, to, amount, { from: spender }), 
        "SafeMath: subtraction overflow"
        );
    });

    it("decreaseAllowance: decrease allowance when there was no approved amount before reverts", async () => {
        const spender = anotherAccount;
        const amount = 1;
        await expectRevert(
            this.token.decreaseAllowance(spender, amount, { from: initialHolder }), 
            "SafeMath: subtraction overflow"
        );
    });

    it("decreaseAllowance: decrease the spender allowance by subtracting a requested amount", async () => {
        const spender = anotherAccount;
        const approvedAmount = initialSupply;
        await this.token.approve(spender, approvedAmount, { from: initialHolder });
        await this.token.decreaseAllowance(spender, approvedAmount.subn(1), { from: initialHolder });
        expect(await this.token.allowance(initialHolder, spender)).to.be.bignumber.equal("1");
    });

    it("decreaseAllowance: sets the allowance to zero when all allowance is removed", async () => {
        const spender = anotherAccount;
        const approvedAmount = initialSupply;
        await this.token.approve(spender, approvedAmount, { from: initialHolder });
        await this.token.decreaseAllowance(spender, approvedAmount, { from: initialHolder });
        await this.token.decreaseAllowance(spender, 0, { from: initialHolder });
        expect(await this.token.allowance(initialHolder, spender)).to.be.bignumber.equal("0");   
    });

    it("decreaseAllowance: decrease allowance when the spender had an approved amount", async () => {
        const spender = anotherAccount;
        const approvedAmount = initialSupply;
        await this.token.approve(spender, approvedAmount, { from: initialHolder });
        const { logs } = await this.token.decreaseAllowance(spender, approvedAmount, { from: initialHolder });

        expectEvent.inLogs(logs, "Approval", {
            "owner": initialHolder,
            "spender": spender,
            "value": new BN(0),
        });
    });

    it("decreaseAllowance: reverts when more than the full allowance is removed using decreaseAllowance", async () => {
        const spender = anotherAccount;
        const approvedAmount = initialSupply;
        await this.token.approve(spender, approvedAmount, { from: initialHolder });
        await expectRevert(
            this.token.decreaseAllowance(spender, approvedAmount.addn(1), { from: initialHolder }),
            "SafeMath: subtraction overflow"
        );
    });

    it("decreaseAllowance: decrease allowance when the spender is the zero address", async () => {
        const spender = anotherAccount;
        const approvedAmount = initialSupply;

        await expectRevert(
            this.token.decreaseAllowance(spender, approvedAmount, { from: initialHolder }), 
            "SafeMath: subtraction overflow"
        );
    });

    it("burn: revert on zero address", async () => {
        await expectRevert(
            this.token.burn(ZERO_ADDRESS, new BN(1), { from: initialHolder }),
            "ERC20: account is zero address"
        );
    });

    it("burn: revert burning more than balance", async () => {
        await expectRevert(
            this.token.burn(initialHolder, initialSupply.addn(1), { from: initialHolder }), 
            "SafeMath: subtraction overflow"
        );
    });

    it("burn: allow only contract owner", async () => {
        await expectRevert(
            this.token.burn(initialHolder, initialSupply, { from: anotherAccount }),
            "Owned: Only the contract owner may perform this action"
        );

        await this.token.burn(initialHolder, initialSupply, { from: initialHolder });
        expect(await this.token.balanceOf(initialHolder)).to.be.bignumber.equal("0");
    });

    it("burn: check event", async () => {
        const { logs } = await this.token.burn(initialHolder, initialSupply, { from: initialHolder });
        expectEvent.inLogs(logs, "Transfer", {
            "from": initialHolder,
            "to": ZERO_ADDRESS,
            "value": initialSupply,
        });
    });

    it("burn: check totalSupply", async () => {
        const amount = initialSupply.subn(100);
        const { logs } = await this.token.burn(initialHolder, amount, { from: initialHolder });
        expectEvent.inLogs(logs, "Transfer", {
            "from": initialHolder,
            "to": ZERO_ADDRESS,
            "value": amount,
        });
        expect(await this.token.totalSupply()).to.be.bignumber.equal(initialSupply.sub(amount));
    });

    it("mint: revert on zero address", async () => {
        await expectRevert(
            this.token.mint(ZERO_ADDRESS, new BN(1), { from: initialHolder }),
            "ERC20: account is zero address"
        );
    });

    it("mint: revert on minting more than MAX_UINT", async () => {
        const MAX_UINT = BigNumber(2).pow(256).minus(1).toString(10);
        await expectRevert(
            this.token.mint(initialHolder, MAX_UINT, { from: initialHolder }), 
            "SafeMath: addition overflow"
        );
    });

    it("mint: allow only contract owner", async () => {
        await expectRevert(
            this.token.mint(initialHolder, initialSupply, { from: anotherAccount }),
            "Owned: Only the contract owner may perform this action"
        );
        await this.token.mint(initialHolder, initialSupply, { from: initialHolder });
        expect(await this.token.balanceOf(initialHolder)).to.be.bignumber.equal(initialSupply.add(initialSupply));
    });

    it("mint: check event", async () => {
        const { logs } = await this.token.mint(initialHolder, initialSupply, { from: initialHolder });
        expectEvent.inLogs(logs, "Transfer", {
            "from": ZERO_ADDRESS,
            "to": initialHolder,
            "value": initialSupply,
        });
    });

    it("mint: check totalSupply", async () => {
        const amount = initialSupply.subn(100);
        const { logs } = await this.token.mint(initialHolder, amount, { from: initialHolder });
        expectEvent.inLogs(logs, "Transfer", {
            "from": ZERO_ADDRESS,
            "to": initialHolder,
            "value": amount,
        });
        expect(await this.token.totalSupply()).to.be.bignumber.equal(initialSupply.add(amount));
    });

    it("increaseAllowance: emits an approval event", async () => {
        const owner = initialHolder;
        const tokenOwner = initialHolder;
        const spender = recipient;
        const amount = initialSupply;
        const { logs } = await this.token.increaseAllowance(spender, amount, { from: tokenOwner });
        expectEvent.inLogs(logs, "Approval", {
            owner: initialHolder,
            spender: spender,
            value: amount,
        });
    });

    it("increaseAllowance: approve requested amount", async () => {
        const owner = initialHolder;
        const tokenOwner = initialHolder;
        const spender = recipient;
        const amount = initialSupply;
        await this.token.increaseAllowance(spender, amount, { from: tokenOwner });
        expect(await this.token.allowance(initialHolder, spender)).to.be.bignumber.equal(amount);
    });

    it("increaseAllowance: increase the spender allowance by adding a requested amount", async () => {
        const owner = initialHolder;
        const tokenOwner = initialHolder;
        const spender = recipient;
        const amount = initialSupply;
        await this.token.approve(spender, new BN(1), { from: tokenOwner });
        await this.token.increaseAllowance(spender, amount, { from: initialHolder });
        expect(await this.token.allowance(initialHolder, spender)).to.be.bignumber.equal(amount.addn(1));
    });

    it("increaseAllowance: increase the spender allowance when the spender is the zero address", async () => {
        const owner = initialHolder;
        const tokenOwner = initialHolder;
        const spender = ZERO_ADDRESS;
        const amount = initialSupply;
        await expectRevert(
            this.token.increaseAllowance(spender, amount, { from: tokenOwner }), 
            "ERC20: spender is zero address"
        );
    });

    it("increaseAllowance: increase the spender allowance by MAX_UINT", async () => {
        const owner = initialHolder;
        const tokenOwner = initialHolder;
        const spender = recipient;
        const MAX_UINT = BigNumber(2).pow(256).minus(1).toString(10);
        await this.token.increaseAllowance(spender, new BN(1), { from: tokenOwner });
        await expectRevert(
            this.token.increaseAllowance(spender, MAX_UINT, { from: tokenOwner }), 
            "SafeMath: addition overflow"
        );
    });
});





