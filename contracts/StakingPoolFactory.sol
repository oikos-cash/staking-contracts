pragma solidity ^0.5.0;

import "./utility/Proxyable.sol";
import "./StakingPool.sol";
import "./Vault.sol";
import "./LPToken.sol";
import "./interfaces/IStakingPoolFactory.sol";
import "./interfaces/IStakingPoolFactoryStorage.sol";


contract StakingPoolFactory is IStakingPoolFactory, Proxyable {

    uint256 private version = 1;
    IStakingPoolFactoryStorage public factoryStorage;

    constructor(
    	address _factoryStorage, // Staking pool factory storage
    	address payable _proxy, // Staking pool factory proxy
    	address _owner // Staking pool factory owner address
    )
    	public
    	Proxyable(_proxy, _owner)
    {
        require(_factoryStorage != address(0), "StakingPoolFactory: factory storage is zero address");
        factoryStorage = IStakingPoolFactoryStorage(_factoryStorage);
    }

    function acceptStorageOwnership()
        public
        optionalProxy_onlyOwner
    {
        Owned(address(factoryStorage)).acceptOwnership();
    }

    function getVersion() public view returns(uint256) {
        return version;
    }

    function deployStakingPool(string memory _name, string memory _tokenSymbol, address _owner)
    	public
    	optionalProxy_onlyOwner
    {
        Vault vault = new Vault();
        LPToken token = new LPToken(_name, _tokenSymbol);

        StakingPool stakingPool = new StakingPool(
    		_name,
	        address(proxy),
	        address(this),
	        address(vault),
	        address(token),
	        factoryStorage.getOKS(),
        	_owner
        );

        vault.nominateNewOwner(address(stakingPool));
        token.nominateNewOwner(address(stakingPool));

        stakingPool.acceptOwnership(address(vault));
        stakingPool.acceptOwnership(address(token));

        factoryStorage.addStakingPool(address(stakingPool));
    }

    function upgradeStakingPool(address _pool)
    	public
    	optionalProxy_onlyOwner
    {

    }

    function upgradeFactory(address _facotry)
    	public
    	optionalProxy_onlyOwner
    {
        require(_facotry != address(0), "StakingPoolFactory: FACTORY is zero address");
        require(IStakingPoolFactory(_facotry).getVersion() > version, "StakingPoolFactory: pool factory version has to be higher");
        Owned(address(factoryStorage)).nominateNewOwner(_facotry);
    }
}