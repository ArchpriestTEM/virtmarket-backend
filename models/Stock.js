const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const Stock = new Schema({
  name: String,
  symbol: String,
  orders: [
    {
      user: {
        type: Schema.Types.ObjectId,
        ref: "users"
      },
      shares: Number,
      price: Number,
      ordertype: String
    }
  ],
  history: [
    {
      price: Number,
      volume: Number
    }
  ],
  creationdate: Date.now
});

module.exports = mongoose.model("stocks", Stock);
