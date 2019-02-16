const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const User = new Schema({
  name: String,
  email: String,
  password: String,
  avatar: String,
  money: Number,
  owned: [
    {
      type: Schema.Types.ObjectId,
      ref: "stocks"
    }
  ],
  positions: [
    {
      stock: {
        type: Schema.Types.ObjectId,
        ref: "stocks"
      },
      shares: Number
    }
  ],
  orders: [
    {
      type: Schema.Types.ObjectId,
      ref: "orders"
    }
  ]
});

module.exports = mongoose.model("users", User);
