const mongoose = require("mongoose");
const isEmpty = require("is-empty");

const Stock = require("./Stock");
const User = require("./User");

const Schema = mongoose.Schema;

const Order = new Schema({
  stock: {
    type: Schema.Types.ObjectId,
    ref: "stocks"
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: "users"
  },
  shares: Number,
  price: Number,
  ordertype: String,
  date: {
    type: Date,
    default: Date.now
  }
});

// delete every reference
Order.post("findOneAndDelete", delOrd => {
  Stock.findOne({ _id: delOrd.stock._id }).then(stock => {
    let stockIndex = stock.orders.findIndex(order => {
      return order._id == delOrd._id;
    });
    stock.orders.splice(stockIndex, 1);
    stock.save().then(stock => {
      User.findOne({ _id: delOrd.user._id }).then(user => {
        let userIndex = user.orders.findIndex(order => {
          return order._id == delOrd._id;
        });
        user.orders.splice(userIndex, 1);
        user.save();
      });
    });
  });
});

// save to stock's order list and user's
Order.post("save", (doc, next) => {
  doc.stock.orders.push(doc);
  doc.stock.save().then(product => {
    doc.user.orders.push(doc);
    doc.user.save().then(product => {
      next();
    });
  });
});

module.exports = mongoose.model("orders", Order);
