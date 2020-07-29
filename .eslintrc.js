module.exports = {
    root: true,
    extends: "eslint:recommended",
    parser: "babel-eslint",
    env: {
        node: true,
        es2017: true
    },

    rules: {
        "no-undef": 0,
        "no-unused-vars": 0,
        "indent": [
            "error",
            4
        ],
        "linebreak-style": [
            "error",
            "unix"
        ],
        "quotes": [
            "error",
            "double"
        ],
        "semi": [
            "error",
            "always"
        ]
    }
};