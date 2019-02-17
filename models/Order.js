const mongoose = require("mongoose");
const isEmpty = require("is-empty");

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

// middleware
Order.post("remove", next => {
  mongoose.model("stocks").remove({ orders: this._id });
  mongoose.model("users").remove({ orders: this._id }, next);
});

Order.post("save", (doc, next) => {
  doc.stock.orders.push(doc);
  doc.user.orders.push(doc);
  next();
});

module.exports = mongoose.model("orders", Order);
