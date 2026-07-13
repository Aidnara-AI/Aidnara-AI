import { ethers } from 'hardhat';

async function main() {
  const Registry = await ethers.getContractFactory('AidnaraAidRegistry');
  const registry = await Registry.deploy();

  await registry.waitForDeployment();

  console.log(`AidnaraAidRegistry deployed to: ${await registry.getAddress()}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
