const crypto = require('crypto');


const secretKey = 'FAWATERAK.21870';
const providerKey = 'e3c7e6936a50757fcb4bd66409ac5a9c2b491e806457550b0f';

exports.getHash = (req, res, next) =>{
    const domain = 'http://apostille.souqalkhaleej.org'; // Ensure you validate this input
    const queryParam = `Domain=${domain}&ProviderKey=${providerKey}`;
    const hash = crypto.createHmac('sha256', secretKey).update(queryParam).digest('hex');
    res.json({ hashKey: hash });
}
