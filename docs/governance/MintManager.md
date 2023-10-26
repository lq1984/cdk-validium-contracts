Set as `owner` of the governance token and responsible for the token inflation
        schedule. Contract acts as the token "mint manager" with permission to the `mint`
        function only. Currently permitted to mint once per year of up to 2% of the total
        token supply. Upgradable to allow changes in the inflation schedule.


## Functions
### constructor
```solidity
  function constructor(
    address _upgrader,
    address _governanceToken
  ) public
```
Constructs the MintManager contract.


#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_upgrader` | address |        The owner of this contract.
|`_governanceToken` | address | The governance token this contract can mint tokens of.

### mint
```solidity
  function mint(
    address _account,
    uint256 _amount
  ) public
```
Only the token owner is allowed to mint a certain amount of the
        governance token per year.


#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_account` | address | The account receiving minted tokens.
|`_amount` | uint256 |  The amount of tokens to mint.

### upgrade
```solidity
  function upgrade(
    address _newMintManager
  ) public
```
Upgrade the owner of the governance token to a new MintManager.


#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_newMintManager` | address | The MintManager to upgrade to.

