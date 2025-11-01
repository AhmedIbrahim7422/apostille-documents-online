const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require("mongoose")
const session = require("express-session")
const mongoDBStore = require("connect-mongodb-session")(session);
const csrf = require("csurf");
const flash = require("connect-flash");
const multer = require('multer');
const https = require('https')
const cors = require('cors');
const fs = require("fs")


const app = express();
require('dotenv').config();

const MONGODB_URL = process.env.DATABASE_URL;
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));

app.use(cors());
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // Set to true in production with HTTPS
}));

const csrfProtection = csrf()

app.use(flash())
const privateKey = fs.readFileSync('key.pem')
const certificate = fs.readFileSync('cert.pem')

app.set('view engine', 'ejs');
const pagesRoutes = require('./routes/pages')
let date = new Date()
let dateTime = date.getTime()
const fileStorage = multer.diskStorage({
    destination: 'public/docs',
    filename: (req, file, cb) => {
        console.log('hh', req.body);
        cb(null, `${req.body.name ? req.body.name : req.session.order.name + "ship"}-${dateTime}-${file.originalname}`);
    }
});
app.use(multer({ storage: fileStorage }).array('files[]'));


app.use(csrfProtection)
app.use((req, res, next) => {
    res.locals.csrfToken = req.csrfToken()
    next()
})

app.use((req, res, next) => {
  res.locals.canonicalUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
  next();
});

app.use(pagesRoutes)


const sslServer = https.createServer(
    {
        key: privateKey,
        cert: certificate,
    }, app

)
mongoose.connect(MONGODB_URL)
    .then(result => {
        app.listen(3000, () => {
            console.log(`Server is running on http://localhost:3000`);
        });
    })
    .catch(err => console.log(err, "database"))

