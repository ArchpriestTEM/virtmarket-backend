const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const registerValidation = require("../validation/register-validation");
const { secret } = require("../config/keys");

// Models
const User = require("../models/User");

// GET /:id
// Retrieves a user by id or username
router.get("/:id", (req, res) => {
  User.findOne(
    { $or: [{ id: req.params.id }, { name: req.params.id }] },
    (err, user) => {
      if (err) {
        return res.status(400).json(err);
      }
      if (user) {
        return res.json({
          name: user.name,
          avatar: user.avatar,
          positions: user.positions,
          orders: user.orders
        });
      } else {
        return res.status(404).json({ msg: "User not found." });
      }
    }
  );
});

// POST /register
// Creates a new user
router.post("/register", (req, res) => {
  User.findOne(
    // find by email or username
    {
      $or: [{ email: req.body.email }, { name: req.body.name }]
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
        email: req.body.email,
        money: 10000
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

// POST /login
// Logs in a user
router.post("/login", (req, res) => {
  User.findOne(
    {
      $or: [{ email: req.body.email }, { name: req.body.name }]
    },
    (err, user) => {
      if (err) {
        return res.status(400).json(err);
      }
      bcrypt.compare(req.body.password, user.password, (err, success) => {
        if (err) {
          return res.status(400).json(err);
        }
        if (!success) {
          return res.status(401).json({ password: "Password is incorrect" });
        } else {
          payload = {
            id: user.id,
            name: user.name,
            avatar: user.avatar
          };
          jwt.sign(payload, secret, {}, (err, token) => {
            if (err) {
              return res.json(400).json(err);
            }
            res.json({
              msg: "Success",
              token: "Bearer " + token
            });
          });
        }
      });
    }
  );
});

module.exports = router;
