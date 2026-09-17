// Registers the Local and Google OAuth2 strategies. Both run with
// { session: false } — auth state lives entirely in the JWT httpOnly
// cookie, not in express-session, so there's no serializeUser/deserializeUser.

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

// Local Strategy (email/password)
passport.use(
  new LocalStrategy(
    { usernameField: 'email', passwordField: 'password' },
    async (email, password, done) => {
      try {
        // password has select:false on the schema, so it must be pulled in explicitly
        const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

        if (!user) {
          return done(null, false, { message: 'Invalid email or password' });
        }

        if (!user.isActive) {
          return done(null, false, { message: 'This account has been deactivated' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
          return done(null, false, { message: 'Invalid email or password' });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

// Google OAuth2 Strategy 
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
          const email = profile.emails && profile.emails[0] && profile.emails[0].value;

          // If a citizen already signed up with email/password using the same
          // email, link the Google account to it instead of creating a duplicate.
          user = email ? await User.findOne({ email: email.toLowerCase() }) : null;

          if (user) {
            user.googleId = profile.id;
            if (!user.avatar && profile.photos && profile.photos[0]) {
              user.avatar = profile.photos[0].value;
            }
            await user.save();
          } else {
            if (!email) {
              return done(null, false, { message: 'Google account has no public email' });
            }
            user = await User.create({
              name: profile.displayName,
              email: email.toLowerCase(),
              googleId: profile.id,
              avatar: (profile.photos && profile.photos[0] && profile.photos[0].value) || '',
              role: 'citizen',
            });
          }
        }

        if (!user.isActive) {
          return done(null, false, { message: 'This account has been deactivated' });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

module.exports = passport;
