const Order = require('../models/order');
const fs = require('fs')
const path = require('path')
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const ejs = require('ejs');
const { promisify } = require('util');

const renderFile = promisify(ejs.renderFile);
const { MailtrapTransport } = require("mailtrap");

// Create transporter
const transporter = nodemailer.createTransport(
    MailtrapTransport({
      token: process.env.Token,
    })
  );

  async function sendEmailWithTemplate(invoice) {
    try {
        if (!invoice || !invoice.email) {
            throw new Error('Invoice data is missing or invalid');
        }

        // Define the template path
        const templatePath = path.join(__dirname, '../views/pages/invoice.ejs');

        // Render EJS template
        const htmlContent = await renderFile(templatePath, {
            PageTitle: 'Invoice',
            path: 'invoice',
            invoice: {
                number: invoice.id.toString(),
                customerName: invoice.name,
                customerAddress: invoice.address,
                items: invoice.documents,
                files: invoice.files,
                shipFile: invoice.shipping.shipFileName ? invoice.shipping.shipFileName : false,
                shipType: invoice.shipping.shipType
            }
        });

        // Send email
        const info = await transporter.sendMail({
            from: `"Apstille" <${process.env.MAIL}>`,
            to: invoice.email,
            subject: 'Your Invoice',
            html: htmlContent
        });

        console.log('Message sent: %s', info.messageId);
    } catch (error) {
        console.error('Error sending email:', error);
    }
}


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

exports.getInvoice = async (req, res, next) => {
    try {
        const invoiceId = req.params.invoiceId;
        const invoice = await Order.findById(invoiceId);

        if (!invoice) {
            return res.status(404).send('Invoice not found');
        }

        await sendEmailWithTemplate(invoice);

        res.render('pages/invoice', {
            PageTitle: 'Invoice',
            path: 'invoice',
            invoice: {
                number: invoiceId,
                customerName: invoice.name,
                customerAddress: invoice.address,
                items: invoice.documents,
                files: invoice.files,
                shipFile: invoice.shipping.shipFileName ? invoice.shipping.shipFileName : false,
                shipType: invoice.shipping.shipType
            }
        });
    } catch (err) {
        console.error('Error fetching invoice:', err);
        res.status(500).send('Internal Server Error');
    }
};

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
    console.log(req.body);
    
    if (shippingMethod == "uploadAirwayBill") {
        let shipfile = req.files[0].filename
        req.session.ship = {
            shipFileName: shipfile,
            shipType: shippingMethod
        }
        
    } else {
        req.session.ship = {
            shipType: req.body.shippingOption,
            shipData: {
                name: req.body.name,
                company: req.body.company,
                streetAddress: req.body.streetAddress,
                city: req.body.city,
                country: req.body.country,
                state: req.body.state,
                zipcode: req.body.zipcode,
                phone: req.body.phone,
            }
        }
        
    }
    console.log('sees',req.session.ship);
    
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
            res.redirect('https://souqalkhaleej.org/payment/?id='+ resalut.id.toString())
        })
        .catch(err => console.log(err))

}


// static pages
exports.getcontact = (req, res, next) => {
    res.render('pages/contact-us', {
        PageTitle: 'Apostille - Contact Us',
        emailSend: req.flash('send'),
        path: '/contact',
    });
}

exports.sendEmail = async (req, res, next) => {
    let {name} = req.body
    let {email} = req.body
    let {subject} = req.body
    let {message} = req.body

    try{
        const info = await transporter.sendMail({
            from: `"contact" <${process.env.MAIL}>`,
            to: 'ahmedibrahim4456@gmail.com',
            subject: `${subject} ${name} ${email}`,
            html: message
        });

        console.log('Message sent: %s', info.messageId);
        req.flash('send', 'Massage Send')
        res.redirect('/contact-us')
    } catch (error) {
        console.error('Error sending email:', error);
        req.flash('send', 'Try Again')
        res.redirect('/contact-us')
    }
    
}