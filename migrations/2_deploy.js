
var Vault = artifacts.require("Vault");
var LPToken = artifacts.require("LPToken");
var StakingPool = artifacts.require("StakingPool");
var StakingPoolFactory = artifacts.require("StakingPoolFactory");
var StakingPoolFactoryProxy = artifacts.require("StakingPoolFactoryProxy");
var StakingPoolFactoryStorage = artifacts.require("StakingPoolFactoryStorage");

const TronWeb = require("tronweb");

module.exports = async (deployer, network, owner) => {
    if((network === "shasta" || network === "mainnet") && 
        process.argv.indexOf("--deploy") != -1) 
    {
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

        const tronWeb = new TronWeb({fullHost: fullHostURL}, privateKey);
        tronWeb.setPrivateKey(privateKey);
        tronWeb.setAddress(owner);

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

            await stakingPoolFactoryStorage.setOKS(oksProxyAddr, {from: owner});
            await stakingPoolFactoryStorage.setUniswapFactory(swapFactoryAddr, {from: owner});

            var stakingPoolFactoryProxy = await StakingPoolFactoryProxy.deployed();

            var lastPromise = deployer.deploy(
                StakingPoolFactory, 
                stakingPoolFactoryStorage.address,
                stakingPoolFactoryProxy.address,
                owner,
                {from: owner}
            );
            await lastPromise;

            var stakingPoolFactory = await StakingPoolFactory.deployed();
            
            await stakingPoolFactoryProxy.setTarget(stakingPoolFactory.address, {from: owner});
            await stakingPoolFactoryStorage.nominateNewOwner(stakingPoolFactory.address, {from: owner});
            await stakingPoolFactory.acceptContractOwnership(stakingPoolFactoryStorage.address, {from: owner});
            
            return lastPromise;
        });
    }
};