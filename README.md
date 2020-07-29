# Staking-contracts

## Description

Staking OKS is a fairly complicated process with numerous strategies to optimise yield and reduce risk. 

The effort and skill required to optimally stake OKS presents an opportunity for staking pools managed by community members with fee structures based on performance. This is a fully decentralized non-custodial staking pool were all fund movements will be defined through smart contracts logic. 

Users not familliar with OKS ecosystem will have to stake their OKS in one of the deployed pools and the mangers will handle the strategies to optimize the yields.

The pool participants will deposit OKS and receive a pool tokens equivalent to their stake share, after a specific period of time the users will be able to withdrawal their OKS + staking reward by burning the previously minted pool tokens.  

The pool managers will be able to 

- Mint/ burn with pooled OKS
- Collect & distribute fees
- Deposit to AMM pools
- Call exchange
- Set fee structure % of fees, or % of OKS staked or some combination of the two

## Setup

### Dependencies

* node v10.20.1
* npm 6.14.4

### Installation

```console
$ git clone https://github.com/oikos-cash/staking-contracts.git
$ cd staking-contracts
$ npm install
```

### Tests

#### Verification

```console
$ npm run test:contracts
```

To report gas consumption use the following command:

```console
$ npm run test:contracts:report
```

##### Coverage

To check unit test coverage run the following command:

```console
$ npm run test:coverage
```

