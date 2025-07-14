const { ethers } = require("hardhat");

async function main() {
  const [deployer, candidate] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  const votingTitle = process.env.VOTING_TITLE || "Presidential Election";
  const votingDescription = process.env.VOTING_DESCRIPTION || "Election for the next president";
  const descriptionBytes = ethers.encodeBytes32String(votingDescription);


  const VotingFactory = await ethers.getContractFactory("Voting");
  const voting = await VotingFactory.deploy(votingTitle, descriptionBytes);

  console.log("Voting contract deployed to:", voting.target);

  // Example of interacting with the contract
  // You can expand this section to suit your needs

  // Register a candidate (example)
  const candidateName = "Candidate 1";
  const candidateAddress = candidate.address; 
  if (ethers.isAddress(candidateAddress)) {
    console.log(`Registering candidate: ${candidateName} with address ${candidateAddress}`);
    const tx = await voting.registerCandidate(candidateName, candidateAddress, 0);
    await tx.wait();
    console.log("Candidate registered successfully");
  } else {
    console.log("Skipping candidate registration due to invalid address.");
  }


  // Start the voting
  console.log("Starting the voting...");
  const startVotingTx = await voting.startVoting();
  await startVotingTx.wait();
  console.log("Voting started successfully.");

  console.log("Script finished.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });