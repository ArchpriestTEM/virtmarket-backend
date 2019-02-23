const mongoose = require("mongoose");

const Stock = require("./Stock");
const Order = require("./Order");

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
User.post("findOneAndDelete", doc => {
  Order.find({_id: doc.orders._id}).then(async orders=>{
    orders.forEach(order=>{
      await Order.findOneAndDelete({_id : order._id})
    })
  })
});

module.exports = mongoose.model("users", User);
