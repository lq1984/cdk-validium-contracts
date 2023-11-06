


## Functions
### mint
```solidity
  function mint(
    address _account,
    uint256 _amount
  ) public
```
Allows the owner to mint tokens.


#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_account` | address | The account receiving minted tokens.
|`_amount` | uint256 |  The amount of tokens to mint.

### _afterTokenTransfer
```solidity
  function _afterTokenTransfer(
    address from,
    address to,
    uint256 amount
  ) internal
```
Callback called after a token transfer.


#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`from` | address |   The account sending tokens.
|`to` | address |     The account receiving tokens.
|`amount` | uint256 | The amount of tokens being transfered.

### _mint
```solidity
  function _mint(
    address to,
    uint256 amount
  ) internal
```
Internal mint function.


#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`to` | address |     The account receiving minted tokens.
|`amount` | uint256 | The amount of tokens to mint.

### _burn
```solidity
  function _burn(
    address account,
    uint256 amount
  ) internal
```
Internal burn function.


#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`account` | address | The account that tokens will be burned from.
|`amount` | uint256 |  The amount of tokens that will be burned.

