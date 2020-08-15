
var Vault = artifacts.require("Vault");
var LPToken = artifacts.require("LPToken");
var StakingPoolFactoryProxy = artifacts.require("StakingPoolFactoryProxy");
var StakingPoolFactory = artifacts.require("StakingPoolFactory");
var StakingPoolFactoryStorage = artifacts.require("StakingPoolFactoryStorage");
const TronWeb = require("tronweb");
const addresses = require("../addresses.js");

module.exports = async (deployer, network, account) => {
    if(network === "shasta" || network === "mainnet") {

        var privateKey;
        var fullHostURL;
        var oksProxyAddr;
        var swapFactoryAddr;
        
        if(network === "shasta") {
            privateKey = process.env.PRIVATE_KEY_SHASTA;
            fullHostURL ="https://api.shasta.trongrid.io";
            oksProxyAddr = addresses.oikos.SHASTA_ADDRESSES.ProxySynthetix;
            swapFactoryAddr = addresses.swap.shasta.factory;
        }

        if(network === "mainnet") {
            privateKey = process.env.PRIVATE_KEY_MAINNET;
            fullHostURL ="https://api.trongrid.io";
            oksProxyAddr = addresses.oikos.MAINNET_ADDRESSES.ProxySynthetix;
            swapFactoryAddr = addresses.swap.mainnet.factory;
        }

        const tronWeb = new TronWeb({fullHost: fullHostURL}, privateKey);
        tronWeb.setPrivateKey(privateKey);
        tronWeb.setAddress(account);

        var oksProxy = tronWeb.address.toHex(oksProxyAddr);
        var swapFactory = tronWeb.address.toHex(swapFactoryAddr); // should get the actual address.
        var owner = tronWeb.address.toHex(account);

        await deployer.deploy(
            StakingPoolFactoryStorage,
            {from: owner}
        ).then( async () => {
            var stakingPoolFactoryStorage = await StakingPoolFactoryStorage.deployed();
            await deployer.deploy(
                StakingPoolFactoryProxy,
                owner,
                {from: owner}
            );

            await stakingPoolFactoryStorage.setOKS(oksProxy, {from: owner});
            await stakingPoolFactoryStorage.setUniswapFactory(swapFactory, {from: owner});

            var stakingPoolFactoryProxy = await StakingPoolFactoryProxy.deployed();
            await deployer.deploy(
                StakingPoolFactory, 
                stakingPoolFactoryStorage.address,
                stakingPoolFactoryProxy.address,
                owner,
                {from: owner}
            );
            
            var stakingPoolFactory = await StakingPoolFactory.deployed();
            await stakingPoolFactoryProxy.setTarget(stakingPoolFactory.address, {from: owner});
            await stakingPoolFactoryStorage.nominateNewOwner(stakingPoolFactory.address, {from: owner});
            await stakingPoolFactory.acceptContractOwnership(stakingPoolFactoryStorage.address, {from: owner});

            await deployer.deploy(Vault, {from: owner});
            var lastPromise =  deployer.deploy(LPToken, "STKOKS", "ST1", {from: owner});
            await lastPromise;

            var vault = await Vault.deployed();
            var token = await LPToken.deployed();

            await vault.nominateNewOwner(stakingPoolFactory.address, {from: owner});
            await token.nominateNewOwner(stakingPoolFactory.address, {from: owner});
            await stakingPoolFactory.deployStakingPool("FIRSTPOOL", vault.address, token.address, owner, {from: owner});
            
            var stakingPools = await stakingPoolFactory.getStakingPools();
            console.log(stakingPools);

            var spfp = await tronWeb.contract().at(stakingPoolFactoryProxy.address);
            console.log(await spfp.getStakingPools().call());
            return lastPromise;
        });
    }
};
