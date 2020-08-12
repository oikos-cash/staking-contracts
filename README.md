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

### Deployment

Please note that using `StakingPoolFactoryProxy` address is sufficient to get all required information needed for the UI.
`StakingPoolFactoryProxy` will remain unchanged in the opposite of `StakingPoolFactory` and all the deployed pools that can be upgraded.

#### Shasta

To deploy a demo to shasta network you should first set your private key as environment variable:

```console
$ export PRIVATE_KEY_SHASTA="put your private key here"
```

Then run the following command to deploy all necessary contracts & createa test staking pool.

```console
$ npm run deploy:shasta
```

#### Shasta Deployed Addresses

- `StakingPoolFactoryProxy`:
	- (base58) TRb4pHtG8ABTFHb6vT28QSgESGvjtFt8L3
	- (hex) 41ab5207422bffce8ab715286ae014c9f38f4eaf2e
- `StakingPoolFactory`:
	- (base58) TZHneLZLAb1HziXFPDMcoXYt2vYTSogb9x
	- (hex) 41ffce76c1339ac2fd3d4c9aec80b1acbe9d90788b
- `StakingPoolFactoryStorage`:
	- (base58) TU9EyBta7A6AWAPnEzmnF7f1F322H4UENU
	- (hex) 41c75810fa765751dd4da6d787fb1e8701e23990ac
- `StakingPool`:
	- (base58) NQyFiSBphAi2hbcbGGBgw9CYkX4xJk9Qn
	- (hex) EAe32ab37df06b38aCb23F8771C259f64f8d86Cb