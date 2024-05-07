/* Recommender engine */

/* Dependencies */
const express = require('express');
const app = express();
const Config = require("./config");
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const fs = require('fs');
const CronJob = require('cron').CronJob;

/* Invoke Mongodb */
const URI = process.env.MONGOLAB_URI || Config['DB'];
mongoose.connect(URI,{useMongoClient: true,},(err) => console.log(err ? err : 'Connected to database'));

const Order = require('./models/order');
const Product = require('./models/product');

/* Routes */
const Auth = (req,res,next) => (req.query.token === Config['TOKEN']) ? next() : res.sendStatus(401);

/* Express Configuration */
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

app.get('/', Auth, function(req,res){
  res.status(200).send('TargetBay Recommendation API v1.0');
});

app.post('/api/v1/order', Auth, function(req,res){
  new Order(req.body).save(function(e,o){
    e ? res.sendStatus(400) : res.sendStatus(200);
  })
});

app.post('/api/v1/product', Auth, function(req,res){
  new Product(req.body).save(function(e,o){
    e ? res.sendStatus(400) : res.sendStatus(200);
  })
});

app.get('/api/v1/orders/:store_id?', Auth, function(req,res){
  if(req.params.store_id){
    Order.find({store_id:req.params.store_id}).limit(parseInt(req.query.limit) || 10).exec(function(err,docs){
      res.send(err || docs);
    })
  }
  else{
    Order.find().limit(parseInt(req.query.limit) || 10).exec(function(err,docs){
      res.send(err || docs);
    })
  }
});

app.get('/api/v1/products/:store_id?', Auth, function(req,res){
  if(req.params.store_id){
    Product.find({store_id:req.params.store_id}).limit(parseInt(req.query.limit) || 10).exec(function(err,docs){
      res.send(err || docs);
    })
  }
  else{
    Product.find().limit(parseInt(req.query.limit) || 10).exec(function(err,docs){
      res.send(err || docs);
    })
  }
});

// Flush DB.
app.get('/api/v1/flush-all', Auth, function(req,res){
    Order.remove(function(err){
        //err ? res.sendStatus(400) : res.sendStatus(200);
        Product.remove(function(err){
            err ? res.sendStatus(400) : res.sendStatus(200);
        })
    })
});

// Delete all products and orders for selected store.
app.get('/api/v1/flush/:store_id', Auth, function(req,res){
    Order.remove({store_id: req.params.store_id}, function(oErr){
        //err ? res.sendStatus(400) : res.sendStatus(200);
        Product.remove({store_id: req.params.store_id}, function(err){
            err ? res.sendStatus(400) : res.sendStatus(200);
        })
    })
});

// Delete all orders.
app.get('/api/v1/orders/flush', Auth, function(req,res){
  Order.remove(function(err){
    err ? res.sendStatus(400) : res.sendStatus(200);
  })
});

// Delete all products.
app.get('/api/v1/products/flush', Auth, function(req,res){
  Product.remove(function(err){
    err ? res.sendStatus(400) : res.sendStatus(200);
  })
});

// Delete selected order.
app.get('/api/v1/flush/:store_id/order/:order_id', Auth, function(req,res){
    Order.findOneAndRemove({store_id: req.params.store_id, order_id: req.params.order_id}, function(err){
        err ? res.sendStatus(400) : res.sendStatus(200);
    })
});

// Delete selected product.
app.get('/api/v1/flush/:store_id/product/:product_id', Auth, function(req,res){
    Product.findOneAndRemove({store_id: req.params.store_id, order_id: req.params.product_id}, function(err){
        err ? res.sendStatus(400) : res.sendStatus(200);
    })
});

// Return recommendation.
app.get('/api/v1/recommend/:store_id', Auth, function(req,res){
  let _data = {city:req.query.city,zip_code:req.query.zip_code,limit:req.query.limit};
  let _products = Map[req.params.store_id] ? Map[req.params.store_id]['recommender'].Predict(_data) : [];
  res.send(_products);
});

// Prints store information.
app.get('/api/v1/stats', Auth, function(req,res){
    Product.count({}, function( err, products_count){
        Order.count({}, function( err, orders_count){
            err ? res.sendStatus(400) : res.send({
                'products_total': products_count,
                'orders_total': orders_count
            });
        });
    });
});

app.get('/api/v1/stores', Auth, function(req,res){
    Product.find().distinct('store_id', function(error, ids) {
        error ? res.sendStatus(400) : res.send({
            'total': ids.length,
            'stores': ids
        });
    });
});

app.get('/api/v1/trigger', Auth, function(req,res){
    init();
    res.send('TargetBay Recommendation - Re-index triggered.');
});

/* Listen to server */
app.listen(process.env.PORT || 3000);

/* CRON */
const Prep = require('./modules/prep');
let Map;

const init = function(){
  Prep(function(result){
    Map = result;
  });
};

init();
var job = new CronJob('0 0 0 * * *', function() {
  init();
});
