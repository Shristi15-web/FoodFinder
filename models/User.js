const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fullName: String,
  email: { type: String, required: true, unique: true },
  password: String,
  userType: { type: String, default: 'user' }
});

module.exports = mongoose.model('User', userSchema);
