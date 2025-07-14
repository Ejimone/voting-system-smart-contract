const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Voting", function () {
  let Voting;
  let owner;
  let addr1;
  let addr2;
  let addrs;
  let voting;
  const title = "Presidential Election";
  const description = ethers.encodeBytes32String("Election for the next president");

  beforeEach(async function () {
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
    const VotingFactory = await ethers.getContractFactory("Voting");
    voting = await VotingFactory.deploy(title, description);
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await voting.owner()).to.equal(owner.address);
    });

    it("Should set the voting title and description", async function () {
      expect(await voting.votingTitle()).to.equal(title);
      expect(await voting.votingDescription()).to.equal(description);
    });

    it("Should initialize with voting closed", async function () {
      expect(await voting.votingOpen()).to.be.false;
      expect(await voting.votingClosed()).to.be.true;
    });
  });

  describe("Candidate Registration", function () {
    it("Should allow the owner to register a candidate", async function () {
      await expect(voting.connect(owner).registerCandidate("Candidate 1", addr1.address, 0))
        .to.emit(voting, "RegisteredCandidate")
        .withArgs(addr1.address, "Candidate 1", 0);
      expect(await voting.candidates(0)).to.equal(addr1.address);
    });

    it("Should not allow non-owners to register a candidate", async function () {
      await expect(
        voting.connect(addr1).registerCandidate("Candidate 1", addr1.address, 0)
      ).to.be.revertedWith("only owner can perform this action");
    });

    it("Should not allow registering a candidate with an empty name", async function () {
      await expect(
        voting.connect(owner).registerCandidate("", addr1.address, 0)
      ).to.be.revertedWith("Candidate name cannot be empty");
    });

    it("Should not allow registering a candidate with an invalid address", async function () {
      await expect(
        voting.connect(owner).registerCandidate("Candidate 1", ethers.ZeroAddress, 0)
      ).to.be.revertedWith("Invalid candidate address");
    });

    it("Should not allow registering a candidate if voting is open", async function () {
      await voting.connect(owner).registerCandidate("Candidate 1", addr1.address, 0);
      await voting.connect(owner).startVoting();
      await expect(
        voting.connect(owner).registerCandidate("Candidate 2", addr2.address, 0)
      ).to.be.revertedWith("Voting must be closed to register candidates");
    });
  });

  describe("Voting Rights", function () {
    it("Should allow a user to buy voting rights", async function () {
      await expect(voting.connect(addr1).buyVotingRight(addr1.address, { value: ethers.parseEther("4") }))
        .to.emit(voting, "hasRightsToVote")
        .withArgs(addr1.address, true);
      expect(await voting.voters(0)).to.equal(addr1.address);
    });

    it("Should not allow buying voting rights with insufficient funds", async function () {
      await expect(
        voting.connect(addr1).buyVotingRight(addr1.address, { value: ethers.parseEther("3") })
      ).to.be.revertedWith("Insufficient funds to buy voting rights");
    });

    it("Should not allow buying voting rights if voting is open", async function () {
        await voting.connect(owner).registerCandidate("Candidate 1", addr1.address, 0);
        await voting.connect(owner).startVoting();
        await expect(
            voting.connect(addr2).buyVotingRight(addr2.address, { value: ethers.parseEther("4") })
        ).to.be.revertedWith("Voting is already open");
    });
  });

  describe("Voting Process", function () {
    beforeEach(async function () {
      await voting.connect(owner).registerCandidate("Candidate 1", addr1.address, 0);
      await voting.connect(owner).registerCandidate("Candidate 2", addr2.address, 0);
      await voting.connect(addrs[0]).buyVotingRight(addrs[0].address, { value: ethers.parseEther("4") });
      await voting.connect(addrs[1]).buyVotingRight(addrs[1].address, { value: ethers.parseEther("4") });
    });

    it("Should allow the owner to start the voting", async function () {
      await expect(voting.connect(owner).startVoting()).to.emit(voting, "VotingStarted");
      expect(await voting.votingOpen()).to.be.true;
      expect(await voting.votingClosed()).to.be.false;
    });

    it("Should not allow non-owners to start the voting", async function () {
      await expect(voting.connect(addr1).startVoting()).to.be.revertedWith("only owner can perform this action");
    });

    it("Should allow a voter with rights to cast a vote", async function () {
      await voting.connect(owner).startVoting();
      await expect(voting.connect(addrs[0]).castVote(addr1.address, { value: ethers.parseEther("0.1") }))
        .to.emit(voting, "VoteCasted")
        .withArgs(addrs[0].address, addr1.address, 1);
      expect(await voting.votesReceived(addr1.address)).to.equal(1);
      expect(await voting.totalVotes()).to.equal(1);
      expect(await voting.votesCast(addrs[0].address)).to.equal(1);
    });

    it("Should allow a voter to cast two votes", async function () {
        await voting.connect(owner).startVoting();
        await voting.connect(addrs[0]).castVote(addr1.address, { value: ethers.parseEther("0.1") });
        await voting.connect(addrs[0]).castVote(addr2.address, { value: ethers.parseEther("0.1") });
        expect(await voting.votesCast(addrs[0].address)).to.equal(2);
    });

    it("Should not allow a user to vote more than twice", async function () {
        await voting.connect(owner).startVoting();
        await voting.connect(addrs[0]).castVote(addr1.address, { value: ethers.parseEther("0.1") });
        await voting.connect(addrs[0]).castVote(addr2.address, { value: ethers.parseEther("0.1") });
        await expect(
            voting.connect(addrs[0]).castVote(addr1.address, { value: ethers.parseEther("0.1") })
        ).to.be.revertedWith("You have already voted twice");
    });

    it("Should not allow a user without voting rights to cast a vote", async function () {
        await voting.connect(owner).startVoting();
        await expect(
            voting.connect(addrs[2]).castVote(addr1.address, { value: ethers.parseEther("0.1") })
        ).to.be.revertedWith("You must buy voting rights first");
    });

    it("Should not allow voting for an unregistered candidate", async function () {
        await voting.connect(owner).startVoting();
        await expect(
            voting.connect(addrs[0]).castVote(addrs[3].address, { value: ethers.parseEther("0.1") })
        ).to.be.revertedWith("Candidate is not registered");
    });

    it("Should allow the owner to end the voting", async function () {
        await voting.connect(owner).startVoting();
        await ethers.provider.send("evm_increaseTime", [24 * 60 * 60 + 1]); // Increase time by 1 day and 1 second
        await ethers.provider.send("evm_mine");
        await expect(voting.connect(owner).endVoting()).to.emit(voting, "VotingEnded");
        expect(await voting.votingOpen()).to.be.false;
        expect(await voting.votingClosed()).to.be.true;
    });

    it("Should declare the winner after ending the vote", async function () {
        await voting.connect(owner).startVoting();
        await voting.connect(addrs[0]).castVote(addr1.address, { value: ethers.parseEther("0.1") });
        await voting.connect(addrs[1]).castVote(addr1.address, { value: ethers.parseEther("0.1") });
        await ethers.provider.send("evm_increaseTime", [24 * 60 * 60 + 1]);
        await ethers.provider.send("evm_mine");
        await expect(voting.connect(owner).endVoting())
            .to.emit(voting, "WinnerDeclared")
            .withArgs(addr1.address, 2);
        expect(await voting.winner()).to.equal(addr1.address);
    });
  });
});
