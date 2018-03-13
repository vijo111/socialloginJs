var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');

var userSchema = mongoose.Schema({
  id: String,
  token: String,
  email: String,
  name: String,
  username: String,
  gender: String,
  picture: String,
  provider: String,
});


module.exports = mongoose.model('User', userSchema);