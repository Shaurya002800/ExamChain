import hre from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

async function main() {
  console.log("🚀 Deploying ExamChain contracts to Ganache...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log(`📦 Deployer: ${deployer.address}`);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log(`💰 Balance: ${hre.ethers.formatEther(balance)} ETH\n`);

  // Deploy QuestionVault
  const QuestionVault = await hre.ethers.getContractFactory("QuestionVault");
  const vault = await QuestionVault.deploy();
  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();
  console.log(`✅ QuestionVault deployed at: ${vaultAddress}`);

  // Deploy ResultCertifier
  const ResultCertifier = await hre.ethers.getContractFactory("ResultCertifier");
  const certifier = await ResultCertifier.deploy();
  await certifier.waitForDeployment();
  const certifierAddress = await certifier.getAddress();
  console.log(`✅ ResultCertifier deployed at: ${certifierAddress}`);

  // Save to deployments.json
  const deployments = {
    network: "ganache",
    chainId: 1337,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    contracts: {
      QuestionVault: vaultAddress,
      ResultCertifier: certifierAddress,
    }
  };

  fs.writeFileSync(
    path.join(__dirname, "..", "deployments.json"),
    JSON.stringify(deployments, null, 2)
  );
  console.log(`\n📄 Saved to contracts/deployments.json`);

  // Copy ABIs to backend
  const backendAbisDir = path.join(__dirname, "..", "..", "backend", "utils", "abis");
  fs.mkdirSync(backendAbisDir, { recursive: true });

  for (const name of ["QuestionVault", "ResultCertifier"]) {
    const src  = path.join(__dirname, "..", "artifacts", `${name}.sol`, `${name}.json`);
    const dest = path.join(backendAbisDir, `${name}.json`);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
      console.log(`📋 ABI copied: ${name}.json → backend/utils/abis/`);
    }
  }

  console.log("\n─────────────────────────────────────────");
  console.log("📝 Add these to your .env:");
  console.log(`QUESTION_VAULT_ADDRESS=${vaultAddress}`);
  console.log(`RESULT_CERTIFIER_ADDRESS=${certifierAddress}`);
  console.log("─────────────────────────────────────────\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});