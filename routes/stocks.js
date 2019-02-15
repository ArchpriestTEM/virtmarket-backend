const router = require("express").Router();
const bcrypt = require("bcryptjs");
const passport = require("passport");
const isEmpty = require("is-empty");
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
        Stock.findById(req.params.id, (err, stock) => {
          if (err) {
            return res.status(400).json(err);
          }
          if (!stock) {
            return res.status(404).json({ msg: "Stock not found" });
          } else {
            const finalOrder = {
              cost: 0,
              shares: req.body.shares
            };
            const matchedOrders = stock.orders
              .filter(order => order.ordertype == "SELL")
              .filter(order => order.price <= req.body.price)
              .sort((a, b) => a.price - b.price);
            // Order matching algorithm
            while (matchedOrders.length > 0 && finalOrder.shares > 0) {
              // If it's shares needed are more than or equal to the order, remove it
              if (finalOrder.shares >= matchedOrders[0].shares) {
                finalOrder.shares -= matchedOrders[0].shares;
                finalOrder.cost +=
                  matchedOrders[0].shares * matchedOrders[0].price;
                const index = stock.orders.findIndex(order => {
                  return order._id == matchedOrders[0]._id;
                });
                stock.orders.splice(index, 1);
                matchedOrders.shift();
              } else {
                const index = stock.orders.findIndex(order => {
                  return order._id == matchedOrders[0]._id;
                });
                const sharesToBuy = finalOrder.shares;
                finalOrder.shares = 0;
                finalOrder.cost += matchedOrders[0].price * sharesToBuy;
                stock.orders[index].shares -= sharesToBuy;
              }
            }
            if (finalOrder.shares > 0) {
              stock.orders.push({
                user: req.user.id,
                price: req.body.price,
                shares: finalOrder.shares,
                ordertype: "BUY"
              });
            }
            stock.save((err, stock) => {
              if (err) {
                return res.status(400).json(err);
              }
              return res.json(stock);
            });
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
        Stock.findById(req.params.id, (err, stock) => {
          if (err) {
            return res.status(400).json(err);
          }
          if (!stock) {
            return res.status(404).json({ msg: "Stock not found" });
          } else {
            const finalOrder = {
              shares: req.body.shares
            };
            const matchedOrders = stock.orders
              .filter(order => order.ordertype == "BUY")
              .filter(order => order.price >= req.body.price)
              .sort((a, b) => b.price - a.price);

            // Order matching algorithm
            while (matchedOrders.length > 0 && finalOrder.shares > 0) {
              // If shares needed are more than or equal to the order, remove it
              if (finalOrder.shares >= matchedOrders[0].shares) {
                const index = stock.orders.findIndex(order => {
                  return order._id == matchedOrders[0]._id;
                });
                finalOrder.shares -= matchedOrders[0].shares;
                stock.orders.splice(index, 1);
                matchedOrders.shift();
              } else {
                const index = stock.orders.findIndex(order => {
                  return order._id == matchedOrders[0]._id;
                });
                stock.orders[index].shares -= finalOrder.shares;
                finalOrder.shares = 0;
              }
            }
            if (finalOrder.shares > 0) {
              stock.orders.push({
                user: req.user.id,
                price: req.body.price,
                shares: finalOrder.shares,
                ordertype: "SELL"
              });
            }
            stock.save((err, stock) => {
              if (err) {
                return res.status(400).json(err);
              }
              return res.json(stock);
            });
          }
        });
      }
    });
  }
);

module.exports = router;
