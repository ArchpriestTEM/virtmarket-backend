const JwtStrategy = require("passport-jwt").Strategy;
const ExtractorJwt = require("passport-jwt").ExtractJwt;
const mongoose = require("mongoose");

const User = mongoose.model("users");

const opt = {};

opt.jwtFromRequest = ExtractorJwt.fromAuthHeaderAsBearerToken();
opt.secretOrKey = require("./keys").secret;

module.exports = passport => {
  passport.use(
    new JwtStrategy(opt, (payload, done) => {
      User.findById(payload.id)
        .then(user => {
          if (user) {
            return done(null, user);
          }
          return done(null, false);
        })
        .catch(err => {
          console.log(err);
        });
    })
  );
};
