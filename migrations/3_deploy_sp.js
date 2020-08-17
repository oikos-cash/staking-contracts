
var Vault = artifacts.require("Vault");
var LPToken = artifacts.require("LPToken");
var StakingPool = artifacts.require("StakingPool");
var StakingPoolFactory = artifacts.require("StakingPoolFactory");
var StakingPoolFactoryProxy = artifacts.require("StakingPoolFactoryProxy");

const TronWeb = require("tronweb");

module.exports = async (deployer, network, owner) => {
    if((network === "shasta" || network === "mainnet") && 
        process.argv.indexOf("--deploySP") != -1 &&
        process.argv.indexOf("--poolName") != -1 &&
        process.argv.indexOf("--tokenName") != -1 &&
        process.argv.indexOf("--tokenSymbol") != -1 &&
        process.argv.indexOf("--stakingPoolOwner") != -1
    ) {
        var privateKey;
        var fullHostURL;
        var oksProxyAddr;
        var swapFactoryAddr;
        
        if(network === "shasta") {
            privateKey = process.env.PRIVATE_KEY_SHASTA;
            fullHostURL ="https://api.shasta.trongrid.io";
            oksProxyAddr = process.env.PROXY_OKS_SHASTA;
            swapFactoryAddr = process.env.SWAP_FACTORY_SHASTA;
        }

        if(network === "mainnet") {
            privateKey = process.env.PRIVATE_KEY_MAINNET;
            fullHostURL ="https://api.trongrid.io";
            oksProxyAddr = process.env.PROXY_OKS_MAINNET;
            swapFactoryAddr = process.env.SWAP_FACTORY_MAINNET;
        }

        var poolName = process.argv[process.argv.indexOf("--poolName")+1];
        var tokenName = process.argv[process.argv.indexOf("--tokenName")+1];
        var tokenSymbol = process.argv[process.argv.indexOf("--tokenSymbol")+1];
        var stakingPoolOwner = process.argv[process.argv.indexOf("--stakingPoolOwner")+1];

        const tronWeb = new TronWeb({fullHost: fullHostURL}, privateKey);
        tronWeb.setPrivateKey(privateKey);
        tronWeb.setAddress(owner);

        var stakingPoolFactoryProxy;
        var stakingPoolFactory;
        
        if(network === "mainnet") {
            stakingPoolFactoryProxy = await tronWeb.contract().at(process.env.MAINNET_STAKINGPOOLFACTORY_PROXY);
            stakingPoolFactory = await tronWeb.contract().at(await stakingPoolFactoryProxy.target().call());
        } 

        if(network === "shasta") {
            stakingPoolFactoryProxy = await tronWeb.contract().at(process.env.SHASTA_STAKINGPOOLFACTORY_PROXY);
            stakingPoolFactory = await tronWeb.contract().at(await stakingPoolFactoryProxy.target().call());
        } 

        await deployer.deploy(
            Vault,
            {from: owner}
        ).then( async () => {
            await deployer.deploy(LPToken, tokenName, tokenSymbol, {from: owner});

            var vault = await Vault.deployed();
            var token = await LPToken.deployed();

            await vault.nominateNewOwner(stakingPoolFactory.address, {from: owner});
            await token.nominateNewOwner(stakingPoolFactory.address, {from: owner});

            var lastPromise = deployer.deploy(
                StakingPool,
                poolName,
                stakingPoolFactoryProxy.address,
                stakingPoolFactory.address,
                vault.address,
                token.address,
                oksProxyAddr,
                1,
                stakingPoolOwner,
                {from: owner}
            );

            await lastPromise;
            var stakingPool = await StakingPool.deployed();
            await stakingPoolFactory.addStakingPool(vault.address, token.address, stakingPool.address).send({from: owner});
            var stakingPools = await stakingPoolFactory.getStakingPools().call();
            console.log(stakingPools);

            return lastPromise;
        });
    }
};