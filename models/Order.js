const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const Order = new Schema({
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

module.exports = mongoose.model("orders", Order);
