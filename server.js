const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
// config folder omitted from git
const { mongoDb } = require("./config/keys.js");

const app = express();

// routes
const user = require("./routes/user.js");

// middleware
app.use(bodyParser.json());
app.use("/user", user);

mongoose.connect(mongoDb, err => {
  console.log(err || "Connected to database");
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
