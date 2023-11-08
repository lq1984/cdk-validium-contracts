// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract GovernanceToken is Initializable, ERC20Burnable, ERC20Votes, Ownable {
    constructor()
    ERC20("Function X", "FX")
    ERC20Permit("Function X")
    {}

    function initialize(address initialOwner) initializer public {
        _transferOwnership(initialOwner);
    }

    /// @notice Allows the owner to mint tokens.
    /// @param _account The account receiving minted tokens.
    /// @param _amount  The amount of tokens to mint.
    function mint(address _account, uint256 _amount) public onlyOwner {
        _mint(_account, _amount);
    }

    /// @notice Callback called after a token transfer.
    /// @param from   The account sending tokens.
    /// @param to     The account receiving tokens.
    /// @param amount The amount of tokens being transfered.
    function _afterTokenTransfer(address from, address to, uint256 amount) internal override(ERC20, ERC20Votes) {
        super._afterTokenTransfer(from, to, amount);
    }

    /// @notice Internal mint function.
    /// @param to     The account receiving minted tokens.
    /// @param amount The amount of tokens to mint.
    function _mint(address to, uint256 amount) internal override(ERC20, ERC20Votes) {
        super._mint(to, amount);
    }

    /// @notice Internal burn function.
    /// @param account The account that tokens will be burned from.
    /// @param amount  The amount of tokens that will be burned.
    function _burn(address account, uint256 amount) internal override(ERC20, ERC20Votes) {
        super._burn(account, amount);
    }
}