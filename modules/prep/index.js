/*============
* Prep module
* Prepares the data for the recommender
=============*/
const mongoose = require('mongoose');
const _ = require('lodash');
const fs = require('fs');

const Net = require('../net');

const Order = require('../../models/order');
const Product = require('../../models/product');
const Map = {};

const Prep = function (callback) {
    /* Group Products by store id */
    Product.find(function (err, Products) {
        if (err)
            console.log(err);
        else {
            console.log(Products.length, " products found");
            let _stores = Products.map(function (product) {
                return product.store_id
            });

            _stores = _.uniq(_stores);

            Order.find(function (error, Orders) {
                if (error)
                    console.log(error);
                else {
                    console.log(Orders.length, " orders found");
                    _stores.forEach(function (store) {
                        Map[store] = {orders: [], products: [], recommender: null}
                    });

                    Orders.forEach(function (order) {
                        if (order.store_id && order.products.length > 0 && order.user_id && Map[order.store_id])
                            if (Map[order.store_id]['orders'].length < 1000) Map[order.store_id]['orders'].push(order);
                    });

                    Products.forEach(function (product) {
                        if (product.store_id) Map[product.store_id]['products'].push(product);
                    });

                    for (var store in Map) {
                        if (Map[store]['products'].length > 0 && Map[store]['orders'].length > 0) {
                            Map[store]['recommender'] = new Net(Map[store]['products'], Map[store]['orders'], store);
                            Map[store]['recommender'].exec();
                        }
                    }
                    console.log("Training completed");
                    callback(Map);
                }
            })
        }
    })
};

module.exports = Prep;
