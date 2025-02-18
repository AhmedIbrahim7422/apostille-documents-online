const crypto = require('crypto');


exports.getHash = (req, res, next) =>{
    const secretKey = 'e3c7e6936a50757fcb4bd66409ac5a9c2b491e806457550b0f';
    const queryParam = 'Domain=https://apostille.souqalkhaleej.org&ProviderKey=FAWATERAK.21870';
    const hash = crypto.createHmac('sha256', secretKey)
                       .update(queryParam)
                       .digest('hex');
    res.json({ hashKey: hash });
}
