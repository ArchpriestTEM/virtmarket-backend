const { Schema } = require("mongoose");
const isEmpty = require("is-empty");
// models
const User = require("../models/User");
const Stock = require("../models/Stock");
const Order = require("../models/Order");

const exchange = (order, match) => {
  return new Promise((resolve, reject) => {
    // make sure the match still exists
    if (isEmpty(match)) {
      reject({ error: "Match is empty" });
    }

    // determine buyer and seller
    let buyer = {};
    let seller = {};
    let price = 0;
    let orderIsBuy = true;
    switch (order.ordertype) {
      case "BUY":
        buyer = order.user;
        seller = match.user;
        price = match.price;
        break;
      case "SELL":
        seller = order.user;
        buyer = match.user;
        price = match.price;
        orderIsBuy = false;
        break;
    }

    // if match can absorb, sharesTraded = orders.shares
    let sharesTraded = match.shares;
    if (match.shares > order.shares) {
      sharesTraded = order.shares;
    }

    // buyer fulfillment
    buyer.money -= price * sharesTraded;
    let position = buyer.positions.find(position => {
      return position.stock.toString() == order.stock._id;
    });
    if (isEmpty(position)) {
      buyer.positions.push({
        stock: order.stock._id,
        shares: 0
      });
      position = buyer.positions.find(position => {
        return position.stock.toString() == order.stock._id;
      });
    }
    console.log(position.shares);
    position.shares += sharesTraded;
    console.log(position.shares);
    //seller fulfillment
    seller.money += price * sharesTraded;

    order.shares -= sharesTraded;
    match.shares -= sharesTraded;

    buyer
      .save()
      .then(doc => {
        seller
          .save()
          .then(doc => {
            // remove
            if (match.shares == 0) {
              console.log("match is 0");
              Order.findOneAndDelete({ _id: match._id }).then(() => resolve());
            } else {
              resolve();
            }
          })
          .catch(err => reject(err));
      })
      .catch(err => reject(err));
  });
};

module.exports = exchange;
