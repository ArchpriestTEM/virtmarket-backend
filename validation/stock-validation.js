const isEmpty = require("is-empty");
const Validator = require("validator");

const validate = newData => {
  const errors = {};
  // make sure there are strings
  newData.name = !isEmpty(newData.name) ? newData.name : "";
  newData.symbol = !isEmpty(newData.symbol) ? newData.symbol : "";

  // Name validation
  if (!Validator.isLength(newData.name, { min: 3, max: 20 })) {
    errors.name = "Stock name must be between 3 and 20 characters";
  }
  if (Validator.isEmpty(newData.name)) {
    errors.name = "Stock name cannot be empty";
  }
  // Symbol validation
  if (!Validator.isLength(newData.symbol, { min: 2, max: 6 })) {
    errors.symbol = "Stock symbol must be between 2 and 6 characters";
  }
  if (Validator.isEmpty(newData.symbol)) {
    errors.symbol = "Stock symbol cannot be empty";
  }

  return { errors, isValid: isEmpty(errors) };
};

module.exports = validate;
