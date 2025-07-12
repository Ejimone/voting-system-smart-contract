// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;


contract Voting{
    address payable public owner;
    address payable public voter;
    address[] public candidates;
    address[] public voters;
    uint256 public votingEndTime;
    uint256 public votingStartTime;
    string public votingTitle;
    uint256 private constant VOTING_DURATION = 1 days;
    
    bytes32 public votingDescription;
    bool public votingOpen;
    bool public votingClosed;
    bool public castedVote;
    mapping(address => uint256) public votesReceived;
    uint256 public totalVotes;
    mapping(address => bool) public hasVoted;
    address public winner;
    address[] public losers;
    uint256 balance;
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


    modifier onlyVoter() {
        require(msg.sender == voter, "only voter can perform this action");
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


    function registerCandidate(string memory _name, address _candidateAddress, uint256 _balance) public  onlyOwner() {
        require(candidates.length < MAX_CANDIDATES, "Maximum number of canddates reached, sorrry we cant accept more candidates, you can remove a candidate to add a new one");
        require(_candidateAddress != address(0), "Invalid candidate address");
        require(votingClosed, "Voting must be closed to register candidates");
        require(_candidateAddress.balance >= 4 ether, "candidate has to have a minimum of 4 ETH to be registered as a candidate");

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



    function buyVotingRight() public payable {}
}