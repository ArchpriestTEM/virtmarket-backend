const isEmpty = require("is-empty");
const exchange = require("./exchange");
// models
const User = require("../models/User");
const Stock = require("../models/Stock");
const Order = require("../models/Order");

function MarketQueue() {
  this.queue = [];
  this.running = false;

  // adder, also starts queue if empty
  this.add = (order, cb) => {
    this.queue.push(order);

    if (!this.running) {
      this.running = true;
      let timer = setInterval(() => {
        if (!this.running) {
          clearInterval(timer);
        }
        this.match();
      }, 100);
    }
    cb({});
  };
  // match order
  this.match = () => {
    const errors = {};
    if (isEmpty(this.queue)) {
      this.running = false;
      return;
    }
    const { price, shares, stockId, type, user } = this.queue.shift();
    // retrieve stock
    console.log(stockId);
    Stock.findById(stockId, (err, stock) => {
      if (err) {
        errors.mongo = err;
      }
      if (isEmpty(stock)) {
        return (errors.stock = "Stock not found");
      }
      // BUY
      if (type === "BUY") {
        // find matches
        const matches = stock.orders
          .filter(order => {
            order.type === "SELL";
          })
          .filter(order => {
            order.price <= price;
          })
          .sort((a, b) => {
            a.price - b.price;
          });
        //loop through, stop if buy exhausted
        for (match in matches) {
          if (shares == 0) {
            break;
          }
          let curShares = 0;
          if (match.shares >= shares) {
            curShares = shares;
          } else {
            curShares = match.shares;
          }
          exchange(
            {
              buyerId: user,
              sellerId: match.user,
              shares: curShares,
              price: match.price
            },
            success => {
              if (!success) {
                errors.order +=
                  "Couldn't finish transaction with order " + match._id;
              } else {
                const index = stock.orders.findIndex(
                  order => order._id == match._id
                );
                stock.orders[index];
              }
            }
          );
        }
        if (shares > 0) {
          stock.orders.push(
            new Order({
              user: user,
              price: price,
              shares: shares,
              ordertype: "BUY"
            })
          );
        }
        stock.save();
      }
      // SELL
      if (type === "SELL") {
        // find matches
        const matches = stock.orders
          .filter(order => {
            order.type === "BUY";
          })
          .filter(order => {
            order.price <= price;
          })
          .sort((a, b) => {
            b.price - a.price;
          });
        //loop through, stop if buy exhausted
        for (match in matches) {
          if (shares == 0) {
            break;
          }
          let curShares = 0;
          if (match.shares >= shares) {
            curShares = shares;
          } else {
            curShares = match.shares;
          }
          exchange(
            {
              buyerId: match.user,
              sellerId: user,
              shares: curShares,
              price: match.price
            },
            success => {
              if (!success) {
                errors.order +=
                  "Couldn't finish transaction with order " + match._id;
              } else {
                const index = stock.orders.findIndex(
                  order => order._id == match._id
                );
                stock.orders.splice(index, 1);
              }
            }
          );
        }
        // if matching didn't exhaust, put the order up
        if (shares > 0) {
          stock.orders.push(
            new Order({
              user: user,
              price: price,
              shares: shares,
              ordertype: "SELL"
            })
          );
        }
        stock.save();
      }
    });
  };
}

module.exports = new MarketQueue();
