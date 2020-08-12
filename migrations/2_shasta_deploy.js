
var Vault = artifacts.require("Vault");
var LPToken = artifacts.require("LPToken");
var StakingPoolFactoryProxy = artifacts.require("StakingPoolFactoryProxy");
var StakingPoolFactory = artifacts.require("StakingPoolFactory");
var StakingPoolFactoryStorage = artifacts.require("StakingPoolFactoryStorage");
const TronWeb = require("tronweb");


module.exports = async (deployer, network, account) => {
    if(network === "shasta") {

        const tronWeb = new TronWeb({fullHost: "https://api.shasta.trongrid.io"}, process.env.PRIVATE_KEY_SHASTA);
        var oksProxy = tronWeb.address.toHex("TSCfE2WrmrpyuK4JLicbJCfXzZnJJ2kdJJ");
        var swapFactory = tronWeb.address.toHex("TSCfE2WrmrpyuK4JLicbJCfXzZnJJ2kdJJ"); // should get the actual address.
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
            
            console.log("Test staking pools");
            console.log(await stakingPoolFactory.getStakingPools());
            return lastPromise;
        });
    }
};
