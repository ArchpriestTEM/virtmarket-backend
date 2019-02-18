const isEmpty = require("is-empty");
const exchange = require("./exchange");
// models
const User = require("../models/User");
const Stock = require("../models/Stock");
const Order = require("../models/Order");

function MarketQueue() {
  this.queue = [];
  this.running = false;

  // match order
  this.match = async () => {
    const errors = {};
    if (isEmpty(this.queue)) {
      this.running = false;
      return;
    }
    const { order, cb } = this.queue.shift();

    // set up by ordertype
    let matches = [];
    switch (order.ordertype) {
      case "BUY":
        matches = order.stock.orders
          .filter(potOrder => {
            return potOrder.ordertype == "SELL";
          })
          .filter(potOrder => {
            return potOrder.price <= order.price;
          })
          .sort((a, b) => {
            return a.price - b.price;
          });
        break;
      case "SELL":
        matches = order.stock.orders
          .filter(potOrder => {
            return potOrder.ordertype == "BUY";
          })
          .filter(potOrder => {
            return potOrder.price <= order.price;
          })
          .sort((a, b) => {
            return b.price - a.price;
          });
        break;
    }
    // loop while there are matches and original order isn't empty

    while (!isEmpty(matches) && order.shares > 0) {
      await exchange(order, matches.shift()).catch(err => {
        console.log(err);
      });
    }

    // if the order wasn't competely fullfilled, post it up
    if (order.shares > 0) {
      if (order.ordertype == "BUY") {
        order.user.money -= order.shares * order.price;
      } else {
        let sellpos = order.user.positions.findIndex(position => {
          return position.stock.toString() == order.stock._id;
        });

        order.user.positions[sellpos].shares -= order.shares;
      }
      order.save();
    }

    // finally, invoke the call back
    cb(errors);
    this.run();
  };

  // run queue or check
  this.run = () => {
    if (isEmpty(this.queue)) {
      return (this.running = false);
    }
    this.match();
  };

  // adder, also starts queue if empty
  this.add = (order, cb) => {
    this.queue.push({ order, cb });
    if (!this.running) {
      this.run();
    }
  };
}

module.exports = new MarketQueue();
