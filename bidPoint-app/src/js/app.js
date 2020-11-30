App = {
  web3Provider: null,
  contracts: {},
  names: new Array(),
  counter: 0,
  state : 0,
  url: 'http://127.0.0.1:7545',
  // network_id: 5777,
  chairPerson: null,
  currentAccount: null,
  biddingPhases: {
    "AuctionInit": { 'id': 0, 'text': "Bidding Not Started" },
    "BiddingStarted": { 'id': 1, 'text': "Bidding Started" },
    "RevealStarted": { 'id': 2, 'text': "Reveal Started" },
    "AuctionEnded": { 'id': 3, 'text': "Auction Ended" }
  },
  auctionPhases: {
    "0": "Bidding Not Started",
    "1": "Bidding Started",
    "2": "Reveal Started",
    "3": "Auction Ended"
  },

  init: function () {
    console.log("Checkpoint 0");
    return App.initWeb3();
  },

  initWeb3: function () {
    // Is there is an injected web3 instance?
    if (typeof web3 !== 'undefined') {
      App.web3Provider = web3.currentProvider;
    } else {
      // If no injected web3 instance is detected, fallback to the TestRPC
      App.web3Provider = new Web3.providers.HttpProvider(App.url);
    }
    web3 = new Web3(App.web3Provider);
    ethereum.enable();
    App.populateAddress();
    return App.initContract();
  },

  initContract: function () {
    $.getJSON('BidPoint.json', function (data) {
      // Get the necessary contract artifact file and instantiate it with truffle-contract
      var voteArtifact = data;
      App.contracts.vote = TruffleContract(voteArtifact);
      App.contracts.mycontract = data;
      // Set the provider for our contract
      App.contracts.vote.setProvider(App.web3Provider);
      App.currentAccount = web3.eth.coinbase;
      jQuery('#current_account').text(App.currentAccount);
      App.getState(App.getChairperson);
      
      return App.bindEvents();
    });
  },

  bindEvents: function () {
    $(document).on('click', '#submit-bid', App.handleBid);
    $(document).on('click', '#phase-up', App.phaseForward);
    $(document).on('click', '#phase-down', App.phaseBackward);
    $(document).on('click', '#generate-winner', App.handleWinner);
    $(document).on('click', '#submit-reveal', App.handleReveal);
    $(document).on('click', '#close-auction', App.handleClose);
    $(document).on('click', '#withdraw-bid', App.handleWithdraw);
    $(document).on('click', '#generate-interim-winner', App.handleInterimWinner);

    //$(document).on('click', '#register', function(){ var ad = $('#enter_address').val(); App.handleRegister(ad); });
  },

  populateAddress: function () {
    new Web3(new Web3.providers.HttpProvider(App.url)).eth.getAccounts((err, accounts) => {
      jQuery.each(accounts, function (i) {
        if (web3.eth.coinbase != accounts[i]) {
          var optionElement = '<option value="' + accounts[i] + '">' + accounts[i] + '</option';
          jQuery('#enter_address').append(optionElement);
        }
      });
    });
  },

  getState: function(callback) {
    App.contracts.vote.deployed().then(function(instance) {
      return instance.giveInit();
    }).then(function(result) {
      App.state = result.logs[0].args.stateVar.toNumber();
      App.counter = result.logs[0].args.countData.toNumber();
      var notificationText = App.auctionPhases[App.state];
      console.log(App.state);
      console.log(notificationText);
      $('#phase-notification-text').text(notificationText);
      console.log("Phase set");
      callback();
    })
  },


  getChairperson: function() {
    App.contracts.vote.deployed().then(function(instance) {
      $("#generate-winner").css("display", "none");
      return instance.house();
    }).then(function(result) {
      App.chairPerson = result;
      if(App.state == 0 && App.counter == 0) $(".display-round").text("Item for the Session");
      else if(App.counter == 0) $(".display-round").text("Round 1");
      else if(App.counter == 1) $(".display-round").text("Round 2");
      else if(App.counter == 2) $(".display-round").text("Final Round");
      else $(".display-round").text("End of session");

      if(App.state == 1) {
        $(".reveal-layout").hide();
        $(".bidding-layout").show();
      }
      else if(App.state == 2) {
        $(".reveal-layout").show();
        $(".bidding-layout").hide();
      }
      else if(App.state == 3) {
        $(".reveal-layout").hide();
        $(".bidding-layout").hide();
        $(".subs-title").text("Kindly withdraw the non-winning bids");
      }
      else {
        $(".reveal-layout").hide();
        $(".bidding-layout").hide();
        $(".subs-title").text("Session will soon begin");
      }


      if(App.currentAccount == App.chairPerson) {

        $(".chairperson").css("display", "inline");
        $(".img-chairperson").css("width", "100%");
        $(".img-chairperson").removeClass("col-lg-offset-2");
        if(App.state == 0){
          $("#phase-down").hide();
          $("#generate-interim-winner").hide();
        }
        if(App.state == 1){
          // $("#phase-up").css("display", "inline");
          // $("#phase-down").css("display", "none");

          $("#phase-up").show();
          $("#phase-down").hide();
          

        }
        else if(App.state == 2 && App.counter < 2){
          // $("#phase-up").css("display", "none");
          // $("#phase-down").css("display", "inline");

          $("#phase-up").hide();
          $("#phase-down").show();
        }
        else if(App.state == 2 && App.counter == 2){
          $("#phase-up").show();
          $("#phase-down").hide();
        }


        // if(App.counter == 3){
        //   $("#phase-up").show();
        //   $("#phase-down").hide();
        // }
      } else {
        $(".other-user").css("display", "inline");
        $("#withdraw-bid").hide();
        if(App.counter == 2 && App.state == 1){
          $(".deposit-amount").show();
        }
        else{
          $(".deposit-amount").hide();
        }
      }
      if(App.state == 3){
          $("#generate-winner").show();
          $("#generate-interim-winner").hide();
          $("#phase-down").hide();
          $("#withdraw-bid").show();

      }

      if(App.state == 0) $("#generate-interim-winner").hide();




    })
  },
  getCount : function(){
    App.contracts.vote.deployed().then(function (instance) {
      return instance.giveCount();
    }).then(function (result) {
      console.log(result.logs[0].args.countData.toNumber());
        App.counter=result.logs[0].args.countData.toNumber();
        console.log(App.counter);
        console.log(result);
    });
  },
  phaseForward: function (event) {
    App.contracts.vote.deployed().then(function (instance) {
      return instance.advancePhase();
    })
      .then(function (result) {
        if (result) {
          if (parseInt(result.receipt.status) == 1) {
            if (result.logs.length > 0) {
              App.showNotification(result.logs[0].event);
            }
            else {
              App.showNotification("AuctionEnded");
            }
            App.contracts.vote.deployed().then(function(latestInstance) {
              return latestInstance.state();
            }).then(function(result) {
              console.log("This is also working, new phase updated")
              App.state = result;
            })
            return;
          }
          else {
            toastr["error"]("Error in changing to next Event");
          }
        }
        else {
          toastr["error"]("Error in changing to next Event");
        }
      })
      .catch(function (err) {
        toastr["error"]("Error in changing to next Event");
      });
  },





    phaseBackward: function (event) {
    App.contracts.vote.deployed().then(function (instance) {
      return instance.reversePhase();
    })
      .then(function (result) {
        console.log(result);
        if (result) {
          if (parseInt(result.receipt.status) == 1) {
            if (result.logs.length > 0) {
              App.showNotification(result.logs[0].event);
            }
            else {
              App.showNotification("AuctionEnded");
            }
            App.contracts.vote.deployed().then(function(latestInstance) {
              return latestInstance.state();
            }).then(function(result) {
              console.log("This is also working, new phase updated")
              App.state = result;
            })
            return;
          }
          else {
            toastr["error"]("Error in changing to next Event");
          }
        }
        else {
          toastr["error"]("Error in changing to next Event");
        }
      })
      .catch(function (err) {
        toastr["error"]("Error in changing to next Event");
      });
  },







  handleBid: function () {
    event.preventDefault();
    var bidValue = $("#bet-value").val();
    var msgValue = $("#message-value").val();
    web3.eth.getAccounts(function (error, accounts) {
      var account = accounts[0];

      App.contracts.vote.deployed().then(function (instance) {
        bidInstance = instance;

        return bidInstance.bid(bidValue, { value: web3.toWei(msgValue, "ether") });
      }).then(function (result, err) {
        if (result) {
          console.log(result.receipt.status);
          if (parseInt(result.receipt.status) == 1)
            toastr.info("Your Bid is Placed!", "", { "iconClass": 'toast-info notification0' });
          else
            toastr["error"]("Error in Bidding. Bidding Reverted!");
        } else {
          toastr["error"]("Bidding Failed!");
        }
      }).catch(function (err) {
        toastr["error"]("Bidding Failed!");
      });
    });
  },

  handleReveal: function () {
    console.log("button clicked");
    event.preventDefault();
    var bidRevealValue = $("#bet-reveal").val();
    console.log(parseInt(bidRevealValue));
    var bidRevealSecret = $("#password").val();
    web3.eth.getAccounts(function (error, accounts) {
      var account = accounts[0];

      App.contracts.vote.deployed().then(function (instance) {
        bidInstance = instance;

        return bidInstance.reveal(parseInt(bidRevealValue), bidRevealSecret);
      }).then(function (result, err) {
        if (result) {
          console.log(result.receipt.status);
          if (parseInt(result.receipt.status) == 1)
            toastr.info("Your Bid is Revealed!", "", { "iconClass": 'toast-info notification0' });
          else
            toastr["error"]("Error in Revealing. Bidding Reverted!");
        } else {
          toastr["error"]("Revealing Failed!");
        }
      }).catch(function (err) {
        toastr["error"]("Revealing Failed!");
      });
    });
  },


  handleWinner: function () {
    console.log("To get winner");
    var bidInstance;
    App.contracts.vote.deployed().then(function (instance) {
      bidInstance = instance;
      return bidInstance.auctionEnd();
    }).then(function (res) {
      console.log(res);
      var winner = res.logs[0].args.winner;
      var highestBid = res.logs[0].args.highestBid.toNumber();
      toastr.info("Highest bid is " + highestBid + "<br>" + "Winner is " + winner, "", { "iconClass": 'toast-info notification3' });
    }).catch(function (err) {
      console.log(err.message);
      toastr["error"]("Error!");
    })
  },


  handleInterimWinner: function () {
    console.log("To get temporary winner");
    var bidInstance;
    App.contracts.vote.deployed().then(function (instance) {
      bidInstance = instance;
      // if(App.state == 2)
      console.log("Interim winner phase");
      return bidInstance.revealInterimResult();
    }).then(function (res) {
      console.log(res);
      var winner = res.logs[0].args.iWinner;
      var highestBid = res.logs[0].args.iHighestBid.toNumber();
      toastr.info("Highest bid is " + highestBid + "<br>" + "Winner is " + winner, "", { "iconClass": 'toast-info notification3' });
    }).catch(function (err) {
      console.log(err.message);
      toastr["error"]("Error!");
    })
  },

  handleWithdraw: function() {
    if(App.state == 3) {
      console.log("Inside handleWithdraw")
      App.contracts.vote.deployed().then(function(instance) {
        console.log("Trying to call withdraw with currentAccount: " + App.currentAccount);
        return instance.withdraw({from: App.currentAccount });
      }).then(function(result, error) {
        if(result.receipt.status) {
          toastr.info('Your bid has been withdrawn');
        }  
      }).catch(function(error) {
        console.log(err.message);
        toastr["error"]("Error in withdrawing the bid");
      })
    } else {
      toastr["error"]("Not in a valid phase to withdraw bid!");
    }
  },

  handleClose: function() {
    if(App.state == 3) {
      console.log("this worked");
      App.contracts.vote.deployed().then(function(instance) {
        return instance.closeAuction()
      }).then(function(result) {
        if(result.receipt.status) {
          toastr["error"]("Auction is closed!");
        }
      })
    } else {
      toastr["error"]("Not in a valid phase to close the auction!");
    }
  },

  //Function to show the notification of auction phases
  showNotification: function (phase) {
    var notificationText = App.biddingPhases[phase];
    $('#phase-notification-text').text(notificationText.text);
    toastr.info(notificationText.text, "", { "iconClass": 'toast-info notification' + String(notificationText.id) });
  }
};


$(function () {
  $(window).load(function () {
    App.init();
    //Notification UI config
    toastr.options = {
      "showDuration": "1000",
      "positionClass": "toast-top-left",
      "preventDuplicates": true,
      "closeButton": true
    };
  });
});
