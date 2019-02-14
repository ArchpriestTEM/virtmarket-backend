const route = require("express").Router();
const bcrypt = require("bcryptjs");
const registerValidation = require("../validation/register-validation");

const User = require("../models/User");

// POST "/register"
// Creates a new user
route.post("/register", (req, res) => {
  User.findOne(
    // find by email or username
    {
      $or: [{ email: req.body.email }, { user: req.body.name }]
    },
    (err, user) => {
      if (err) {
        return res.status(400).json(err);
      }

      // validation errors
      const errors = registerValidation(req.body, user);

      if (!errors.isValid) {
        return res.status(400).json(errors);
      }
      // create user
      const newUser = new User({
        name: req.body.name,
        email: req.body.email
      });
      // encrypt password
      bcrypt.genSalt(10, (err, salt) => {
        if (err) {
          return res.stauts(400).json(err);
        }
        bcrypt.hash(req.body.password, salt, (err, hash) => {
          if (err) {
            return console.log(err);
          }

          newUser.password = hash;
          // save new user
          newUser.save((err, user) => {
            if (err) {
              return res.status(400).json(err);
            }
            return res.json(user);
          });
        });
      });
    }
  );
});

// POST "/login"
// Logs in a user
route.post("/login", (req, res) => {});

module.exports = route;
