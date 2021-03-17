'use strict';

const mongoose = require('mongoose');

const productSchema = mongoose.Schema({
  product_id: String,
  product_type: String,
  sku: String,
  price: String,
  name: String,
  product_url: String,
  category: String,
  image_url: String,
  store_id: String
});

module.exports = mongoose.model('products', productSchema);
