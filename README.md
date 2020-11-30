# BidPoint
#### 	Major Area: Competitive Market Place
####  Title: Online commerce for multiple products.
#### 	Dapp Name: BidPoint-Dapp
#### 	Clients: Buyers/Sellers
## 	Problem Statement: 
•	This application will be a decentralized market place for people around the world. In this DAPP users across the globe can find what they want and can bid over the item. The bidding will be set up within a certain time frame. This DAPP will become a competitive market place. 
•	The DAPP will establish direct contact between the buyers and the sellers. The transactions will take place in real-time and only between the concerned parties. Blockchain will ensure a trust layer that will verify and validate the information of the users leaving zero doubts of whether the clients are spending the right amount and check whether the transactions are going to the right party.
## Components:
### Security:
* I have used the kaccak256 hashing function in order to secure the online bidding process
* Each bid is hashed using a unique password creating a unique hash for each user, making it a secure transaction
* keccak256(abi.encodePacked(value, secret))
      where,
	o value: transaction amount
	o secret: hashing password


### Events:
* Events are used to store arguments that are passed in a transaction and emitted are emitted in transaction logs
* All the events used in the contract are as follows,
	o BiddingStarted: indicates bidding session has started
	o RevealStarted: indicates the bids are in submission phase
	o AuctionInit: indicates initialization phase
	o FinalPhase: indicates the last phase
	o BidEnded: indicates the termination of the smart contract
* All these events are emitted in relevant sections of the contract

### Web Components:

*Bidder and the House have separate UI.
*Every application is incomplete without the front end. This phase deals with developing the front-end and integrating it with the previously developed smart contract. The features of the smart contract are accessed using web3Provider. By the end of this phase I develop a full-stack Dapp.

*The BidPoint-Dapp is a competitive market place. There are 4 phases and 3 cycles of bidding.
The 4 phases are init, start bidding, submit/reveal bids, and end bid. The execution flow is as illustrated in phase 3. 


#### Note:  For detailed explanations kindly refer to the Phase5.pdf.
