const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const User = new Schema({
  name: String,
  email: String,
  password: String,
  avatar: String,
  money: Number,
  ceo: [
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

// middleware
User.post("deleteOne", next => {
  mongoose.model("orders").remove({ user: this_id });
  mongoose.model("stocks").remove({ orders: this._id }, next);
});

module.exports = mongoose.model("users", User);
