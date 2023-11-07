// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/governance/GovernorUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/governance/extensions/GovernorSettingsUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/governance/extensions/GovernorCountingSimpleUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/governance/extensions/GovernorVotesUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/governance/extensions/GovernorVotesQuorumFractionUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/governance/extensions/GovernorTimelockControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract FXGovernor is Initializable, GovernorUpgradeable, GovernorSettingsUpgradeable, GovernorCountingSimpleUpgradeable, GovernorVotesUpgradeable, GovernorVotesQuorumFractionUpgradeable, GovernorTimelockControlUpgradeable, OwnableUpgradeable, UUPSUpgradeable {
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(IVotesUpgradeable _token, TimelockControllerUpgradeable _timelock, address initialOwner)
    initializer public
    {
        __Governor_init("FXGovernor");
        __GovernorSettings_init(0, 561810, 0);
        __GovernorCountingSimple_init();
        __GovernorVotes_init(_token);
        __GovernorVotesQuorumFraction_init(492);
        __GovernorTimelockControl_init(_timelock);
        __Ownable_init();
        transferOwnership(initialOwner);
        __UUPSUpgradeable_init();
    }

    function quorumDenominator() public pure override returns (uint256) {
        return 10000;
    }

    function _authorizeUpgrade(address newImplementation)
    internal
    onlyOwner
    override
    {}

    // The following functions are overrides required by Solidity.

    function votingDelay()
    public
    view
    override(IGovernorUpgradeable, GovernorSettingsUpgradeable)
    returns (uint256)
    {
        return super.votingDelay();
    }

    function votingPeriod()
    public
    view
    override(IGovernorUpgradeable, GovernorSettingsUpgradeable)
    returns (uint256)
    {
        return super.votingPeriod();
    }

    function quorum(uint256 blockNumber)
    public
    view
    override(IGovernorUpgradeable, GovernorVotesQuorumFractionUpgradeable)
    returns (uint256)
    {
        return super.quorum(blockNumber);
    }

    function state(uint256 proposalId)
    public
    view
    override(GovernorUpgradeable, GovernorTimelockControlUpgradeable)
    returns (ProposalState)
    {
        return super.state(proposalId);
    }

    function proposalThreshold()
    public
    view
    override(GovernorUpgradeable, GovernorSettingsUpgradeable)
    returns (uint256)
    {
        return super.proposalThreshold();
    }


    function _cancel(address[] memory targets, uint256[] memory values, bytes[] memory calldatas, bytes32 descriptionHash)
    internal
    override(GovernorUpgradeable, GovernorTimelockControlUpgradeable)
    returns (uint256)
    {
        return super._cancel(targets, values, calldatas, descriptionHash);
    }

    function _execute(uint256 proposalId, address[] memory targets, uint256[] memory values, bytes[] memory calldatas, bytes32)
    internal
    override(GovernorUpgradeable, GovernorTimelockControlUpgradeable) {
        super._execute(proposalId, targets, values, calldatas, "");
    }

    function _executor()
    internal
    view
    override(GovernorUpgradeable, GovernorTimelockControlUpgradeable)
    returns (address)
    {
        return super._executor();
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override(GovernorUpgradeable, GovernorTimelockControlUpgradeable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}