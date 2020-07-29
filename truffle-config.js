

options = {
    plugins: [
        "solidity-coverage"
    ],

    networks: {
    },

    compilers: {
        solc: {
            version: "0.5.10", 
        }
    }
};

let reporterArg = process.argv.indexOf("--report");

if (reporterArg !== -1) {
    options["mocha"] = {
        reporter: "eth-gas-reporter",
        reporterOptions : {
            currency: "USD",
            excludeContracts: ["Migrations"],
        }
    };
}

module.exports = options;