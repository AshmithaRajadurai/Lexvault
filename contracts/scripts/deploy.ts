import { ethers } from 'hardhat';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  console.log('[Deploy] Deploying LexVaultRegistry to local Hardhat network...');

  const LexVaultRegistry = await ethers.getContractFactory('LexVaultRegistry');
  const registry = await LexVaultRegistry.deploy();
  await registry.waitForDeployment();

  const contractAddress = await registry.getAddress();
  console.log(`[Deploy] LexVaultRegistry deployed successfully at: ${contractAddress}`);

  // Retrieve contract ABI from compiled artifacts
  const artifactPath = path.resolve(
    __dirname,
    '../artifacts/contracts/LexVaultRegistry.sol/LexVaultRegistry.json'
  );

  let abi: any[] = [];
  if (fs.existsSync(artifactPath)) {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
    abi = artifact.abi;
  }

  // Target config path in backend
  const backendConfigDir = path.resolve(__dirname, '../../backend/src/blockchain');
  if (!fs.existsSync(backendConfigDir)) {
    fs.mkdirSync(backendConfigDir, { recursive: true });
  }

  const backendConfigPath = path.join(backendConfigDir, 'contractConfig.json');
  const configContent = {
    contractAddress,
    network: 'hardhat',
    chainId: 31337,
    deployedAt: new Date().toISOString(),
    abi,
  };

  fs.writeFileSync(backendConfigPath, JSON.stringify(configContent, null, 2), 'utf8');
  console.log(`[Deploy] Contract address and ABI synced to: ${backendConfigPath}`);
}

main().catch((error) => {
  console.error('[Deploy] Error during deployment:', error);
  process.exitCode = 1;
});
