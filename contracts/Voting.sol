// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;


contract Voting{
    address payable public owner;
    address[] public candidates;
    address[] public voters;
    uint256 public votingEndTime;
    uint256 public votingStartTime;
    string public votingTitle;
    uint256 private constant VOTING_DURATION = 1 days;
    
    bytes32 public votingDescription;
    bool public votingOpen;
    bool public votingClosed;
    mapping(address => uint256) public votesReceived;
    uint256 public totalVotes;
    mapping(address => uint256) public votesCast;
    address public winner;
    address[] public losers;
    uint256 private constant MAX_CANDIDATES = 10;
    constructor(string memory _title, bytes32 _description) {
        owner = payable(msg.sender);
        votingTitle = _title;
        votingDescription = _description;
        votingOpen = false;
        votingClosed = true;
    }

    


    event VotingStarted(string title, bytes32 description, uint256 startTime, uint256 endTime);
    event VotingEnded(string title, uint256 endTime);
    event VoteCasted(address indexed voter, address indexed candidate, uint256 votes);
    event WinnerDeclared(address indexed winner, uint256 totalVotes);
    event LosersDeclared(address[] losers);
    event RegisteredCandidate(address indexed candidateAddress, string name, uint256 balance);

    error VotingAlreadyOpen();
    error VotingAlreadyClosed();


    struct Candidate {
        address candidateAddress;
        string name;
    }
    struct Voter {
        address voterAddress;
        bool hasVoted;
    }
    

    modifier onlyOwner() {
        require(msg.sender == owner, "only owner can perform this action");
        _;
    }


    modifier votingIsOpen() {
        require(votingOpen, "Voting is not open");
        _;
    }
    modifier votingIsClosed() {
        require(votingClosed, "Voting is not closed");
        _;
    }


    event hasRightsToVote(address indexed voter, bool hasRights);


    function registerCandidate(string memory _name, address _candidateAddress, uint256 _balance) public  onlyOwner() {
        require(candidates.length < MAX_CANDIDATES, "Maximum number of canddates reached, sorrry we cant accept more candidates, you can remove a candidate to add a new one");
        require(_candidateAddress != address(0), "Invalid candidate address");
        require(votingClosed, "Voting must be closed to register candidates");

        for (uint256 i = 0; i < candidates.length; i++) {
            if (candidates[i] == _candidateAddress) {
                revert("Candidate already registered");
            }
        }
        if (bytes(_name).length == 0) {
            revert("Candidate name cannot be empty");
        }

        candidates.push(_candidateAddress);
        emit RegisteredCandidate(_candidateAddress, _name, _balance);

    }



    function buyVotingRight(address _voterAddress) public payable {
        require(msg.sender == _voterAddress, "Only the voter can buy voting rights");
        require(!votingOpen, "Voting is already open");
        require(votingClosed, "Voting must be closed to buy voting rights");
        require(msg.value >= 4 ether, "Insufficient funds to buy voting rights");

        // The contract receives the payment, so no need to transfer back to voter
        voters.push(_voterAddress);
        emit hasRightsToVote(_voterAddress, true);
    }


    function startVoting() public onlyOwner votingIsClosed {
        require(candidates.length > 0, "No candidates registered for voting");
        votingStartTime = block.timestamp;
        votingEndTime = votingStartTime + VOTING_DURATION;
        votingOpen = true;
        votingClosed = false;
        emit VotingStarted(votingTitle, votingDescription, votingStartTime, votingEndTime);
    }

    function endVoting() public onlyOwner votingIsOpen {
        require(block.timestamp >= votingEndTime, "Voting period has not ended yet");
        votingOpen = false;
        votingClosed = true;
        emit VotingEnded(votingTitle, block.timestamp);
        declareWinner();
    }

    function castVote(address payable _candidate) public payable votingIsOpen() {
        require(_candidate != address(0), "Invalid candidate address");
        require(votesCast[msg.sender] < 2, "You have already voted twice");
        require(msg.value > 0, "Must send payment to vote");
        require(block.timestamp < votingEndTime, "Voting period has ended");
        
        // Check if voter has voting rights
        bool hasRights = false;
        for (uint256 i = 0; i < voters.length; i++) {
            if (voters[i] == msg.sender) {
                hasRights = true;
                break;
            }
        }
        require(hasRights, "You must buy voting rights first");

        // Check if candidate is registered
        bool candidateExists = false;
        for (uint256 i = 0; i < candidates.length; i++) {
            if (candidates[i] == _candidate) {
                candidateExists = true;
                break;
            }
        }
        require(candidateExists, "Candidate is not registered");

        votesReceived[_candidate] += 1;
        totalVotes += 1;
        votesCast[msg.sender] += 1;
        emit VoteCasted(msg.sender, _candidate, 1);
    }

    function declareWinner() internal {
        uint256 highestVotes = 0;
        address currentWinner;

        for (uint256 i = 0; i < candidates.length; i++) {
            if (votesReceived[candidates[i]] > highestVotes) {
                highestVotes = votesReceived[candidates[i]];
                currentWinner = candidates[i];
            }
        }

        winner = currentWinner;
        emit WinnerDeclared(winner, highestVotes);

        // Declare losers
        for (uint256 i = 0; i < candidates.length; i++) {
            if (candidates[i] != winner) {
                losers.push(candidates[i]);
            }
        }
        emit LosersDeclared(losers);
    }
}