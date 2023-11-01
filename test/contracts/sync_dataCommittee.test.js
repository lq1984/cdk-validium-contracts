const { expect } = require('chai');
const { ethers, upgrades } = require('hardhat');
const MerkleTreeBridge = require('@0xpolygonhermez/zkevm-commonjs').MTBridge;
const {
    verifyMerkleProof,
    getLeafValue,
} = require('@0xpolygonhermez/zkevm-commonjs').mtBridgeUtils;

function calculateGlobalExitRoot(mainnetExitRoot, rollupExitRoot) {
    return ethers.utils.solidityKeccak256(['bytes32', 'bytes32'], [mainnetExitRoot, rollupExitRoot]);
}

describe('Bridge Data committee from L2', () => {
    let rollup;
    let deployer;
    let polygonZkEVMGlobalExitRoot;
    let polygonZkEVMBridgeContract;
    let cdkDataCommitteeContract;

    const networkIDMainnet = 0;
    const networkIDRollup = 1;

    const LEAF_TYPE_MESSAGE = 1;

    const polygonZkEVMAddress = ethers.constants.AddressZero;
    const l2StakingAddress = '0x1111111111111111111111111111111111111111';

    function membersToAddrsBytes(members) {
        const urls = [];
        let addrsBytes = '0x';
        for (let i = 0; i < members.length; i++) {
            urls.push(members[i].url);
            addrsBytes += members[i].addr.slice(2);
        }
        const metadata = ethers.utils.defaultAbiCoder.encode(['uint', 'string[]', 'bytes'], [members.length, urls, addrsBytes]);
        const memberHash = ethers.utils.solidityKeccak256(['bytes'], [addrsBytes]);
        return { memberHash, metadata };
    }

    beforeEach('Deploy contracts', async () => {
        // load signers
        [deployer, rollup] = await ethers.getSigners();

        // deploy PolygonZkEVMBridge
        const polygonZkEVMBridgeFactory = await ethers.getContractFactory('PolygonZkEVMBridge');
        polygonZkEVMBridgeContract = await upgrades.deployProxy(polygonZkEVMBridgeFactory, [], { initializer: false });

        // deploy global exit root manager
        const PolygonZkEVMGlobalExitRootFactory = await ethers.getContractFactory('PolygonZkEVMGlobalExitRoot');
        polygonZkEVMGlobalExitRoot = await PolygonZkEVMGlobalExitRootFactory.deploy(rollup.address, polygonZkEVMBridgeContract.address);

        await polygonZkEVMBridgeContract.initialize(networkIDMainnet, polygonZkEVMGlobalExitRoot.address, polygonZkEVMAddress);

        // deploy CDKDataCommittee
        const cdkDataCommitteeFactory = await ethers.getContractFactory('CDKDataCommittee');
        cdkDataCommitteeContract = await upgrades.deployProxy(
            cdkDataCommitteeFactory,
            [],
            { initializer: false },
        );
        await cdkDataCommitteeContract.deployed();
        await cdkDataCommitteeContract.initialize(polygonZkEVMBridgeContract.address, l2StakingAddress);
    });

    it('should check the constructor parameters', async () => {
        expect(await polygonZkEVMBridgeContract.globalExitRootManager()).to.be.equal(polygonZkEVMGlobalExitRoot.address);
        expect(await polygonZkEVMBridgeContract.networkID()).to.be.equal(networkIDMainnet);
        expect(await polygonZkEVMBridgeContract.polygonZkEVMaddress()).to.be.equal(polygonZkEVMAddress);
    });

    it('success bridge committee from l2', async () => {
        // Add a claim leaf to rollup exit tree
        const originNetwork = networkIDRollup;
        const originAddress = l2StakingAddress; // ether
        const amount = ethers.utils.parseEther('0');
        const destinationNetwork = networkIDMainnet;
        const destinationAddress = cdkDataCommitteeContract.address;
        const mainnetExitRoot = await polygonZkEVMGlobalExitRoot.lastMainnetExitRoot();
        const nMembers = 4;
        const committeeMembers = [];
        const addrs = await ethers.getSigners();
        const committeeAddrs = addrs.slice(0, nMembers)
            .sort((a, b) => a.address - b.address);
        for (let i = 0; i < nMembers; i++) {
            committeeMembers.push({
                url: `foo-${i}`,
                addr: committeeAddrs[i].address,
            });
        }
        const { memberHash, metadata } = membersToAddrsBytes(committeeMembers);
        const metadataHash = ethers.utils.solidityKeccak256(['bytes'], [metadata]);
        const height = 32;
        const merkleTree = new MerkleTreeBridge(height);
        const leafValue = getLeafValue(
            LEAF_TYPE_MESSAGE,
            originNetwork,
            originAddress,
            destinationNetwork,
            destinationAddress,
            amount,
            metadataHash,
        );
        merkleTree.add(leafValue);

        // check merkle root with SC
        const rootJSRollup = merkleTree.getRoot();

        // add rollup Merkle root
        await expect(polygonZkEVMGlobalExitRoot.connect(rollup).updateExitRoot(rootJSRollup))
            .to.emit(polygonZkEVMGlobalExitRoot, 'UpdateGlobalExitRoot')
            .withArgs(mainnetExitRoot, rootJSRollup);

        // check roots
        const rollupExitRootSC = await polygonZkEVMGlobalExitRoot.lastRollupExitRoot();
        expect(rollupExitRootSC).to.be.equal(rootJSRollup);

        const computedGlobalExitRoot = calculateGlobalExitRoot(mainnetExitRoot, rollupExitRootSC);
        expect(computedGlobalExitRoot).to.be.equal(await polygonZkEVMGlobalExitRoot.getLastGlobalExitRoot());

        // check merkle proof
        const proof = merkleTree.getProofTreeByIndex(0);
        const index = 0;

        // verify merkle proof
        expect(verifyMerkleProof(leafValue, proof, index, rootJSRollup)).to.be.equal(true);
        expect(await polygonZkEVMBridgeContract.verifyMerkleProof(
            leafValue,
            proof,
            index,
            rootJSRollup,
        )).to.be.equal(true);

        await expect(polygonZkEVMBridgeContract.claimMessage(
            proof,
            index,
            mainnetExitRoot,
            rollupExitRootSC,
            originNetwork,
            originAddress,
            destinationNetwork,
            destinationAddress,
            amount,
            metadata,
        )).to.emit(polygonZkEVMBridgeContract, 'ClaimEvent')
            .withArgs(
                index,
                originNetwork,
                originAddress,
                destinationAddress,
                amount,
            )
            .to.emit(cdkDataCommitteeContract, 'CommitteeUpdated')
            .withArgs(memberHash);
    });

    it('should check origin address is l2 staking', async () => {
        // Add a claim leaf to rollup exit tree
        const originNetwork = networkIDRollup;
        const originAddress = ethers.constants.AddressZero; // ether
        const amount = ethers.utils.parseEther('0');
        const destinationNetwork = networkIDMainnet;
        const destinationAddress = cdkDataCommitteeContract.address;
        const mainnetExitRoot = await polygonZkEVMGlobalExitRoot.lastMainnetExitRoot();
        const nMembers = 4;
        const committeeMembers = [];
        const addrs = await ethers.getSigners();
        const committeeAddrs = addrs.slice(0, nMembers)
            .sort((a, b) => a.address - b.address);
        for (let i = 0; i < nMembers; i++) {
            committeeMembers.push({
                url: `foo-${i}`,
                addr: committeeAddrs[i].address,
            });
        }
        const { metadata } = membersToAddrsBytes(committeeMembers);
        const metadataHash = ethers.utils.solidityKeccak256(['bytes'], [metadata]);
        const height = 32;
        const merkleTree = new MerkleTreeBridge(height);
        const leafValue = getLeafValue(
            LEAF_TYPE_MESSAGE,
            originNetwork,
            originAddress,
            destinationNetwork,
            destinationAddress,
            amount,
            metadataHash,
        );
        merkleTree.add(leafValue);

        // check merkle root with SC
        const rootJSRollup = merkleTree.getRoot();

        // add rollup Merkle root
        await expect(polygonZkEVMGlobalExitRoot.connect(rollup).updateExitRoot(rootJSRollup))
            .to.emit(polygonZkEVMGlobalExitRoot, 'UpdateGlobalExitRoot')
            .withArgs(mainnetExitRoot, rootJSRollup);

        // check roots
        const rollupExitRootSC = await polygonZkEVMGlobalExitRoot.lastRollupExitRoot();
        expect(rollupExitRootSC).to.be.equal(rootJSRollup);

        const computedGlobalExitRoot = calculateGlobalExitRoot(mainnetExitRoot, rollupExitRootSC);
        expect(computedGlobalExitRoot).to.be.equal(await polygonZkEVMGlobalExitRoot.getLastGlobalExitRoot());

        // check merkle proof
        const proof = merkleTree.getProofTreeByIndex(0);
        const index = 0;

        // verify merkle proof
        expect(verifyMerkleProof(leafValue, proof, index, rootJSRollup)).to.be.equal(true);
        expect(await polygonZkEVMBridgeContract.verifyMerkleProof(
            leafValue,
            proof,
            index,
            rootJSRollup,
        )).to.be.equal(true);

        await expect(polygonZkEVMBridgeContract.claimMessage(
            proof,
            index,
            mainnetExitRoot,
            rollupExitRootSC,
            originNetwork,
            originAddress,
            destinationNetwork,
            destinationAddress,
            amount,
            metadata,
        )).to.emit(polygonZkEVMBridgeContract, 'ClaimEvent')
            .withArgs(
                index,
                originNetwork,
                originAddress,
                destinationAddress,
                amount,
            )
            .to.revertedWith('MessageFailed');
    });

    it('should check caller is bridge address', async () => {
        const nMembers = 4;
        const committeeMembers = [];
        const addrs = await ethers.getSigners();
        const committeeAddrs = addrs.slice(0, 4)
            .sort((a, b) => a.address - b.address);
        for (let i = 0; i < nMembers; i++) {
            committeeMembers.push({
                url: `foo-${i}`,
                addr: committeeAddrs[i].address,
            });
        }
        const { metadata } = membersToAddrsBytes(committeeMembers);
        await expect(cdkDataCommitteeContract.connect(deployer)
            .onMessageReceived(polygonZkEVMBridgeContract.address, 0, metadata))
            .to.be.revertedWith('caller is not the l1BridgeAddress');
    });
});
