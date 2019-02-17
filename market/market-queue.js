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
  this.match = () => {
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
          .filter(order => {
            order.ordertype === targetType;
          })
          .filter(order => {
            order.price <= price;
          })
          .sort((a, b) => {
            a.price - b.price;
          });
        break;
      case "SELL":
        matches = order.stock.orders
          .filter(order => {
            order.ordertype === "BUY";
          })
          .filter(order => {
            order.price <= price;
          })
          .sort((a, b) => {
            b.price - a.price;
          });
        break;
    }

    // loop while there are matches and original order isn't empty
    while (!isEmpty(matches) && order.shares > 0) {
      exchange(order, matches.shift());
    }

    // if the order wasn't competely fullfilled, post it up
    if (order.shares > 0) {
      order.save();
    }

    // finally, invoke the call back
    cb(errors);
  };

  // run queue
  this.run = () => {
    let timer = setInterval(() => {
      if (isEmpty(this.queue)) {
        this.running = false;
        clearInterval(timer);
      }
      this.match();
    }, 1);
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
