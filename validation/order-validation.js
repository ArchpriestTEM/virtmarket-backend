const isEmpty = require("is-empty");
const Validator = require("validator");

const validate = orderData => {
  const errors = {};
  // make sure there are strings
  orderData.price = !isEmpty(orderData.price) ? orderData.price : 0;
  orderData.shares = !isEmpty(orderData.shares) ? orderData.shares : 0;

  // price validation
  if (orderData.price <= 0) {
    errors.price = "Stock price must must be more than 0";
  }
  // shares validation
  if (orderData.shares <= 0) {
    errors.shares = "Desired shares must be more than 0";
  }
  return { errors, isValid: isEmpty(errors) };
};

module.exports = validate;
