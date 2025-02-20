const Order = require('../models/order');
const fs = require('fs')
const path = require('path')
const crypto = require('crypto');

exports.getIndex = (req, res, next) => {
    res.render('pages/index', {
        PageTitle: 'Apostille',
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
    const invoiceId = req.params.invoiceId;
    console.log(4);
    
    Order.findById(invoiceId)
        .then(invoice => {
            return res.send( invoice);
        })
        .catch(err => console.log(err))
}

exports.getInvoice = (req, res, next) => {
    const invoiceId = req.params.invoiceId;
    Order.findById(invoiceId)
        .then(invoice => {
            return res.render('pages/invoice', {
                PageTitle: 'invoice',
                path: 'invoice',
                invoice: {
                    number: invoiceId,
                    customerName: invoice.name,
                    customerAddress: invoice.address,
                    items: invoice.documents,                    
                }                
            });
        })
        .catch(err => console.log(err))
}

exports.postApostilleOrder = (req, res, next) => {
    let { email } = req.body
    let { name } = req.body
    let { address } = req.body
    let { phone } = req.body
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
        address: address,
        phone: phone,
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
            address: req.session.order.address,
            phone: req.session.order.phone,
            country: req.session.order.country,
            documents: req.session.order.documents,
            files: req.session.order.files,
            shipping: req.session.ship
        })
        order.save()
            .then(resalut => {
                console.log(resalut);
                res.redirect('/')
            })
            .catch(err => console.log(err))
    }

}