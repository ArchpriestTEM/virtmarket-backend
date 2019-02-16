const { Schema } = require("mongoose");
const isEmpty = require("is-empty");
// models
const User = require("../models/User");
const Stock = require("../models/Stock");

// takes transct object and done callback, returns nothing
const exchange = (transct, done) => {
  // determine transaction details
  const cost = transct.ask * transct.shares;

  // find both participants
  Promise.all([
    User.findById(transct.buyerId).populate([
      {
        path: "positions",
        populate: {
          path: "stocks"
        }
      },
      {
        path: "orders",
        populate: {
          path: "stocks"
        }
      }
    ]),
    User.findById(transct.sellerId).populate([
      {
        path: "positions",
        populate: {
          path: "stocks"
        }
      },
      {
        path: "orders",
        populate: {
          path: "stocks"
        }
      }
    ])
  ]).then(([buyer, seller]) => {
    // if one isn't found, return false
    if (!buyer || !seller) {
      return done(false);
    }
    // verify that the buyer has the money
    if (buyer.money < cost) {
      return done(false);
    }
    // verify that the seller has the shares to sell
    const sellerShares = seller.positions.find(stock => {
      return stock._id == transct.stock;
    });
    if (sellerShares.shares < transct.shares) {
      return false;
    }
    // add the money to the seller and subtract from the buyer
    seller.money += cost;
    buyer.money -= cost;
    // add the shares to the buyer
    const buyerPosIndex = buyer.positions.findIndex(stock => {
      return stock._id == transct.stock;
    });
    if (buyerPosIndex < 0) {
      const newPos = new Schema({
        stock: transct.stock,
        shares: transct.shares
      });
      buyer.positions.push(newPos);
    } else {
      buyer.positions[buyerPosIndex].shares += transct.shares;
    }
    // remove the shares from the seller
    const sellerPosIndex = seller.positions.findIndex(stock => {
      return stock._id == transct.stock;
    });
    seller.positions[sellerPosIndex].shares -= transct.shares;
    if (seller.positions[sellerPosIndex].shares <= 0) {
      seller.positions.splice(sellerPosIndex, 1);
    }
    done(true);
  });
};

module.exports = exchange;
