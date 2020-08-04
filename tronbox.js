
var port = process.env.HOST_PORT || 9090;

module.exports = {
    networks: {
        mainnet: {
            privateKey: process.env.PRIVATE_KEY_MAINNET,
            userFeePercentage: 100,
            feeLimit: 1e8,
            fullHost: "https://api.trongrid.io",
            network_id: "1"
        },
        shasta: {
            privateKey: process.env.PRIVATE_KEY_SHASTA,
            userFeePercentage: 50,
            feeLimit: 1e8,
            fullHost: "https://api.shasta.trongrid.io",
            network_id: "2"
        },
        development: {
            privateKey: "da146374a75310b9666e834ee4ad0866d6f4035967bfc76217c5a495fff9f0d0",
            userFeePercentage: 0,
            fullHost: "http://127.0.0.1:" + port,
            network_id: "9"
        }
    },
    compilers: {
        solc: {
            version: '0.5.10',
            settings: {
                optimizer: {
                    enabled: true,
                    runs: 200,
                }
            }
        }
    }
};
