const { Schema } = require("mongoose");
const isEmpty = require("is-empty");
// models
const User = require("../models/User");
const Stock = require("../models/Stock");

const exchange = (order, match) => {
  // make sure the match still exists
  if (isEmpty(match)) {
    return;
  }

  // determine buyer and seller
  const buyer = {};
  const seller = {};
  const price = 0;
  const orderIsBuy = true;
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
  const sharesTraded = match.shares;
  if (match.shares > order.shares) {
    sharesTraded = order.shares;
  }

  // buyer fulfillment
  buyer.money -= ask * sharesTraded;
  const position = buyer.positions.find(position => {
    return position.stock == order.stock._id;
  });
  if (isEmpty(position)) {
    position = buyer.positions.push({
      stock: order.stock._id,
      shares: 0
    });
  }
  position.shares += sharesTraded;

  //seller fulfillment
  if (orderIsBuy) {
    match.shares -= sharesTraded;
  } else {
    order.shares -= sharesTraded;
  }
  const index = seller.positions.findIndex(position => {
    return (position.stock = order.stock._id);
  });
  seller.positions[index].shares -= sharesTraded;
  if (seller.positions[index].shares == 0) {
    seller.positions.splice(index, 1);
  }

  // remove
  if (match.shares == 0) {
    match.remove();
  }
};

module.exports = exchange;
