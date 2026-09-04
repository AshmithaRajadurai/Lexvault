#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUILD_DIR="$DIR/build"
CIRCUITS_DIR="$DIR/circuits"

echo "=== LEXVAULT ZK Circuit Compilation & Ceremony Pipeline ==="

mkdir -p "$BUILD_DIR"

if ! command -v circom &> /dev/null; then
    echo "[!] circom binary not found in PATH."
    echo "[*] Triggering fallback mock artifact generator..."
    node "$DIR/scripts/build-mock-artifacts.js"
    exit 0
fi

echo "[1/5] Compiling evidence_commitment.circom with circom..."
circom "$CIRCUITS_DIR/evidence_commitment.circom" --r1cs --wasm --sym -o "$BUILD_DIR"

echo "[2/5] Setting up local Powers of Tau (pot12)..."
if [ ! -f "$BUILD_DIR/pot12_final.ptau" ]; then
    npx snarkjs powersoftau new bn128 12 "$BUILD_DIR/pot12_0000.ptau" -v
    npx snarkjs powersoftau contribute "$BUILD_DIR/pot12_0000.ptau" "$BUILD_DIR/pot12_0001.ptau" --name="LexVault Phase 1" -v -e="lexvault_entropy_phase1"
    npx snarkjs powersoftau prepare phase2 "$BUILD_DIR/pot12_0001.ptau" "$BUILD_DIR/pot12_final.ptau" -v
fi

echo "[3/5] Performing Groth16 setup..."
npx snarkjs groth16 setup "$BUILD_DIR/evidence_commitment.r1cs" "$BUILD_DIR/pot12_final.ptau" "$BUILD_DIR/circuit_0000.zkey"

echo "[4/5] Contributing to Groth16 phase 2 ceremony..."
npx snarkjs zkey contribute "$BUILD_DIR/circuit_0000.zkey" "$BUILD_DIR/circuit_final.zkey" --name="LexVault Phase 2" -v -e="lexvault_entropy_phase2"

echo "[5/5] Exporting verification key..."
npx snarkjs zkey export verificationkey "$BUILD_DIR/circuit_final.zkey" "$BUILD_DIR/verification_key.json"

echo "=== Circuit setup complete. Artifacts saved to $BUILD_DIR ==="
