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

##### Initial Setup

To deploy a demo to shasta network you should first set some required environment variables:

```console
$ export PROXY_OKS_SHASTA="address"
$ export SWAP_FACTORY_SHASTA="address"
$ export PRIVATE_KEY_SHASTA="private key"
```

Then run the following command to deploy all necessary contracts.

```console
$ npm run deploy:shasta
```

##### Staking Pool Deployment

Once the initial setup done, copy the "StakingPoolFactoryProxy" address and set is as an environment variable to be able to run the next step and deploy the staking pool.

```console
$ export SHASTA_STAKINGPOOLFACTORY_PROXY="address"
```

Multiple staking pools can be deployed, if the following command is used multiple times.

```console
$ npm run deploy:pool:shasta -- \
$ --poolName "staking pool name" \
$ --tokenName "liquidity token name" \
$ --tokenSymbol "liquidity token symbol" \
$ --stakingPoolOwner "pool manager address"
```

##### Staking Pool Upgrade

To upgrade any staking pool, run the following command with the staking pool address as argument.

```console
$ npm run upgrade:pool:shasta -- \
$ --poolAddress "TEd9QbiNNvF3yxMZxBkb5QVfcP7CK1h9hp"
```
##### Shasta Deployed Addresses

- `StakingPoolFactoryProxy`:
	- (base58) [TKzQCyKqkyRELv7m1qQBFUvd3iENM78Eow](https://shasta.tronscan.org/#/contract/TKzQCyKqkyRELv7m1qQBFUvd3iENM78Eow/code)
	- (hex) [416deb07104f58d9e26f3c90fd60074121d1310ac4](https://shasta.tronscan.org/#/contract/TKzQCyKqkyRELv7m1qQBFUvd3iENM78Eow/code)
- `StakingPoolFactory`:
	- (base58) [TDeunridmk3AtynFANeQ89uwsFZ8QXHVin](https://shasta.tronscan.org/#/contract/TDeunridmk3AtynFANeQ89uwsFZ8QXHVin/code)
	- (hex) [41286aa63ae9c95138768b1bd3846aa4dd50e672f9](https://shasta.tronscan.org/#/contract/TDeunridmk3AtynFANeQ89uwsFZ8QXHVin/code)
- `StakingPoolFactoryStorage`:
	- (base58) [TL9a4cDgwoah2eHWMvZc2tPMDVjd9d5wSZ](https://shasta.tronscan.org/#/contract/TL9a4cDgwoah2eHWMvZc2tPMDVjd9d5wSZ/code)
	- (hex) [416fa6ff9a8c2f9257806d32331b9edcca57bec75b](https://shasta.tronscan.org/#/contract/TL9a4cDgwoah2eHWMvZc2tPMDVjd9d5wSZ/code)