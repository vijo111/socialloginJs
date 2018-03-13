var http = require('http');
var express = require('express');
var path = require('path');
var User = require('./user.js');
var passport = require('passport');
var config = require('./oauth.js');
var FacebookStrategy = require('passport-facebook').Strategy;
var GoogleStrategy = require('passport-google-oauth2').Strategy;

// serialize and deserialize
passport.serializeUser(function (user, done) {
  done(null, user);
});
passport.deserializeUser(function (obj, done) {
  done(null, obj);
});

passport.use(new FacebookStrategy({
  clientID: config.facebook.clientID,
  clientSecret: config.facebook.clientSecret,
  callbackURL: config.facebook.callbackURL,
  profileFields: ['id', 'displayName', 'name', 'gender', 'emails', 'picture.type(large)']
},
  // facebook will send back the token and profile
  function (token, refreshToken, profile, done) {
    process.nextTick(function () {
      var newUser = new User();

      newUser.provider = "Facebook";
      newUser.id = profile.id;
      newUser.token = token;
      newUser.name = profile.name.givenName + ' ' + profile.name.familyName;
      newUser.email = profile.emails[0].value;
      newUser.gender = profile.gender;
      newUser.picture = profile.photos[0].value;
      return done(null, newUser);
    });
  }
));

passport.use(new GoogleStrategy({
  clientID: config.google.clientID,
  clientSecret: config.google.clientSecret,
  callbackURL: config.google.callbackURL,
  passReqToCallback: true
},
  function (request, accessToken, refreshToken, profile, done) {
    process.nextTick(function () {

      var newUser = new User();

      newUser.provider = 'Google';
      newUser.id = profile.id;
      newUser.token = accessToken;
      newUser.name = profile.name.givenName + ' ' + profile.name.familyName;
      newUser.email = profile.emails[0].value;
      newUser.gender = profile.gender;
      newUser.picture = profile.photos[0].value;
      return done(null, newUser);
    });
  }
));

var app = express();

app.configure(function () {
  app.set('views', __dirname + '/views');
  app.use(express.logger());
  app.use(express.cookieParser());
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.session({ secret: 'my_precious' }));
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

// route for home page
app.get('/', function (req, res) {
  res.render('index.ejs'); // load the index.ejs file
});

app.get('/home', ensureAuthenticated, function (req, res) {
  res.render('home.ejs', { user: req.user });
});

app.get('/', function (req, res) {
  res.render('login', { user: req.user });
});

// route for facebook authentication and login
app.get('/auth/facebook', passport.authenticate('facebook', { scope: 'email' }));

// handle the callback after facebook has authenticated the user
app.get('/auth/facebook/callback',
  passport.authenticate('facebook', {
    successRedirect: '/home',
    failureRedirect: '/'
  }));

app.get('/auth/google',
  passport.authenticate('google', {
    scope: [
      'https://www.googleapis.com/auth/plus.login',
      'https://www.googleapis.com/auth/plus.profile.emails.read'
    ]
  }
  ));
app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  function (req, res) {
    res.redirect('/home');
  });


app.get('/logout', function (req, res) {
  req.logout();
  res.redirect('/');
});

// port
app.listen(8080);

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/');
}