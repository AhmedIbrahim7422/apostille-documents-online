const path = require('path');

const express = require('express');

const router = express.Router();

const pages = require("../controllers/pages")

router.get('/', pages.getIndex);

router.get('/apostille-order', pages.getApostilleOrder);

router.get('/cart', pages.getCart);

router.get('/shipping', pages.getShipping);

router.post('/apostille-order', pages.postApostilleOrder);
module.exports = router
