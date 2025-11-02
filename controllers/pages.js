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
        metaDescription: 'Fast online apostille services for FBI and other documents. Get expedited apostille with secure upload and tracked shipping.',
        metaKeywords: 'apostille, FBI apostille, apostille online, document authentication, expedited apostille'
        ,metaImage: '/img/cover.jpg'
    });
}
exports.getApostilleOrder = (req, res, next) => {
    console.log("make order page");
    const ip =  req.headers['x-forwarded-for']?.split(',')[0]?.trim() || // first IP if behind proxy
    req.socket?.remoteAddress ||                             // fallback
    null;

  // Normalize IPv6 format like "::ffff:192.168.0.1"
  const cleanIp = ip?.replace(/^::ffff:/, '');

  console.log('Client IP:', cleanIp);
    res.render('pages/apostille-order', {
        PageTitle: 'Apostille Order',
        path: 'order',
        metaDescription: 'Place your apostille order online for FBI background checks and other documents. Secure upload and expedited processing.',
        metaKeywords: 'apostille order, FBI apostille order, place apostille order, apostille online'
        ,metaImage: '/img/howToApostilleADocument.jpg'
    });
}
exports.getCart = (req, res, next) => {
    if (req.session.order) {
        let filesCount = req.session.order.files.length
        let files = req.session.order.files
        return res.render('pages/cart', {
            PageTitle: 'Cart',
            path: 'cart',
            metaDescription: 'Review your apostille order, uploaded files, and shipping before checkout.',
            metaKeywords: 'apostille cart, order review, apostille order',
            metaImage: '/img/cover.jpg',
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
            metaDescription: 'Choose shipping options and return preferences for your apostille delivery. Multiple FedEx return options available.',
            metaKeywords: 'apostille shipping, return shipping, FedEx, shipping options'
            ,metaImage: '/img/process-bg.jpg'
        });
    }
    res.redirect('/')
}
exports.getPayment = (req, res, next) => {
    const invoiceId = req.params.invoiceId;
    console.log(4);
    
    Order.findById(invoiceId)
        .then(invoice => {
            return res.send(invoice);
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
            metaDescription: 'Your apostille invoice and order details.',
            metaKeywords: 'apostille invoice, order invoice, apostille billing',
            metaImage: '/img/icon.jpg',
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
        metaDescription: 'Contact ApostilleDocuments.online for support with apostille services, order help, and questions about FBI apostilles.',
        metaKeywords: 'contact apostille, apostille support, contact FBI apostille'
        ,metaImage: '/img/cover.jpg'
    });
}
exports.getTerms = (req, res, next) => {
    res.render('pages/terms', {
        PageTitle: 'Apostille - Terms and Service',
        emailSend: req.flash('send'),
        path: '/terms=and-service',
        metaDescription: 'Terms of service for ApostilleDocuments.online. Read our terms and conditions for apostille processing and service use.',
        metaKeywords: 'terms of service, apostille terms, service agreement'
        ,metaImage: '/img/icon.jpg'
    });
}
exports.getPrivacy = (req, res, next) => {
    res.render('pages/privacy', {
        PageTitle: 'Apostille - Privacy Policy',
        emailSend: req.flash('send'),
        path: '/privacy-policy',
        metaDescription: 'Privacy policy for ApostilleDocuments.online describing how we collect, use, and protect your personal data during apostille processing.',
        metaKeywords: 'privacy policy, data protection, apostille privacy, GDPR'
        ,metaImage: '/img/icon.jpg'
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
 
exports.getBlog = (req, res, next) => {
    const posts = [
        
        {
            url: '/apostille-order',
            img: '/img/howToApostilleADocument.jpg',
            title: 'How to Apostille a Document',
            desc: 'A short, easy-to-follow guide that explains the apostille process and what you need to prepare.'
        },
       
        {
            url: '/fbi-channelers',
            img: '/img/fbiChannelers.jpg',
            title: 'FBI Approved Channelers',
            desc: 'Official list of FBI-approved channelers for expedited Identity History Summary checks.'
        },
        {
            url: '/fbi-spain',
            img: '/img/FbiSpainApostille.jpg',
            title: 'FBI Apostille for Spain',
            desc: 'Get your FBI background check apostilled for Spanish visas, residency and more.'
        },
        {
            url: '/fbi-spain-article',
            img: '/img/expFbiSpainApostille.jpg',
            title: 'FBI Background Check Apostille for Spain',
            desc: 'Don\'t let paperwork delay your move to Spain. Fast apostille service for FBI background checks.'
        
        },
        {
            url: '/why-choose-apostille-documents-online',
            img: '/img/icon.jpg',
            title: 'Expedited FBI Background Check Apostille | ApostilleDocuments.online',
            desc: 'Get your FBI background check apostille fast. ApostilleDocuments.online is an approved channeler for expedited FBI apostille services. Learn our simple process and clear apostille cost.'
        }
        ,
        {
            url: '/fbi-apostille-for-portugal',
            img: '/img/FbiPortugalApostille.jpg',
            title: 'FBI Apostille for Portugal (D7 & Golden Visa)',
            desc: 'Get your FBI background check apostilled for Portugal quickly. Expedited processing, transparent pricing & trusted by expats.'
        },
        {
            url: '/apostille-services-mexico-guide',
            img: '/img/mexicoApostille.jpg',
            title: 'Apostille Services in Mexico: The Complete 2025 Guide (Federal vs. State)',
            desc: 'Where to apostille federal vs state documents, costs, and step-by-step guidance to get your documents apostilled in Mexico.'
        },
    ];

    res.render('pages/blog', {
        PageTitle: 'Apostille - Blog',
        path: '/blogs',
        metaDescription: 'Read our blog for guides about apostilles, FBI background checks, and document authentication. Helpful resources and how-tos.',
        metaKeywords: 'apostille blog, FBI apostille guide, document authentication, apostille how-to',
        posts: posts,
        metaImage: '/img/cover.jpg'
    });
}

// Render the Apostille in Mexico comprehensive guide
exports.getApostilleMexicoGuide = (req, res, next) => {
    res.render('pages/apostille-mexico-guide', {
        PageTitle: 'Apostille Services in Mexico: The Complete 2025 Guide (Federal vs. State)',
        path: '/apostille-mexico-guide',
        metaDescription: 'A complete 2025 guide to apostille services (Apostilla) in Mexico. Learn the difference between federal (SEGOB) and state apostille processes, costs, requirements, and which authority to use.',
        metaKeywords: 'Apostille, Apostilla, Mexico, SEGOB, Federal, State, Hague Convention, Legalization, Trámite, 2025 Guide, Notary, Public Document, Apostille Mexico, Apostillar documento',
        metaImage: '/img/howToApostilleADocument.jpg'
    });
}

// Render page for FBI apostille for Spain
exports.getFbiSpain = (req, res, next) => {
    res.render('pages/fbi-spain', {
        PageTitle: 'Expedited FBI Apostille for Spain',
        path: '/fbi-apostille-for-spain-visa-residency',
        metaDescription: 'Get your FBI background check apostilled for use in Spain for visas and residency. Fast and compliant apostille services.',
        metaKeywords: 'FBI apostille Spain, apostille for Spain, Spain visa apostille'
        ,metaImage: '/img/FbiSpainApostille.jpg'
    });
}

// Add FBI channelers static page renderer
exports.getFBIChannelers = (req, res, next) => {
    res.render('pages/fbi-channelers', {
        PageTitle: 'FBI Approved Channelers',
        path: '/fbi-channelers',
        metaDescription: 'Official list of FBI-approved channelers to help you obtain Identity History Summary checks quickly and securely.',
        metaKeywords: 'FBI channelers, approved channeler, FBI background check, channeler list'
        ,metaImage: '/img/fbiChannelers.jpg'
    });
}

// Render marketing/service page for fast FBI apostille
exports.getFbiService = (req, res, next) => {
    res.render('pages/fbi-service', {
        PageTitle: 'Fast FBI Apostille Service: Expedited FBI Background Check Apostille | ApostilleDocuments.online',
        path: '/why-choose-apostille-documents-online',
        metaDescription: 'Get your FBI background check apostille fast. ApostilleDocuments.online is an approved channeler for expedited FBI apostille services. Learn our simple process and clear apostille cost.',
        metaKeywords: 'fast FBI apostille, expedited FBI apostille, FBI background check apostille, apostille service'
        ,metaImage: '/img/icon.jpg'
    });
}

// Render the new Spain article page
exports.getFbiSpainArticle = (req, res, next) => {
    res.render('pages/fbi-spain-article', {
        PageTitle: 'FBI Background Check Apostille for Spain',
        path: '/fbi-spain-article',
        metaDescription: "Don't let paperwork delay your dream of living in Spain. Get your FBI background check apostilled quickly and accurately with ApostilleDocument.online",
        metaKeywords: 'FBI apostille Spain, apostille for Spain, Spain visa apostille, FBI background check apostille'
        ,metaImage: '/img/expFbiSpainApostille.jpg'
    });
}

// Render page for FBI apostille for Portugal
exports.getFbiPortugal = (req, res, next) => {
    res.render('pages/fbi-portugal', {
        PageTitle: 'FBI Apostille for Portugal',
        path: '/fbi-apostille-for-portugal',
        metaDescription: 'Get your FBI background check apostilled for Portugal quickly with FBIExpress.com. Expedited processing, transparent pricing & trusted by expats.',
        metaKeywords: 'FBI apostille Portugal, apostille for Portugal, Portugal visa apostille, D7 apostille'
        ,metaImage: '/img/FbiPortugalApostille.jpg'
    });
}