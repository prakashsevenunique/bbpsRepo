const axios = require('axios');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const generatePaysprintJWT = require('../../services/Dmt&Aeps/TokenGenrate');
const CryptoJS = require('crypto-js');


function encryptWithCryptoJS(data, key, iv) {
    const plaintext = JSON.stringify(data);

    const encrypted = CryptoJS.AES.encrypt(plaintext, CryptoJS.enc.Utf8.parse(key), {
        iv: CryptoJS.enc.Utf8.parse(iv),
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
    });

    return encrypted.toString(); // returns base64 ciphertext
}

const headers = {
    'Token': generatePaysprintJWT(),
    'Authorisedkey': 'MGY1MTVmNWM3Yjk5MTdlYTcyYjk5NmUzZjYwZDVjNWE=',
}

const BASE_URL = 'https://sit.paysprint.in/service-api/api/v1/service/onboard/onboardnew/getonboardurl';
const RESPONSE_CALLBACK_URL = 'https://58e8-2401-4900-889a-511c-7849-49f2-bf5e-665e.ngrok-free.app/api/v1/aeps/onboard/callback';
const JWT_SECRET = 'UFMwMDE3OTIzYzdhYmFiZWU5OWJkMzAzNTEyNDQ0MmNmMGFiMWUyOA==';


const WADH = "18f4CEiXeXcfGXvgWA/blxD+w2pw7hfQPY45JMytkPw=";

// https://58e8-2401-4900-889a-511c-7849-49f2-bf5e-665e.ngrok-free.app/api/v1/aeps/onboard/callback?data=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyZWZubyI6IjE3NDk3MjkzNjM1OTgiLCJ0eG5pZCI6IiIsInN0YXR1cyI6IjAiLCJzdGF0dXNiYW5rMiI6IjAiLCJtb2JpbGUiOiI4MzAyODQ1OTc2IiwicGFydG5lcmlkIjoiUFMwMDE3OTIiLCJtZXJjaGFudGNvZGUiOiIxMDEiLCJiYW5rIjp7IkJhbmsxIjowLCJCYW5rMiI6MH19.43H-EtcfhddKtBwYPXvTmETJg6NkrTyMVAMbYMPiSf8

const AES_KEY = '7c4851aad3e91b9c'; // Must be 16 characters
const AES_IV = '557aefe5593170ad';  // Must be 16 characters

function encryptPidData(piddata) {
    const cipher = crypto.createCipheriv("aes-128-cbc", Buffer.from(AES_KEY, "utf8"), Buffer.from(AES_IV, "utf8"));
    let encrypted = cipher.update(piddata, "utf8", "base64");
    encrypted += cipher.final("base64");
    console.log(encrypted)
    return encrypted;
}

function decryptWithCryptoJS(encryptedText) {
    const decrypted = CryptoJS.AES.decrypt(encryptedText, CryptoJS.enc.Utf8.parse(AES_KEY), {
        iv: CryptoJS.enc.Utf8.parse(AES_IV),
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
    });

    const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);
    return JSON.parse(decryptedText); // convert back to object
}

const decryptJWT = (token, secretKey) => {
    try {
        const decoded = jwt.verify(token, secretKey);
        return decoded;
    } catch (error) {
        throw new Error("JWT Decryption Failed: " + error.message);
    }
};

function encryptForPaySprint(data, key, iv) {
    const json = JSON.stringify(data);

    const cipher = crypto.createCipheriv(
        'aes-128-cbc',
        Buffer.from(key, 'utf8'),
        Buffer.from(iv, 'utf8')
    );

    const encrypted = Buffer.concat([
        cipher.update(json, 'utf8'),
        cipher.final()
    ]);

    const base64Encoded = encrypted.toString('base64');
    return base64Encoded;
}


exports.generateOnboardURL = async (req, res) => {
    const { merchantcode, mobile, email, firm } = req.body;

    const payload = {
        merchantcode,
        mobile,
        is_new: "0",
        email,
        firm,
        callback: RESPONSE_CALLBACK_URL
    };

    try {
        const response = await axios.post(BASE_URL, payload, {
            headers
        });
        if (response.data.status) {
            return res.json({
                redirectUrl: response.data.redirecturl,
                message: 'Onboarding initiated successfully.'
            });
        } else {
            return res.status(400).json({ message: 'Failed to initiate onboarding.', error: response.data.message });
        }
        // {
        //   refno: '1749729363598',
        //   txnid: '',
        //   status: '0',
        //   statusbank2: '0',
        //   mobile: '8302845976',
        //   partnerid: 'PS001792',
        //   merchantcode: '101',
        //   bank: { Bank1: 0, Bank2: 0 }
        // }
    } catch (error) {
        console.error(error.response?.data || error.message);
        return res.status(500).json({ message: 'Internal Server Error.' });
    }
};

exports.transactionCallback = async (req, res) => {
    console.log("transaction callback", req.body)
    const { param, param_inc } = req.body;
    let decryptedParam;
    try {
        decryptedParam = decryptJWT(param_inc, JWT_SECRET);
    } catch (e) {
        return res.status(400).json({ status: 400, message: "Invalid encrypted data." });
    }
    const { merchant_id, partner_id, request_id, amount } = decryptedParam;

    console.log(`Deducting ₹${amount} from Merchant: ${merchant_id}`);

    return res.json({ status: 200, message: "Transaction completed successfully" });
};

exports.onboardResponseCallback = async (req, res) => {
    const { data } = req.query;
    let decryptedData;
    try {
        decryptedData = decryptJWT(data, JWT_SECRET);
    } catch (e) {
        return res.status(400).json({ message: "Decryption failed." });
    }
    const { refno, txnid, status, mobile, partnerid, merchantcode, bank } = decryptedData;
    console.log(decryptedData)
    if (status === "1") {
        console.log(`✅ Onboarding successful for merchant: ${merchantcode}`);
    } else {
        console.log(`⏳ Onboarding pending for merchant: ${merchantcode}`);
    }
    return res.send("Callback received");
};

exports.activateMerchant = async (req, res, next) => {
    const {
        merchantcode,
        aadhaar,
        piddata = `<PidData>
  <Resp errCode="0" errInfo="Success." fCount="1" fType="0" nmPoints="50" qScore="94" />
  <DeviceInfo dpId="MANTRA.MSIPL" rdsId="RENESAS.MANTRA.001" rdsVer="1.3.0" mi="MFS110" mc="MIIEADCCAuigAwIBAgIIMjQzNjA3N0EwDQYJKoZIhvcNAQELBQAwgfwxKjAoBgNVBAMTIURTIE1hbnRyYSBTb2Z0ZWNoIEluZGlhIFB2dCBMdGQgMjFVMFMGA1UEMxNMQi0yMDMgU2hhcGF0aCBIZXhhIE9wcG9zaXRlIEd1amFyYXQgSGlnaCBDb3VydCBTLkcgSGlnaHdheSBBaG1lZGFiYWQgLTM4MDA2MDESMBAGA1UECRMJQUhNRURBQkFEMRAwDgYDVQQIEwdHVUpBUkFUMR0wGwYDVQQLExRURUNITklDQUwgREVQQVJUTUVOVDElMCMGA1UEChMcTWFudHJhIFNvZnRlY2ggSW5kaWEgUHZ0IEx0ZDELMAkGA1UEBhMCSU4wHhcNMjUwNjA5MDUzMzQ1WhcNMjUwNzIyMDgwMzIzWjCBgjEkMCIGCSqGSIb3DQEJARYVc3VwcG9ydEBtYW50cmF0ZWMuY29tMQswCQYDVQQGEwJJTjELMAkGA1UECBMCR0oxEjAQBgNVBAcTCUFobWVkYWJhZDEOMAwGA1UEChMFTVNJUEwxCzAJBgNVBAsTAklUMQ8wDQYDVQQDEwZNRlMxMTAwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQC8WB16zACnBcrE94pVziIN423PHJ1tl92PqifSwtOq9Pk8CxgY3KrJdgLT2NeaBEO4AmRF0gAjiXdruxhwS18tx42y7XcOOGoTqV3cRTGPFHVGDc5ZXE/ZGgqVrGi+RDPNPly5c/01c5Bfn/SXyNreXlCKsPpUHgGC2IRLCA71XScK+Ls/Ne7AQCs4fwbg9eWmv5uZ8zW5gGYs4S8AiBANrtH5M+oeK48YuD2sBfUPNaleX6ZDd3RIuJel/NtgK63DoRv5QptoG4y0TqBd9hIxfsoZvMWhpEaNHB7vWLXYxQzjivcAC0uLMA6wWXmjfFLSs0vT/gpmhVfHpaXKb9iNAgMBAAEwDQYJKoZIhvcNAQELBQADggEBACFHPp5RXaDxFOBkR3DgWYn49B7MEnIdP25pPtYOf70dDWac+7pNmrWCMqlhMPgKLAsVhIehRKEXyzJci+ZsnAwcmCR5h4bWQhePM8ofDKaW73me+PEHHOA3yRW1WM28j+DlLxIysyuinoqyaKUwosJ25Y5g/1q6Xd/+9KebxWXf3Kja9NNeq7p82e/caFjaXgMWQjn8OI/FCyTzJyBUuKYOTQcza85G5Ah2DOeNIanjigFH9znLk8zTestqbiWDelpwtRK2M4Tfm9PRAmfhj9MW/qTNv5vOOa5DhzpDEvs+zmLu76IrJzHpCXFfCs0u4+SXGDvT3Bze5qBsx/BysrM=" dc="7a623216-206c-4b45-b806-41f33c213833">
    <additional_info>
      <Param name="srno" value="9443351" />
      <Param name="sysid" value="6E3FEBF024D0236FBFF0" />
      <Param name="ts" value="2025-06-12T11:36:06+05:30" />
      <Param name="modality_type" value="Finger" />
      <Param name="device_type" value="L1" />
    </additional_info>
  </DeviceInfo>
  <Skey ci="20250923">C3FRWjgDmX8ATW/mLrPUaj9VAx3yK0Lg3kWGFTFvkcRFIxss49K3B7KaJ/qXyO8ukYhiUeFlIdBlXqBqgGw3Oe4Gvxk2BVZX93ZlXO+HB1d65zrxGgeKv1uXC4E0JD57v0JRyRW2EqIkXpZC+ibzxvHScfEUPcIBUnTBH92pjiwvWCfzq3DoG5iLsdKEAYXdG8E+BTZyj8Ziqi4cOW3AckrCPHXdNzuY4J4RnoY24kASnIp0sX8qow6+AXa7NXUVR5bDkyYHCOJZcRWUBYa4z9utOT45K3MlnYZpSlfMd17UzLd4cY1YITzo7NBqeBFqJ6m/fBFA4GmyddeI88ViUw==</Skey>
  <Hmac>PQ3gd9JcpmEsHKqImdA1HkHAaVcwEXRhQBs7qQGW5IQ5yRXFAohY3uih5Vf9I2Yx</Hmac>
  <Data type="X">MjAyNS0wNi0wOVQxMTozNTo1MYNtXdK3N/1+2b3XTiDTrKJsM+lo5sNtLw0XloDjLbs9IVGBEC3uyVborO7ST6E1cK4eLOCzq+h5/f5X6NV5S3CY9OYj/qhOCicLGTgfmc0xxAFsnXbAZ/pt7QWTVyZegVSpdsoOMmomwNmsYAhqV9Y5URCkF1hn+aCpV9KhNpo34MPhhhJVlVdpjRvHSSA4lTzLQmWIXJ9sf7ki0I/mien6xN60/PtVoFZkYY72K8xr/nPGS7IDa/zI/22yt8Troyo0dTvDeQeeyDuLeSO3H6tOeRdAntCFcjo1eADn8/Qwvz18EmOAtk2IXTlrsMnj9mzBwVoddkEt8XSJoOmd27yiWAUxSjhe/WPkqBiJjqzHp79htX65ipf7+bmIv6ZCvJlEJ0YSYsWE2rOj6neBZn5Cwxu4YOnauSO0q6ZzPMLLFwMyOXn+iOYRQuZq7FZijtqG+vqMh+6iIfY3Kl28hUTzuCgP03k57uNMuZVM/cN9Qoaa2EQEno6B9hb2FPBi20RphSByoL6IQTDpga474sZH6FVZs2uoZw0yCvUWVsHm3WdizOdWssZ7JrG+IZ6PjQFVaG8Pa5qIgrsXtAv++9RZ+fHJpuyvsRiVbkovMJ3ATuieVqKuXnnwlKeJ7xpWhVW1GNYrB4mh0ByQu7Hprj19ijdc7gNcFq/WOi9r6QL3xTh9LlAhVqdWK8E8wGbW+2bGQ+s3Eqeo5cxrcjwRqsw55EK9srxPOOjgMW0t+zcQymClcEZYO2RqNsKFFcq5uBFjIySKJ9MNPLzaEhXZGf72cHK6CmUEbVjPZtAr/KSMW4/3IhxRmV1u5Se6d/3DpSIkGtBbD1Jo+uNdBYsrMk5/kvhrXnEoTQGygPH1AIMO8iagYN7itojOMKom9+7og1Av79neFS/iHpu2M6841iqYFYUG16watLmfcC2V9hKElOfh6/1wI9Bu0mbTXytxrMm85wDiMPNzpO5pO+SwkciBqcjMJDr3FusYdkjybfUC4pDdYThjnbI2LuDOOPvn/8VaHVG1nBbFc9/s+nlR5EOR7+1pvhsFse4JOAC+xwkyvRPPMj2cY/pJYpcIqo9kjPuHGgJT+oE6o1kwv50/yhK+OI+8Cz+0lRxRha/PLElXj6/ezfFPgXd+aIw0vIHkxmm6I9NFAZTTqUwZ8KjK0sNTinjAjxcnAbyUVQkXUR64f+YFEBhWBoMVW6HiHBhag+gzxSusCyf6HWRmxGJtd8FBZkdvQmJisXmwLmBqB/DLnvNBDSpqdnQouLsjkO6i1fVs+p2CjYpAKksOkVDMRsd/4MdqCEQrxt+XcMyFxCa0sktxVwUhiIExrLMK5OlVRJmfojZlvXB3tobBg3LwxWwJsiIIfJZ6qFE0psIc426ck02qEiZWDUoCh3KZUssAmUe6BAI2PEf8c15itodSzLb/DYV4Lv59K+vREo4S9VluC8GI2wKkwMNRhrCstNWnL2iRXYBPXz+157zQKN4zI+nVxSEME8Wig4KgdKpXj6C24nQJG7aWhq5lE/oFpzsL4FqDMYZygH9ctGaUqUO/3FNVz7R1XqDgY6mvUbkAT7bZLbF6qtwZTe8aI0BndXELxCajpLppu9d+s9rYWIJyoIP0S18UY/tcMx9o8PmK250Lm0hIlmaIK5YL3pvAdi6fAX21uB7BuReFagDfIPhBU7CTBeUm6PJdOMOaCSr/3F/j8bMT+0oXhL6hBncKFzkU1Qs8JOmL3HvFVc+4RnbJPT2nHp5EoMCZuK/Y1+a0oXijGWROHIDqccMV/u03Lfbex687K9VHsTSkYQcU4jqUf+hO/4Q0oSJWY8hsciWc7UYCP5i8Csa9Xc3+XC2Yr9rsBIRA6LPRAOZVoj+6eKU/2TEUsCNGpALNwahtGJqy5rWmdawO1wDgwUtnKCVggMFzOPSdf7E8LHJcsZFKocyer75lEPw5</Data>      
</PidData>`,
        dob,
        is_casa = '0'
    } = req.body;

    if (!merchantcode || !aadhaar || !piddata || !dob) {
        return res.status(400).json({
            status: false,
            message: "Missing required parameters."
        });
    }
    try {
        const encryptedPID = encryptPidData(piddata);
        const payload = {
            merchantcode,
            aadhaar,
            piddata: encryptedPID,
            dob,
            is_casa
        };
        const response = await axios.post('https://sit.paysprint.in/service-api/api/v1/service/onboard/onboard/activate_merchant', payload, {
            headers
        });
        return res.status(response.status).json(response.data);
    } catch (error) {
        return next(error)
    }
};

exports.checkOnboardStatus = async (req, res, next) => {

    const { merchantcode, mobile, pipe } = req.body;

    if (!merchantcode || !mobile || !pipe) {
        return res.status(400).json({
            status: false,
            response_code: 8,
            message: "Missing required parameters: merchantcode, mobile, pipe"
        });
    }
    try {
        const payload = {
            merchantcode,
            mobile,
            pipe
        };
        const response = await axios.post("https://sit.paysprint.in/service-api/api/v1/service/onboard/onboard/getonboardstatus", payload, {
            headers
        });
        return res.status(response.status).json(response.data);
    } catch (error) {
        console.error("Error checking onboarding status:", error.message);
        return next(error)
    }
};

exports.registerMerchant = async (req, res, next) => {
    const ipaddre =
        req.headers['x-forwarded-for']?.split(',')[0] ||  // If behind proxy
        req.socket?.remoteAddress ||                      // Direct connection
        req.connection?.remoteAddress;
    try {
        const {
            accessmodetype,
            adhaarnumber,
            mobilenumber,
            latitude,
            longitude,
            referenceno,
            submerchantid,
            is_iris,
            timestamp = new Date(),
            data = `<PidData>....</PidData>`,
            ipaddress = "9.9.9.9"
        } = req.body;

        if (!referenceno || !submerchantid || !timestamp) {
            return res.status(400).json({
                status: false,
                response_code: 8,
                message: "Missing required parameters."
            });
        }

        const payload = {
            accessmodetype: accessmodetype || 'SITE',
            adhaarnumber,
            mobilenumber,
            latitude,
            longitude,
            referenceno,
            submerchantid,
            is_iris: is_iris || 'No',
            timestamp,
            data,
            ipaddress
        };
        console.log(payload)

        const encryptedBody =  encryptForPaySprint(payload, AES_KEY, AES_IV)

        console.log(encryptedBody)

        const response = await axios.post(
            'https://sit.paysprint.in/service-api/api/v1/service/aeps/kyc/Twofactorkyc/registration',
            { body: encryptedBody },
            { headers }
        );
        return res.status(response.status).json(response.data);
    } catch (error) {
        console.log(error)
        return next(error)
    }
};

exports.authenticateMerchant = async (req, res) => {
    try {
        const {
            accessmodetype,
            adhaarnumber,
            mobilenumber,
            latitude,
            longitude,
            referenceno,
            submerchantid,
            is_iris,
            timestamp=Date.now(),
            data,
            ipaddress
        } = req.body;

        if (!referenceno || !submerchantid || !timestamp) {
            return res.status(400).json({
                status: false,
                response_code: 8,
                message: "Missing required parameters."
            });
        }

        const payload = {
            accessmodetype: accessmodetype || 'APP',
            adhaarnumber,
            mobilenumber,
            latitude,
            longitude,
            referenceno,
            submerchantid,
            is_iris: is_iris || 'No',
            timestamp,
            data,
            ipaddress
        };

        const encryptedBody = encryptWithCryptoJS(payload, AES_KEY, AES_IV);

        const response = await axios.post(
            'https://sit.paysprint.in/service-api/api/v1/service/aeps/kyc/Twofactorkyc/authentication',
            { body: encryptedBody },
            { headers }
        );

        return res.status(response.status).json(response.data);

    } catch (error) {
        console.error("Error during authentication:", error.message);
        if (error.response) {
            return res.status(error.response.status).json(error.response.data);
        }
        return res.status(500).json({ message: "Internal Server Error." });
    }
};

exports.balanceEnquiry = async (req, res, next) => {
    try {
        const {
            latitude,
            longitude,
            mobilenumber,
            adhaarnumber,
            nationalbankidentification,
            ipaddress = "192.168.1.67",
            referenceno,
            accessmodetype = "SITE",
            requestremarks = "",
            data=`<PidData>....</PidData>`,
            pipe = "bank1",
            timestamp = new Date().toISOString().slice(0, 19).replace("T", " "),
            transactiontype = "BE",
            submerchantid = "1",
            is_iris = "No"
        } = req.body;

        if (!latitude || !longitude || !mobilenumber) {
            return res.status(400).json({ error: true, message: "Missing mandatory fields" });
        }

        const plainBody = {
            latitude, longitude, mobilenumber, referenceno, ipaddress,
            adhaarnumber, accessmodetype, nationalbankidentification,
            requestremarks, data, pipe, timestamp,
            transactiontype, submerchantid, is_iris
        };

        console.log("dkjhfkjdhfkjhdfkjhdsjhkf",plainBody)

        const encryptedBody = encryptForPaySprint(plainBody, AES_KEY, AES_IV);

        const { data: psResp } = await axios.post(
            "https://sit.paysprint.in/service-api/api/v1/service/aeps/balanceenquiry/index",
            { body:"5JmgzXzuAwmVJIYWen6PqIDjpdpElxMe/jBE6AVd3VWHheqFeOzvs0YXRy3d7TKajjXdA2RM/anXpsxaiboteI/n8+X5T0qJZD76+hWAvYVxnsyJQoxgSV6wjNNGRVNKsXjTxl7JIiruXbvVFbo0QBHt0J4vZ1pTY5p1RLT/Sdy3N28fuUEIg1seIhgh6akbaaOQZc95ILQ8o/gQgrGXY0TEiem6m42onyDnS0awxd85FvVoS6yBYA1i4b9T71sqLfDBBzG1meTGhpBXvCRiNYIz/i1KJ9dDYaYUqyJMwtSYYFKGF7CmHL5QvUt3rfKwubwcGFj/bD6UoF9OaRrKdOS3tJbZjneirGTKDj8j1WAoIK3hlaKqQ5KkbJs99B+PE9YHLkdrOu4JcBaenkeTmSNjT2WojfSv5i4PjANVcwAqYx5da19x6peanTvEXlMuyN8IJX/4dIAFSj5uFku0OPj8O8ues87BKqEBrRg90FKxT2Md0r+j0KB0q85W9YP1uB6TgLn2lsmzdlksy/R39w==" },
            { headers }
        );
        return res.json(psResp);
    } catch (err) {
        return next(err);
    }
};

exports.withdrawWithAuth = async (req, res, next) => {
    try {
        const {
            latitude,
            longitude,
            mobilenumber,
            adhaarnumber,
            nationalbankidentification,
            ipaddress = req.ip,
            referenceno,
            accessmodetype = "WEB",
            requestremarks = "",
            data,
            pipe = "bank2",
            timestamp = new Date().toISOString().slice(0, 19).replace("T", " "),
            transactiontype = "CW",
            submerchantid = "1",
            amount,
            is_iris = "No"
        } = req.body;

        if (!latitude || !longitude || !mobilenumber || !adhaarnumber || !data || !amount || !nationalbankidentification) {
            return res.status(400).json({ error: true, message: "Missing required fields" });
        }
        const plainBody = {
            latitude,
            longitude,
            mobilenumber,
            referenceno,
            ipaddress,
            adhaarnumber,
            accessmodetype,
            nationalbankidentification,
            requestremarks,
            data,
            pipe,
            timestamp,
            transactiontype,
            submerchantid,
            amount,
            is_iris
        };
        const encryptedBody = encryptAES128(plainBody, AES_KEY, AES_IV);
        const response = await axios.post(
            "https://sit.paysprint.in/service-api/api/v1/service/aeps/authcashwithdraw/index",
            { body: encryptedBody },
            {
                headers,
                timeout: 180000
            }
        );
        console.log("AEPS Auth Withdraw Success", { referenceno, response: response.data });
        return res.json(response.data);
    } catch (err) {
        return res.status(500).json({ error: true, message: "Internal Server Error", details: err.message });
    }
};

exports.getMiniStatement = async (req, res) => {
    try {
        const {
            latitude,
            longitude,
            mobilenumber,
            adhaarnumber,
            nationalbankidentification,
            data,
            pipe = "bank2",
            ipaddress = req.ip,
            accessmodetype = "APP",
            referenceno = uuidv4(),
            requestremarks = "",
            timestamp = new Date().toISOString().slice(0, 19).replace("T", " "),
            submerchantid = "1",
            is_iris = "No"
        } = req.body;

        if (!latitude || !longitude || !mobilenumber || !adhaarnumber || !data || !nationalbankidentification) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        const plainBody = {
            latitude,
            longitude,
            mobilenumber,
            referenceno,
            ipaddress,
            adhaarnumber,
            accessmodetype,
            nationalbankidentification,
            requestremarks,
            data,
            pipe,
            timestamp,
            transactiontype: "MS",
            submerchantid,
            is_iris
        };

        const encryptedBody = encryptAES128(plainBody, AES_KEY, AES_IV);

        const response = await axios.post(
            "https://sit.paysprint.in/service-api/api/v1/service/aeps/ministatement/index",
            { body: encryptedBody },
            {
                headers,
                timeout: 180000
            }
        );

        console.log("Mini Statement Success", { referenceno, response: response.data });
        return res.json(response.data);

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

exports.getAepsBankList = async (req, res, next) => {
    try {
        const response = await axios.post(
            "https://sit.paysprint.in/service-api/api/v1/service/aeps//banklist/index",
            {},
            { headers }
        );
        return res.json(response.data);
    } catch (error) {
        console.log(error)
        return next(error)
    }
};
