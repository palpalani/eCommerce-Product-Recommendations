'use strict';

const mongoose = require('mongoose');

const orderSchema = mongoose.Schema({
  user_id: String,
  order_placed: String,
  order_total: String,
  city: String,
  country: String,
  zip_code: String,
  products: Array,
  store_id: String
});

module.exports = mongoose.model('orders',orderSchema);
