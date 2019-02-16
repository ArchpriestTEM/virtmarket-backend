const router = require("express").Router();
const bcrypt = require("bcryptjs");
const passport = require("passport");
const isEmpty = require("is-empty");
const marketQueue = require("../market/market-queue");
const stockValidation = require("../validation/stock-validation");
const orderValidation = require("../validation/order-validation");

// Models
const User = require("../models/User");
const Stock = require("../models/Stock");

// GET /all
// Fetches all active stocks
router.get("/all", (req, res) => {
  Stock.find((err, stocks) => {
    if (err) {
      return res.status(400).json(err);
    }
    if (isEmpty(stocks)) {
      return res.status(404).json({ msg: "No stocks found" });
    } else {
      return res.json(stocks);
    }
  });
});

// GET /:id
// Fetches stock by id or symbol
router.get("/:id", (req, res) => {
  Stock.findOne(
    {
      $or: [
        { _id: req.params.id },
        { symbol: { $regex: new RegExp(req.params.id, "i") } }
      ]
    },
    (err, stock) => {
      if (err) {
        return res.status(400).json(err);
      }
      if (!stock) {
        return res.status(404).json({ msg: "Stock not found" });
      } else {
        return res.json(stock);
      }
    }
  );
});

// POST /create
// Creates a new stock
router.post(
  "/create",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const { errors, isValid } = stockValidation(req.body);
    // Check if stock exists, if it does falsify isValid and add msg to errors
    if (!isValid) {
      return res.status(400).json(errors);
    }
    // Verfiy if user can create the stock
    User.findById(req.user.id, (err, user) => {
      if (err) {
        return res.status(400).json(err);
      }
      if (!user) {
        return res.status(404).json({ msg: "User not found." });
      } else {
        if (user.owned.length >= 3) {
          return res.json({ msg: "Cannot create more than three stock." });
        } else {
          Stock.findOne(
            { $or: [{ name: req.body.name }, { symbol: req.body.symbol }] },
            (err, stock) => {
              if (err) {
                return res.status(400).json(err);
              }
              if (stock) {
                const errors = {};
                if (stock.name === req.body.name) {
                  errors.name = "Stock name already taken";
                }
                if (stock.symbol === req.body.symbol) {
                  errors.symbol = "Stock symbol already taken";
                }
                return res.json(errors);
              } else {
                const newStock = new Stock({
                  name: req.body.name,
                  symbol: req.body.symbol,
                  owner: user.id
                });
                newStock.save((err, stock) => {
                  if (err) {
                    return res.status(400).json(err);
                  }
                  return res.json(stock);
                });
              }
            }
          );
        }
      }
    });
  }
);

// POST /buy/:id
// Places a new order for stock :id
router.post(
  "/buy/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const { errors, isValid } = orderValidation(req.body);
    if (!isValid) {
      return res.status(400).json(errors);
    }
    // make sure the user is logged
    User.findById(req.user.id, (err, user) => {
      if (err) {
        return res.status(400).json(err);
      }
      if (!user) {
        return res.status(404).json({ msg: "User not found" });
      } else {
        // determine if the user can afford this order
        const orderCost = req.body.shares * req.body.price;
        if (orderCost >= req.user.money) {
          return res.json({ msg: "You cannot afford this order." });
        }
        // to be sent to queue
        const order = {
          stockId: req.params.id,
          type: "BUY",
          user: user,
          shares: req.body.shares,
          price: req.body.price
        };
        marketQueue.add(order, err => {
          if (!isEmpty(err)) {
            return res.status(400).json(err);
          } else {
            return res.json({ msg: "Success" });
          }
        });
      }
    });
  }
);

// POST /sell/:id
// Places a new order for stock :id
router.post(
  "/sell/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const { errors, isValid } = orderValidation(req.body);
    if (!isValid) {
      return res.status(400).json(errors);
    }
    // make sure the user is logged
    User.findById(req.user.id, (err, user) => {
      if (err) {
        return res.status(400).json(err);
      }
      if (!user) {
        return res.status(404).json({ msg: "User not found" });
      } else {
        // determine if the user can afford this order in terms of shares
        const orderCost = req.body.shares;
        const position = user.positions.find(pos => {
          return pos.stock._id == req.params.id;
        });
        if (!isEmpty(position) && position.shares < orderCost) {
          return res.json({ msg: "You do not have enough shares." });
        }
        const order = {
          stockId: req.params.id,
          type: "SELL",
          user: user,
          shares: req.body.shares,
          price: req.body.price
        };
        marketQueue.add(order, err => {
          if (!isEmpty(err)) {
            return res.status(400).json(err);
          } else {
            return res.json({ msg: "Success" });
          }
        });
      }
    });
  }
);

module.exports = router;
