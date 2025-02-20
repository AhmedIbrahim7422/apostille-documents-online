const path = require('path');

const express = require('express');

const router = express.Router();

const pages = require("../controllers/pages")
const auth = require("../controllers/auth")

router.get('/', pages.getIndex);

router.get('/apostille-order', pages.getApostilleOrder);

router.get('/cart', pages.getCart);

router.get('/shipping', pages.getShipping);

router.get('/payment/:invoiceId', pages.getPayment);

router.get('/invoice/:invoiceId', pages.getInvoice);

router.post('/apostille-order', pages.postApostilleOrder);

router.post('/shipping', pages.postShipping);

// router.get('/getpayment', auth.getHash);

module.exports = router
