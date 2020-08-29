
var Vault = artifacts.require("Vault");
var LPToken = artifacts.require("LPToken");
var StakingPool = artifacts.require("StakingPool");
var StakingPoolFactory = artifacts.require("StakingPoolFactory");
var StakingPoolFactoryProxy = artifacts.require("StakingPoolFactoryProxy");
var StakingPoolFactoryStorage = artifacts.require("StakingPoolFactoryStorage");

const TronWeb = require("tronweb");

module.exports = async (deployer, network, owner) => {
    if((network === "shasta" || network === "mainnet") &&
        process.argv.indexOf("--upgradeSP") != -1 &&
        process.argv.indexOf("--deploy") == -1 &&
        process.argv.indexOf("--poolAddress") != -1
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

        var oldPoolAddress = process.argv[process.argv.indexOf("--poolAddress")+1];

        const tronWeb = new TronWeb({fullHost: fullHostURL}, privateKey);
        tronWeb.setPrivateKey(privateKey);
        tronWeb.setAddress(owner);

        var stakingPoolFactoryProxy;
        var stakingPoolFactoryStorage;

        var oldStakingPool = await tronWeb.contract().at(oldPoolAddress);
        
        if(network === "mainnet") {
            stakingPoolFactoryProxy = await tronWeb.contract().at(process.env.MAINNET_STAKINGPOOLFACTORY_PROXY);
            stakingPoolFactory = await tronWeb.contract().at(await stakingPoolFactoryProxy.target().call());
        } 

        if(network === "shasta") {
            stakingPoolFactoryProxy = await tronWeb.contract().at(process.env.SHASTA_STAKINGPOOLFACTORY_PROXY);
            stakingPoolFactory = await tronWeb.contract().at(await stakingPoolFactoryProxy.target().call());
        } 

        await deployer.deploy(
            StakingPool,
            await oldStakingPool.name().call(),
            stakingPoolFactoryProxy.address,
            oldStakingPool.address,
            await oldStakingPool.getVault().call(),
            await oldStakingPool.getLPToken().call(),
            oksProxyAddr,
            (await oldStakingPool.getVersion().call()).add(1),
            await oldStakingPool.owner().call(),
            {from: owner}
        ).then( async () => {
            var newStakingPool = await StakingPool.deployed();
            await stakingPoolFactory.replaceStakingPool(oldStakingPool.address, newStakingPool.address).send({from: owner});
        });
    }
};