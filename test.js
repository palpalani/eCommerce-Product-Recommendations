const mongoose = require('mongoose');
const Config = require("./config");

const URI = process.env.MONGOLAB_URI || Config['DB'];
mongoose.connect(URI,{useMongoClient: true,},(err) => console.log(err ? err : "Connected to database"));

const Order = require('./models/order');
const Product = require('./models/product');

let Orders = require('./data/orders.json');
let Products = require('./data/products.json');

Order.insertMany(Orders,function(err){
  console.log(err || "Orders insert success");
})

Product.insertMany(Products,function(err){
  console.log(err || "Products insert success");
})
