const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const Stock = new Schema({
  name: String,
  symbol: String,
  totalvolume: Number,
  owner: {
    type: Schema.Types.ObjectId,
    ref: "users"
  },
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
Stock.post("remove", next => {
  mongoose.model("users").remove({ owned: this._id, positions: this._id });
  mongoose.model("orders").remove({ stock: this._id }, next);
});

module.exports = mongoose.model("stocks", Stock);
