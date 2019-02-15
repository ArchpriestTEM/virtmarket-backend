const { Strategy, ExtractJwt } = require("passport-jwt");
const { secret } = require("./keys");
const User = require("../models/User");

const opts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: secret
};

const validateJwt = passport => {
  console.log("Tried");
  passport.use(
    new Strategy(opts, (jwt_payload, done) => {
      User.findOne({ _id: jwt_payload.id }, (err, user) => {
        if (err) {
          return done(err, false);
        }
        if (user) {
          return done(null, user);
        } else {
          return done(null, false);
        }
      });
    })
  );
};

module.exports = validateJwt;
