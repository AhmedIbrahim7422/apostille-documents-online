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
// static pages
router.get('/privacy-policy', pages.getPrivacy);
router.get('/terms-and-service', pages.getTerms);
router.get('/contact-us', pages.getcontact);
router.post('/send-email', pages.sendEmail);
router.get('/blogs', pages.getBlog);
router.get('/fbi-channelers', pages.getFBIChannelers);
router.get('/fbi-apostille-for-spain-visa-residency', pages.getFbiSpain);
router.get('/fbi-spain', pages.getFbiSpain);
router.get('/fbi-spain-article', pages.getFbiSpainArticle);
router.get('/why-choose-apostille-documents-online', pages.getFbiService);
router.get('/fbi-apostille-for-portugal', pages.getFbiPortugal);
// Apostille Mexico comprehensive guide
router.get('/apostille-services-mexico-guide', pages.getApostilleMexicoGuide);
router.get('/expedited-us-department-of-state-apostille', pages.getExpeditedUsApostille);


module.exports = router
