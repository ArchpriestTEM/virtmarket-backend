const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const User = new Schema({
  name: String,
  email: String,
  password: String,
  avatar: String,
  money: Number,
  positions: [
    {
      stock: {
        type: Schema.Types.ObjectId,
        ref: "stocks"
      },
      shares: Number
    }
  ]
});

module.exports = mongoose.model("users", User);
