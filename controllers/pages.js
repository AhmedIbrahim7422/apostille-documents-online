const Order = require('../models/order');
const fs = require('fs')
const path = require('path')
const crypto = require('crypto');

exports.getIndex = (req, res, next) => {
    res.render('pages/index', {
        PageTitle: 'Apostille Documents',
        path: '/',
    });
}
exports.getApostilleOrder = (req, res, next) => {
    res.render('pages/apostille-order', {
        PageTitle: 'Apostille Order',
        path: 'order',
    });
}
exports.getCart = (req, res, next) => {
    if (req.session.order) {
        let filesCount = req.session.order.files.length
        let files = req.session.order.files
        return res.render('pages/cart', {
            PageTitle: 'Cart',
            path: 'cart',
            country: req.session.order.country,
            count: filesCount,
            files: files,
            documents: req.session.order.documents
        });
    }
    res.redirect('/')
}
exports.getShipping = (req, res, next) => {
    console.log('ss', req.session.order);

    if (req.session.order) {
        return res.render('pages/shipping', {
            PageTitle: 'Shipping',
            path: 'shipping',
        });
    }
    res.redirect('/')
}
exports.getPayment = (req, res, next) => {
    // if (req.session.order) { 
    return res.render('pages/payment', {
        PageTitle: 'payment',
        path: 'payment',
        hash: "abd68ae996eb3ba09910db050851ab226a7a69de01bce1b249c31a3164f4aa28"
    });
    // }
    // res.redirect('/')
}
exports.postApostilleOrder = (req, res, next) => {
    let { email } = req.body
    let { name } = req.body
    let { country } = req.body
    let { documents } = req.body
    let files = []
    console.log('doc', documents);
    console.log("asd", req.files);

    req.files.forEach(file => {
        files.push(file.filename)
    });
    req.session.order = {
        email: email,
        name: name,
        country: country,
        files: files,
        documents: documents
    }
    res.redirect('/cart')
}


exports.postShipping = (req, res, next) => {
    let { shippingMethod } = req.body
    if (shippingMethod == "uploadAirwayBill") {
        let shipfile = req.files[0].filename
        req.session.ship = {
            shipFileName: shipfile,
            shipType: shippingMethod
        }

        const order = new Order({
            name: req.session.order.name,
            email: req.session.order.email,
            country: req.session.order.country,
            documents: req.session.order.documents,
            files: req.session.order.files,
            shipping: req.session.ship
        })
        order.save()
            .then(resalut => {
                console.log(resalut);
                res.redirect('/payment')
            })
            .catch(err => console.log(err))
    }

}