pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/poseidon.circom";

/*
 * EvidenceCommitment Circuit
 * 
 * Proves knowledge of a private evidence hash and private investigator salt
 * that deterministically hash to a public commitment using the Poseidon hash function.
 */
template EvidenceCommitment() {
    // Private witness inputs
    signal input evidenceHash;
    signal input secretSalt;

    // Public statement input
    signal input expectedCommitment;

    // Instantiate 2-input Poseidon hasher
    component hasher = Poseidon(2);
    hasher.inputs[0] <== evidenceHash;
    hasher.inputs[1] <== secretSalt;

    // Constrain calculated hash to public expected commitment
    expectedCommitment === hasher.out;
}

// Instantiate main component exposing expectedCommitment as the public signal
component main {public [expectedCommitment]} = EvidenceCommitment();
