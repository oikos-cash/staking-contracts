var Migrations = artifacts.require("./Migrations.sol");

module.exports = function(deployer) {
    deployer.deploy(Migrations);
};


module.exports = function(deployer, network) {
    if(network === "shasta") {
        deployer.deploy(Migrations);
    }
};