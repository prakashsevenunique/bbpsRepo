const jwt = require('jsonwebtoken');
const crypto = require('crypto');

function getToken() {
  const random = Math.floor(Math.random() * 1000000000);
  const timestamp = Math.floor(Date.now() / 1000);
  const secretKey = Buffer.from("UFMwMDE3OTIzYzdhYmFiZWU5OWJkMzAzNTEyNDQ0MmNmMGFiMWUyOA==").toString('base64'); // base64 encoding like Java

  const token = jwt.sign(
    {
      iss: "PSPRINT",          // optional claim
      timestamp: timestamp,
      partnerId: "PS001792",     // replace with actual Partner ID
      product: "WALLET",       // optional claim
      reqid: random
    },
    secretKey,
    {
      algorithm: 'HS256',
      header: {
        typ: 'JWT',
        alg: 'HS256'
      }
    }
  );

  return token;
}




function generatePaysprintJWT() {
    const timestamp = Math.floor(Date.now() / 1000) * 1000;
    
    const requestId = Math.floor(Math.random() * 1000000000);
    
    const payload = {
        timestamp: timestamp,
        partnerId: 'PS001792',
        reqid: requestId.toString()
    };
    
    const token = jwt.sign(payload,'UFMwMDE3OTIzYzdhYmFiZWU5OWJkMzAzNTEyNDQ0MmNmMGFiMWUyOA==', {
        algorithm: 'HS256',
        header: {
            typ: 'JWT',
            alg: 'HS256'
        }
    });
    
    return token;
}



function encryptPidData(piddata, key, iv) {
  const cipher = crypto.createCipheriv('aes-128-cbc', Buffer.from(key, 'utf8'), Buffer.from(iv, 'utf8'));
  let encrypted = cipher.update(piddata, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  return encrypted;
}

module.exports =generatePaysprintJWT; 
