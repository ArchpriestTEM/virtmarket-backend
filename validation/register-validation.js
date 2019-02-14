const isEmpty = require("is-empty");
const Validator = require("validator");

const validate = (newData, userData) => {
  const errors = {};
  // make sure there are strings
  newData.name = !isEmpty(newData.name) ? newData.name : "";
  newData.email = !isEmpty(newData.email) ? newData.email : "";
  newData.password = !isEmpty(newData.password) ? newData.password : "";
  newData.passwordconfirm = !isEmpty(newData.passwordconfirm)
    ? newData.passwordconfirm
    : "";
  // if user exists already, find which info exists
  if (!isEmpty(userData)) {
    if (newData.name === userData.name) {
      errors.name = "Username already registered";
    }
    if (newData.email === userData.email) {
      errors.email = "Email already in use";
    }
  }
  // Username validation
  if (!Validator.isLength(newData.name, { min: 3, max: 20 })) {
    errors.name = "Username must be between 3 and 20 characters";
  }
  if (Validator.isEmpty(newData.name)) {
    errors.name = "Username cannot be empty";
  }
  // Email validation
  if (!Validator.isEmail(newData.email)) {
    errors.email = "Email not valid";
  }
  if (Validator.isEmpty(newData.email)) {
    errors.email = "Email cannot be empty";
  }
  // Password validation
  if (!Validator.isLength(newData.password, { min: 5 })) {
    errors.password = "Password must be minumum of 5 characters";
  }
  if (Validator.isEmpty(newData.password)) {
    errors.password = "Password cannot be empty";
  }
  if (newData.password !== newData.passwordconfirm) {
    errors.passwordconfirm = "Password confirmation doesn't match";
  }
  return { errors, isValid: isEmpty(errors) };
};

module.exports = validate;
