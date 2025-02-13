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
const app = express();
const cors = require('cors');
const fs = require("fs")
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

const privateKey = fs.readFileSync('key.pem')
const certificate = fs.readFileSync('cert.pem')

app.set('view engine', 'ejs');
const pagesRoutes = require('./routes/pages')
let date = new Date()
let dateTime = date.getTime()
const fileStorage = multer.diskStorage({
    destination: 'docs',
    filename: (req, file, cb) => {
        cb(null, `${dateTime}-${file.originalname}` );
    }
});
app.use(multer({ storage: fileStorage }).array('files[]'));


app.use(csrfProtection)
app.use((req, res, next) => {
    console.log("res", res.locals);
    res.locals.csrfToken = req.csrfToken()
    console.log("res", res.locals);
    next()
})

app.use(pagesRoutes)


const sslServer= https.createServer(
    {
        key: privateKey,
        cert: certificate,
    },app
    
) 

app.listen(3000, () => {
console.log(`Server is running on http://localhost:3000`);
});

