const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
  fullName: String,
  email: { type: String, required: true, unique: true },
  password: String,
  userType: { type: String, default: 'vendor' },
  stallName: String,
  foodType: String,
  foodItem: String,
  city: String,
  location: String,
  phone: String
});

module.exports = mongoose.model('Vendor', vendorSchema);
