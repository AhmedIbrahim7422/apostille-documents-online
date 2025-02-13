const { count } = require('console');
const fs = require('fs')
const path = require('path')

exports.getIndex = (req, res, next) =>{
    res.render('pages/index', {
        PageTitle: 'Apostille Documents',
        path: '/',
    });
}
exports.getApostilleOrder = (req, res, next) =>{
    res.render('pages/apostille-order', {
        PageTitle: 'Apostille Order',
        path: 'order',
    });
}
exports.getCart = (req, res, next) =>{    
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
exports.getShipping = (req, res, next) =>{    
    if (req.session.order) {    
        return res.render('pages/shipping', {
            PageTitle: 'Shipping',
            path: 'shipping',            
        });        
    }
    res.redirect('/')
}
exports.getPayment = (req, res, next) =>{    
    // if (req.session.order) {    
        return res.render('pages/payment', {
            PageTitle: 'payment',
            path: 'payment',            
        });        
    // }
    // res.redirect('/')
}
exports.postApostilleOrder = (req, res, next) =>{
    let {email} = req.body
    let {name} = req.body
    let {country} = req.body
    let {documents} = req.body
    let files = [] 
    req.files.forEach(file => {
        files.push(file.originalname)
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