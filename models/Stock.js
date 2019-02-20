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
  // remove from players
  User.find({ "positions.stock": doc._id }).then(users => {
    users.forEach(user => {
      let index = user.positions.findIndex(position => {
        return position.stock == doc._id;
      });
      if (user.positions[index].ordertype == "BUY") {
        user.money +=
          user.positions[index].price * user.positions[index].shares;
      }
      user.positions.splice(index, 1);
      let ceoIndex = user.ceo.findIndex(ce => {
        return ce == doc._id;
      });
      if (ceoIndex >= 0) {
        user.ceo.splice(ceoIndex, 1);
      }
      Order.deleteMany({ stock: doc._id }, err => {
        if (err) {
          console.log(err);
        }
      });
    });
  });
});

module.exports = mongoose.model("stocks", Stock);
