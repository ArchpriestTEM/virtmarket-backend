const app = require("express")();
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const passport = require("passport");

// database
const { mongoDb } = require("./config/keys.js");
mongoose.connect(mongoDb, err => {
  console.log(err || "Connected to database");
});

// middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());

// routes
const users = require("./routes/users.js");
const stocks = require("./routes/stocks.js");
app.use("/users", users);
app.use("/stocks", stocks);

// passport
app.use(passport.initialize());
require("./config/passport")(passport);

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
