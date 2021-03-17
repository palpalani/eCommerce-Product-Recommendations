
# eCommerce Product Recommendations

Analyse order history of customers and recommend products for new customers which enables higher sales volume.

## Installation

* Install Node.js (v10.x) and NPM
* Install Mongodb
* Run 'npm install'
* Run 'node server.js' to run the recommender in a 24 hour CRON
* Refer API documentation for usage instructions

### API

```sh
POST /api/v1/order
```
Create a new order in the database. This should be enabled when each order is placed by the customer.

```sh
POST /api/v1/recommend/:store_id
```
Recommends list of products based on the city,zip_code and the limit.