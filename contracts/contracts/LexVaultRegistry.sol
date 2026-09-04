// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

/**
 * @title LexVaultRegistry
 * @dev Verifiable Chain of Custody and Evidence Commitment Smart Contract.
 */
contract LexVaultRegistry {
    struct EvidenceRecord {
        string evidenceId;
        bytes32 sha256Hash;
        bytes32 commitment;
        uint256 timestamp;
        address registeredBy;
    }

    struct CustodyLog {
        string evidenceId;
        string action;
        address actor;
        uint256 timestamp;
        bytes signature;
        bytes32 prevHash;
    }

    // State variables
    mapping(string => EvidenceRecord) private evidenceRecords;
    mapping(string => CustodyLog[]) private custodyHistory;
    mapping(bytes32 => bool) public anchoredMerkleRoots;

    // Events
    event EvidenceRegistered(
        string indexed evidenceId,
        bytes32 sha256Hash,
        address registeredBy
    );

    event CustodyLogged(
        string indexed evidenceId,
        string action,
        address actor
    );

    event MerkleRootAnchored(
        bytes32 indexed merkleRoot
    );

    /**
     * @notice Registers initial cryptographic evidence commitment on-chain.
     */
    function registerEvidence(
        string calldata evidenceId,
        bytes32 sha256Hash,
        bytes32 commitment
    ) external {
        require(bytes(evidenceId).length > 0, "Evidence ID cannot be empty");
        require(evidenceRecords[evidenceId].timestamp == 0, "Evidence already registered");
        require(sha256Hash != bytes32(0), "SHA-256 hash cannot be zero");

        evidenceRecords[evidenceId] = EvidenceRecord({
            evidenceId: evidenceId,
            sha256Hash: sha256Hash,
            commitment: commitment,
            timestamp: block.timestamp,
            registeredBy: msg.sender
        });

        emit EvidenceRegistered(evidenceId, sha256Hash, msg.sender);
    }

    /**
     * @notice Appends a verifiable custody transition log on-chain.
     */
    function recordCustody(
        string calldata evidenceId,
        string calldata action,
        bytes calldata signature,
        bytes32 prevHash
    ) external {
        require(evidenceRecords[evidenceId].timestamp > 0, "Evidence does not exist");
        require(bytes(action).length > 0, "Action cannot be empty");

        CustodyLog memory log = CustodyLog({
            evidenceId: evidenceId,
            action: action,
            actor: msg.sender,
            timestamp: block.timestamp,
            signature: signature,
            prevHash: prevHash
        });

        custodyHistory[evidenceId].push(log);

        emit CustodyLogged(evidenceId, action, msg.sender);
    }

    /**
     * @notice Anchors an aggregate batch Merkle Root on-chain.
     */
    function anchorMerkleRoot(bytes32 root) external {
        require(root != bytes32(0), "Merkle root cannot be zero");
        anchoredMerkleRoots[root] = true;

        emit MerkleRootAnchored(root);
    }

    /**
     * @notice Retrieves the immutable evidence record by evidenceId.
     */
    function getEvidence(string calldata evidenceId)
        external
        view
        returns (EvidenceRecord memory)
    {
        require(evidenceRecords[evidenceId].timestamp > 0, "Evidence does not exist");
        return evidenceRecords[evidenceId];
    }

    /**
     * @notice Retrieves full custody log timeline for an evidence item.
     */
    function getCustodyHistory(string calldata evidenceId)
        external
        view
        returns (CustodyLog[] memory)
    {
        return custodyHistory[evidenceId];
    }

    /**
     * @notice Checks whether an evidence item's stored SHA-256 matches a provided test hash.
     */
    function verifyEvidenceIntegrity(string calldata evidenceId, bytes32 checkHash)
        external
        view
        returns (bool)
    {
        if (evidenceRecords[evidenceId].timestamp == 0) {
            return false;
        }
        return evidenceRecords[evidenceId].sha256Hash == checkHash;
    }
}
