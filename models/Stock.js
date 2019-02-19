const mongoose = require("mongoose");

const User = require("./User");
const Order = require("./Order");

const Schema = mongoose.Schema;

const Stock = new Schema({
  name: String,
  symbol: String,
  totalvolume: Number,
  ceo: {
    type: Schema.Types.ObjectId,
    ref: "users"
  },
  owners: [
    {
      type: Schema.Types.ObjectId,
      ref: "users"
    }
  ],

  orders: [
    {
      type: Schema.Types.ObjectId,
      ref: "orders"
    }
  ],
  history: [
    {
      price: Number,
      volume: Number,
      date: {
        type: Date,
        default: Date.now
      }
    }
  ],
  creationdate: {
    type: Date,
    default: Date.now()
  }
});

// middleware
Stock.pre("findOneAndDelete", doc => {
  mongoose.model("users").remove({ owned: doc._id, positions: doc._id });
  mongoose.model("orders").remove({ stock: doc._id }, next);
});

module.exports = mongoose.model("stocks", Stock);
