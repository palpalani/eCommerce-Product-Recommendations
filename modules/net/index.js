/*============
* Caller module
* Calls the recommender with a given set of inputs and gets the output predictions.
=============*/

const nn = require('nn');
const fs = require('fs');

/* Normalizer */
const normalize = function(set) {
    const max = Math.max.apply(Math, set),
        newArr = set;
    set.forEach(function(x, i) {
        newArr[i] = x / max
    });
    return newArr;
};

const nNet = function(Products,Orders,store_id){
  this.store_id = store_id;
  console.log("Training store ",this.store_id);
  console.log("Products => ",Products.length);
  console.log("Orders => ",Orders.length);
  this.Params = {
    layers: [1],
    iterations: 1000,
    errorThresh: 0.0005,
    activation: 'logistic',
    learningRate: 0.1,
    momentum: 0.5,
    log: 0
  };
  this.Net = nn(this.Params);
  this.Orders = Orders;
  this.Products = Products;
};

nNet.prototype.exec = function(){
  let _that = this;
  _that.Hours =[],_that.Minutes=[],_that.Days=[],_that.Zips=[],_that.Cities=[],_that.Countries=[],_that.productsArr = [];

  _that.Orders.forEach(function(order){
    let _date = new Date(order.order_placed);
    if(_that.Hours.indexOf(_date.getHours()) < 0) _that.Hours.push(_date.getHours());
    if(_that.Minutes.indexOf(_date.getMinutes()) < 0) _that.Minutes.push(_date.getMinutes());
    if(_that.Days.indexOf(_date.getDay()) < 0) _that.Days.push(_date.getDay());
    if(order.city && _that.Cities.indexOf(order.city) < 0)_that. Cities.push(order.city);
    if(order.country && _that.Countries.indexOf(order.country) < 0) _that.Countries.push(order.country);
    if(order.zip_code && _that.Zips.indexOf(order.zip_code) < 0) _that.Zips.push(order.zip_code);
    let _str = JSON.stringify(order.products.map(function(o){return parseInt(o.product_id)}).sort(function(a, b){return a - b}));
    if(_that.productsArr.indexOf(_str) < 0) _that.productsArr.push(_str);
  });

  _dataSet = {
    hours:[],
    minutes:[],
    days:[],
    cities:[],
    zips:[],
    products:[]
  };

  _that.Orders.forEach(function(order){
    let _date = new Date(order.order_placed);
    _dataSet['hours'].push(_that.Hours.indexOf(_date.getHours()));
    _dataSet['minutes'].push(_that.Minutes.indexOf(_date.getMinutes()));
    _dataSet['days'].push(_that.Days.indexOf(_date.getDay()));
    _dataSet['cities'].push(_that.Cities.indexOf(order.city));
    _dataSet['zips'].push(_that.Zips.indexOf(order.zip_code));

    let _str = JSON.stringify(order.products.map(function(o){return parseInt(o.product_id)}).sort(function(a, b){return a - b}));
    _dataSet['products'].push(_that.productsArr.indexOf(_str));

  });

  let _normalizedSet = _dataSet;
  _that.max = {hours:0,minutes:0,days:0,cities:0,zips:0,products:0};
  for(set in _normalizedSet){
    _that.max[set] = Math.max(..._normalizedSet[set]);
    _normalizedSet[set] = normalize(_normalizedSet[set]);
  }
  let _trainingSet = [];
  for(let i=0;i < _that.Orders.length;i++){
    _trainingSet.push({input:[_normalizedSet['hours'][i],_normalizedSet['minutes'][i],_normalizedSet['days'][i],_normalizedSet['cities'][i],_normalizedSet['zips'][i]],output:[_normalizedSet['products'][i]]})
  }

  _that.Net.train(_trainingSet);
  console.log("Training complete => ",_that.store_id);

};

/* Predict values */
nNet.prototype.Predict = function(user){
  let _that = this;
  let _date = new Date();
  let _input = [];

  _input.push(_date.getHours()/_that.max['hours']);
  _input.push(_date.getMinutes()/_that.max['minutes']);
  _input.push(_date.getDay()/_that.max['days']);
  _input.push(_that.Cities.indexOf(user.city)/_that.max['cities']);
  _input.push(_that.Zips.indexOf(user.zip_code)/_that.max['zips']);

  let _val = _that.Net.send(_input)[0] * _that.max['products'];
  let _products = JSON.parse(_that.productsArr[Math.floor(_val)]);
  let _finalProducts = _that.Products.filter(function(product){return _products.indexOf(parseInt(product.product_id)) > -1});

  if(_finalProducts.length > user.limit) return _finalProducts.slice(0,user.limit);
  else if(_finalProducts.length < user.limit) {
    let _len = user.limit - _finalProducts.length;
    for(let i=0;i<_len;i++) _finalProducts.push(_that.Products[Math.floor(Math.random()* _that.Products.length)]);
    return _finalProducts;
  }
  else return _finalProducts;
};

module.exports = nNet;
