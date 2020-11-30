pragma solidity >=0.4.22 <=0.6.0;


contract BidPoint {
    struct Bid {
        bytes32 blindedBid;
        uint deposit;
    }

    // Phases will be set only by external agents and not by time "now"
    // Enum-uint mapping:
    // Init - 0; Bidding - 1; Reveal - 2; Done - 3
    enum Phase {Init, Bidding, Reveal, Done}
    // Owner
    address payable public house;
    address public interimWinningBidder;      
    // Keep track of the highest bid,bidder
    address public highestBidder;
    uint public interimWinningBid; 
    uint public highestBid = 0;
    uint public counter = 0;
    // Only one bid allowed per address
    mapping(address => Bid) public bids;
    mapping(address => uint) depositReturns;
    mapping(address => uint) count; 
    Phase public state = Phase.Init;
    // Events
    event BidEnded(address winner, uint highestBid);
    event BiddingStarted();
    event RevealStarted();
    event AuctionInit();
    event revealInterimWinner(address iWinner, uint iHighestBid);
    event sendCount(Phase stateVar, uint countData);
    // Modifiers
    modifier validPhase(Phase phase) {
        require(state == phase, "phaseError");
        _;
    }
    modifier onlyHouse() {
        require(msg.sender == house, "onlyHouse");
        _;
    }
    modifier onlyBidders(){
        require(msg.sender != house);
        _;
    }


    constructor() public {
        house = msg.sender;
        state = Phase.Init;
        // advancePhase();
    }


    function advancePhase() public onlyHouse {
        // If already in done phase, reset to init phase
        
        if (state == Phase.Done) {
            state = Phase.Init;
            counter = 0;
        } else {
            // else, increment the phase
            // Conversion to uint needed as enums are internally uints
            uint nextPhase = uint(state) + 1;
            state = Phase(nextPhase);
        }
        // state = Phase(1);

        interimWinningBid = 0;
        interimWinningBidder =  0x0000000000000000000000000000000000000000;
        
        // Emit appropriate events for the new phase
        if (state == Phase.Reveal) emit RevealStarted();
        if (state == Phase.Bidding) emit BiddingStarted();
        if (state == Phase.Init) emit AuctionInit();
    }

    function giveInit() public {
        emit sendCount(state, counter);
    }

    function reversePhase() public onlyHouse {
        counter = counter+1;
        // If already in done phase, reset to init phase
        if (state == Phase.Done || state == Phase.Init) {
            // state = Phase.Init;
            revert();
        } else {
            // else, increment the phase
            // Conversion to uint needed as enums are internally uints
            uint nextPhase = uint(state) - 1;
            state = Phase(nextPhase);
        }

            // state = Phase(2);

        // Emit appropriate events for the new phase
        if (state == Phase.Reveal) emit RevealStarted();
        if (state == Phase.Bidding) emit BiddingStarted();
        if (state == Phase.Init) emit AuctionInit();
    }


    function bid(bytes32 blindBid) public payable validPhase(Phase.Bidding) onlyBidders{
        //require(msg.sender != house,'houseBid');    // house should not be allowed to place bids
        count[msg.sender]++;
        if(count[msg.sender] <= 3){
            bids[msg.sender] = Bid({
                blindedBid: blindBid, 
                deposit: msg.value
            });
        }
    }

    function reveal(uint value, bytes32 secret) public validPhase(Phase.Reveal) {
        require(msg.sender != house,'houseReveal');
        uint refund = 0;
        Bid storage bidToCheck = bids[msg.sender];

        if (bidToCheck.blindedBid == keccak256(abi.encodePacked(value, secret))) {
            refund += bidToCheck.deposit;

            if(value * 1000000000000000000 > interimWinningBid){
                    interimWinningBid = value * 1000000000000000000;
                    interimWinningBidder = msg.sender;
            }

            if(count[msg.sender] == 3){
                if (bidToCheck.deposit >= value*1000000000000000000) {
                    if (placeBid(msg.sender, value*1000000000000000000))
                        refund -= value * 1000000000000000000;
                }
            }
        }
        else revert();
        msg.sender.transfer(refund);
    }

    function revealInterimResult() public validPhase(Phase.Reveal){
        emit revealInterimWinner(interimWinningBidder, interimWinningBid);
    }

    // This is an "internal" function which means that it
    // can only be called from the contract itself (or from
    // derived contracts).
    function placeBid(address bidder, uint value) internal returns (bool success)
    {
        if (value <= highestBid) {
            return false;
        }
        if (highestBidder != address(0)) {
            // Refund the previously highest bidder.
            depositReturns[highestBidder] += highestBid;
        }

        highestBid = value;
        highestBidder = bidder;
        return true;
    }

    // Withdraw a non-winning bid
    function withdraw() public {
        uint amount = depositReturns[msg.sender];
        if (amount > 0) {
            depositReturns[msg.sender] = 0;
            msg.sender.transfer(amount);
        }
    }

    // Send the highest bid to the house and
    // end the auction
    function auctionEnd() public validPhase(Phase.Done) {
        if(address(this).balance >= highestBid){
            house.transfer(highestBid);
        }
        emit BidEnded(highestBidder, highestBid);
    }

    function closeAuction() public onlyHouse {
        selfdestruct(house);
    }
}
