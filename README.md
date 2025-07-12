This project is about voting system, the users will have to buy the right to vote, cast votes by making payment for only twice


# Voting System Smart Contract

**Platform:** Ethereum  
**Framework:** Hardhat, web3.js 

**Description:**  
This project is a smart contract for a decentralized voting system on the Ethereum blockchain. Users must purchase the right to vote by sending a payment to the contract. Once they have voting rights, they can cast votes for predefined options, with each vote requiring a separate payment. Each user is limited to casting a maximum of two votes. The contract ensures secure vote tracking and enforces the two-vote limit per user.

**Key Functions:**  
- `buyVotingRights`: Allows users to purchase voting rights by sending the required payment.  
- `vote`: Enables users to cast a vote for a specific option by sending a payment, checking that the user has voting rights and hasn’t exceeded two votes.  
- `getVoteCount`: Returns the current vote totals for each option.  
- `closeVoting`: Allows the contract owner to end the voting period.  
- `getWinner`: Identifies the option with the most votes after voting is closed.  

**Considerations:**  
- Use mappings to track the number of votes per user and enforce the two-vote limit.  
- Ensure secure handling of payments for both voting rights and votes.  
- Restrict the `closeVoting` function to the contract owner for controlled management.  

---

This prompt provides a clear overview of your project, including its purpose, key features, and some technical considerations. It’s structured to help GitHub Copilot understand the context and assist you effectively as you build your voting system smart contract with Hardhat. Feel free to tweak it as your project evolves!