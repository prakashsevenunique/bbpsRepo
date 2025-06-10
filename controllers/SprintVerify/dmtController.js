const axios = require('axios');
const generatePaysprintJWT = require("../../services/Dmt&Aeps/TokenGenrate");
const { encryptPidData } = require('../../services/jwtService');
const crypto = require('crypto');

const headers = {
    'Token': generatePaysprintJWT(),
    'Authorisedkey': 'MGY1MTVmNWM3Yjk5MTdlYTcyYjk5NmUzZjYwZDVjNWE=',
}

exports.queryRemitter = async (req, res, next) => {
    try {
        const { mobile, lat, long } = req.body;
        const response = await axios.post(
            'https://sit.paysprint.in/service-api/api/v1/service/dmt/kyc/remitter/queryremitter',
            { mobile: Number(mobile), lat, long },
            { headers }
        );
        return res.status(200).json(response.data);

    } catch (error) {
        console.error(error.response?.data || error.message);
        return next(error)
    }
};

exports.remitterEkyc = async (req, res, next) => {
    try {
        const {
            mobile,
            lat,
            long,
            aadhaar_number,
            piddata,
            accessmode = 'WEB',
            is_iris = 2
        } = req.body;

        const key = crypto.randomBytes(16);
        const iv = crypto.randomBytes(16);
        const encryptedData = encryptPidData(`<PidData>
            <Resp errCode="0" errInfo="Success." fCount="1" fType="0" nmPoints="50" qScore="94" />
            <DeviceInfo dpId="MANTRA.MSIPL" rdsId="RENESAS.MANTRA.001" rdsVer="1.3.0" mi="MFS110" mc="MIIEADCCAuigAwIBAgIIMjQzNjA3N0EwDQYJKoZIhvcNAQELBQAwgfwxKjAoBgNVBAMTIURTIE1hbnRyYSBTb2Z0ZWNoIEluZGlhIFB2dCBMdGQgMjFVMFMGA1UEMxNMQi0yMDMgU2hhcGF0aCBIZXhhIE9wcG9zaXRlIEd1amFyYXQgSGlnaCBDb3VydCBTLkcgSGlnaHdheSBBaG1lZGFiYWQgLTM4MDA2MDESMBAGA1UECRMJQUhNRURBQkFEMRAwDgYDVQQIEwdHVUpBUkFUMR0wGwYDVQQLExRURUNITklDQUwgREVQQVJUTUVOVDElMCMGA1UEChMcTWFudHJhIFNvZnRlY2ggSW5kaWEgUHZ0IEx0ZDELMAkGA1UEBhMCSU4wHhcNMjUwNjA5MDUzMzQ1WhcNMjUwNzIyMDgwMzIzWjCBgjEkMCIGCSqGSIb3DQEJARYVc3VwcG9ydEBtYW50cmF0ZWMuY29tMQswCQYDVQQGEwJJTjELMAkGA1UECBMCR0oxEjAQBgNVBAcTCUFobWVkYWJhZDEOMAwGA1UEChMFTVNJUEwxCzAJBgNVBAsTAklUMQ8wDQYDVQQDEwZNRlMxMTAwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQC8WB16zACnBcrE94pVziIN423PHJ1tl92PqifSwtOq9Pk8CxgY3KrJdgLT2NeaBEO4AmRF0gAjiXdruxhwS18tx42y7XcOOGoTqV3cRTGPFHVGDc5ZXE/ZGgqVrGi+RDPNPly5c/01c5Bfn/SXyNreXlCKsPpUHgGC2IRLCA71XScK+Ls/Ne7AQCs4fwbg9eWmv5uZ8zW5gGYs4S8AiBANrtH5M+oeK48YuD2sBfUPNaleX6ZDd3RIuJel/NtgK63DoRv5QptoG4y0TqBd9hIxfsoZvMWhpEaNHB7vWLXYxQzjivcAC0uLMA6wWXmjfFLSs0vT/gpmhVfHpaXKb9iNAgMBAAEwDQYJKoZIhvcNAQELBQADggEBACFHPp5RXaDxFOBkR3DgWYn49B7MEnIdP25pPtYOf70dDWac+7pNmrWCMqlhMPgKLAsVhIehRKEXyzJci+ZsnAwcmCR5h4bWQhePM8ofDKaW73me+PEHHOA3yRW1WM28j+DlLxIysyuinoqyaKUwosJ25Y5g/1q6Xd/+9KebxWXf3Kja9NNeq7p82e/caFjaXgMWQjn8OI/FCyTzJyBUuKYOTQcza85G5Ah2DOeNIanjigFH9znLk8zTestqbiWDelpwtRK2M4Tfm9PRAmfhj9MW/qTNv5vOOa5DhzpDEvs+zmLu76IrJzHpCXFfCs0u4+SXGDvT3Bze5qBsx/BysrM=" dc="7a623216-206c-4b45-b806-41f33c213833">
                <additional_info>
                    <Param name="srno" value="9443351" />
                    <Param name="sysid" value="6E3FEBF024D0236FBFF0" />
                    <Param name="ts" value="2025-06-09T11:36:06+05:30" />
                    <Param name="modality_type" value="Finger" />
                    <Param name="device_type" value="L1" />
                </additional_info>
            </DeviceInfo>
            <Skey ci="20250923">C3FRWjgDmX8ATW/mLrPUaj9VAx3yK0Lg3kWGFTFvkcRFIxss49K3B7KaJ/qXyO8ukYhiUeFlIdBlXqBqgGw3Oe4Gvxk2BVZX93ZlXO+HB1d65zrxGgeKv1uXC4E0JD57v0JRyRW2EqIkXpZC+ibzxvHScfEUPcIBUnTBH92pjiwvWCfzq3DoG5iLsdKEAYXdG8E+BTZyj8Ziqi4cOW3AckrCPHXdNzuY4J4RnoY24kASnIp0sX8qow6+AXa7NXUVR5bDkyYHCOJZcRWUBYa4z9utOT45K3MlnYZpSlfMd17UzLd4cY1YITzo7NBqeBFqJ6m/fBFA4GmyddeI88ViUw==</Skey>
            <Hmac>PQ3gd9JcpmEsHKqImdA1HkHAaVcwEXRhQBs7qQGW5IQ5yRXFAohY3uih5Vf9I2Yx</Hmac>
            <Data type="X">MjAyNS0wNi0wOVQxMTozNTo1MYNtXdK3N/1+2b3XTiDTrKJsM+lo5sNtLw0XloDjLbs9IVGBEC3uyVborO7ST6E1cK4eLOCzq+h5/f5X6NV5S3CY9OYj/qhOCicLGTgfmc0xxAFsnXbAZ/pt7QWTVyZegVSpdsoOMmomwNmsYAhqV9Y5URCkF1hn+aCpV9KhNpo34MPhhhJVlVdpjRvHSSA4lTzLQmWIXJ9sf7ki0I/mien6xN60/PtVoFZkYY72K8xr/nPGS7IDa/zI/22yt8Troyo0dTvDeQeeyDuLeSO3H6tOeRdAntCFcjo1eADn8/Qwvz18EmOAtk2IXTlrsMnj9mzBwVoddkEt8XSJoOmd27yiWAUxSjhe/WPkqBiJjqzHp79htX65ipf7+bmIv6ZCvJlEJ0YSYsWE2rOj6neBZn5Cwxu4YOnauSO0q6ZzPMLLFwMyOXn+iOYRQuZq7FZijtqG+vqMh+6iIfY3Kl28hUTzuCgP03k57uNMuZVM/cN9Qoaa2EQEno6B9hb2FPBi20RphSByoL6IQTDpga474sZH6FVZs2uoZw0yCvUWVsHm3WdizOdWssZ7JrG+IZ6PjQFVaG8Pa5qIgrsXtAv++9RZ+fHJpuyvsRiVbkovMJ3ATuieVqKuXnnwlKeJ7xpWhVW1GNYrB4mh0ByQu7Hprj19ijdc7gNcFq/WOi9r6QL3xTh9LlAhVqdWK8E8wGbW+2bGQ+s3Eqeo5cxrcjwRqsw55EK9srxPOOjgMW0t+zcQymClcEZYO2RqNsKFFcq5uBFjIySKJ9MNPLzaEhXZGf72cHK6CmUEbVjPZtAr/KSMW4/3IhxRmV1u5Se6d/3DpSIkGtBbD1Jo+uNdBYsrMk5/kvhrXnEoTQGygPH1AIMO8iagYN7itojOMKom9+7og1Av79neFS/iHpu2M6841iqYFYUG16watLmfcC2V9hKElOfh6/1wI9Bu0mbTXytxrMm85wDiMPNzpO5pO+SwkciBqcjMJDr3FusYdkjybfUC4pDdYThjnbI2LuDOOPvn/8VaHVG1nBbFc9/s+nlR5EOR7+1pvhsFse4JOAC+xwkyvRPPMj2cY/pJYpcIqo9kjPuHGgJT+oE6o1kwv50/yhK+OI+8Cz+0lRxRha/PLElXj6/ezfFPgXd+aIw0vIHkxmm6I9NFAZTTqUwZ8KjK0sNTinjAjxcnAbyUVQkXUR64f+YFEBhWBoMVW6HiHBhag+gzxSusCyf6HWRmxGJtd8FBZkdvQmJisXmwLmBqB/DLnvNBDSpqdnQouLsjkO6i1fVs+p2CjYpAKksOkVDMRsd/4MdqCEQrxt+XcMyFxCa0sktxVwUhiIExrLMK5OlVRJmfojZlvXB3tobBg3LwxWwJsiIIfJZ6qFE0psIc426ck02qEiZWDUoCh3KZUssAmUe6BAI2PEf8c15itodSzLb/DYV4Lv59K+vREo4S9VluC8GI2wKkwMNRhrCstNWnL2iRXYBPXz+157zQKN4zI+nVxSEME8Wig4KgdKpXj6C24nQJG7aWhq5lE/oFpzsL4FqDMYZygH9ctGaUqUO/3FNVz7R1XqDgY6mvUbkAT7bZLbF6qtwZTe8aI0BndXELxCajpLppu9d+s9rYWIJyoIP0S18UY/tcMx9o8PmK250Lm0hIlmaIK5YL3pvAdi6fAX21uB7BuReFagDfIPhBU7CTBeUm6PJdOMOaCSr/3F/j8bMT+0oXhL6hBncKFzkU1Qs8JOmL3HvFVc+4RnbJPT2nHp5EoMCZuK/Y1+a0oXijGWROHIDqccMV/u03Lfbex687K9VHsTSkYQcU4jqUf+hO/4Q0oSJWY8hsciWc7UYCP5i8Csa9Xc3+XC2Yr9rsBIRA6LPRAOZVoj+6eKU/2TEUsCNGpALNwahtGJqy5rWmdawO1wDgwUtnKCVggMFzOPSdf7E8LHJcsZFKocyer75lEPw5</Data>
        </PidData>`, key, iv);

        const response = await axios.post(
            'https://sit.paysprint.in/service-api/api/v1/service/dmt/kyc/remitter/queryremitter/kyc',
            {
                mobile: Number(mobile),
                lat,
                long,
                aadhaar_number,
                data: encryptedData,
                accessmode,
                is_iris
            },
            { headers }
        );
        return res.status(200).json({ ...response.data });

    } catch (error) {
        return next(error)
    }
};

exports.registerRemitter = async (req, res, next) => {
    try {
        const { mobile, otp, stateresp, ekyc_id } = req.body;

        const response = await axios.post(
            'https://sit.paysprint.in/service-api/api/v1/service/dmt/kyc/remitter/registerremitter',
            {
                "mobile": Number(mobile),
                "otp": otp,
                "stateresp": stateresp,
                "ekyc_id": ekyc_id
            },
            { headers }
        );
        return res.status(200).json({ ...response.data });

    } catch (error) {
        return next(error)
    }
};

exports.registerBeneficiary = async (req, res, next) => {
    try {
        const {
            mobile,
            benename,
            bankid,
            accno,
            ifsccode,
            verified,
            gst_state,
            dob,
            address,
            pincode
        } = req.body;
        const payload = {
            mobile,
            benename,
            bankid,
            accno,
            ifsccode,
            verified,
            ...(gst_state && { gst_state }),
            ...(dob && { dob }),
            ...(address && { address }),
            ...(pincode && { pincode })
        };
        const response = await axios.post(
            'https://sit.paysprint.in/service-api/api/v1/service/dmt/kyc/beneficiary/registerbeneficiary',
            payload,
            { headers }
        );
        return res.json({ ...response.data });
    } catch (error) {
        console.error(error.response?.data || error.message);
        return next(error)
    }
};

exports.deleteBeneficiary = async (req, res, next) => {
    try {
        const { mobile, bene_id } = req.body;
        if (!mobile || !bene_id) {
            return res.status(400).json({ error: true, message: "mobile and bene_id are required" });
        }
        const response = await axios.post(
            'https://sit.paysprint.in/service-api/api/v1/service/dmt/kyc/beneficiary/registerbeneficiary/deletebeneficiary',
            {
                mobile,
                bene_id
            },
            { headers }
        );
        return res.json({ ...response.data });
    } catch (error) {
        return next(error)
    }
};

exports.fetchBeneficiary = async (req, res, next) => {
    try {
        const { mobile } = req.query;
        if (!mobile) {
            return res.status(400).json({ error: true, message: "mobile is required" });
        }
        const response = await axios.post(
            'https://sit.paysprint.in/service-api/api/v1/service/dmt/kyc/beneficiary/registerbeneficiary/fetchbeneficiary',
            { mobile }, { headers }
        );
        return res.json({ ...response.data });

    } catch (error) {
        return next(error)
    }
};

exports.BeneficiaryById = async (req, res, next) => {
    try {
        const { mobile, beneid } = req.query;

        if (!mobile) {
            return res.status(400).json({ error: true, message: "mobile is required" });
        }

        const response = await axios.post(
            'https://sit.paysprint.in/service-api/api/v1/service/dmt/kyc/beneficiary/registerbeneficiary/fetchbeneficiarybybeneid',
            { mobile, beneid }, { headers }
        );

        return res.json({ ...response.data });

    } catch (error) {
        return next(error)
    }
};

exports.PennyDrop = async (req, res, next) => {
    try {
        const { mobile, accno, bankid, benename, referenceid, pincode, address, dob, gst_state, bene_id } = req.body;

        if (!mobile) {
            return res.status(400).json({ error: true, message: "mobile is required" });
        }

        const response = await axios.post(
            'https://sit.paysprint.in/service-api/api/v1/service/dmt/kyc/beneficiary/registerbeneficiary/benenameverify',
            { mobile, accno, bankid, benename, referenceid, pincode, address, dob, gst_state, bene_id },
            { headers }
        );
        return res.json({ ...response.data });
    } catch (error) {
        return next(error)
    }
};

exports.sendTransactionOtp = async (req, res, next) => {
    try {
        const {
            mobile,
            referenceid,
            bene_id,
            txntype,
            amount,
            pincode = "110015",
            address = "New Delhi",
            dob = "01-01-1990",
            gst_state = "07",
            lat = "28.786543",
            long = "78.345678"
        } = req.body;

        if (!mobile || !referenceid || !bene_id || !amount) {
            return res.status(400).json({ error: true, message: "Missing required fields" });
        }

        const payload = {
            mobile,
            referenceid,
            bene_id,
            txntype,
            amount,
            pincode,
            address,
            dob,
            gst_state,
            lat,
            long
        };

        const response = await axios.post(
            'https://sit.paysprint.in/service-api/api/v1/service/dmt/kyc/transact/transact/send_otp',
            payload, { headers }
        );
        return res.json(response.data);
    } catch (error) {
        return next(error)
    }
};

exports.performTransaction = async (req, res, next) => {
    try {
        const {
            mobile,
            referenceid,
            bene_id,
            txntype,
            amount,
            otp,
            stateresp,
            pincode = "110015",
            address = "New Delhi",
            dob = "01-01-1990",
            gst_state = "07",
            lat = "28.786543",
            long = "78.345678"
        } = req.body;

        if (!mobile || !referenceid || !bene_id || !txntype || !amount || !otp || !stateresp) {
            return res.status(400).json({ error: true, message: "Missing required fields" });
        }

        const payload = {
            mobile,
            referenceid,
            bene_id,
            txntype,
            amount,
            otp,
            stateresp,
            pincode,
            address,
            dob,
            gst_state,
            lat,
            long
        };

        const response = await axios.post(
            'https://sit.paysprint.in/service-api/api/v1/service/dmt/kyc/transact/transact',
            payload, { headers }
        );
        return res.json(response.data);
    } catch (error) {
        return next(error)
    }
};

exports.TrackTransaction = async (req, res, next) => {
    try {
        const {
            referenceid,
        } = req.body;

        if (!referenceid) {
            return res.status(400).json({ error: true, message: "Missing required fields" });
        }
        const payload = {
            referenceid,
        };
        const response = await axios.post(
            'https://sit.paysprint.in/service-api/api/v1/service/dmt/kyc/transact/transact/querytransact',
            payload, { headers }
        );
        return res.json(response.data);
    } catch (error) {
        return next(error)
    }
};

exports.RefundOtp = async (req, res, next) => {
    try {
        const {
            referenceid,
            ackno
        } = req.body;
        if (!referenceid || !ackno) {
            return res.status(400).json({ error: true, message: "Missing required fields" });
        }
        const payload = {
            referenceid,
            ackno
        };
        const response = await axios.post(
            'https://sit.paysprint.in/service-api/api/v1/service/dmt/kyc/refund/refund/resendotp',
            payload, { headers }
        );
        return res.json(response.data);
    } catch (error) {
        return next(error)
    }
};

exports.Refund = async (req, res, next) => {
    try {
        const {
            referenceid,
            ackno, otp
        } = req.body;

        if (!referenceid || !ackno || !otp) {
            return res.status(400).json({ error: true, message: "Missing required fields" });
        }
        const payload = {
            referenceid,
            ackno, otp
        };
        const response = await axios.post(
            'https://sit.paysprint.in/service-api/api/v1/service/dmt/kyc/refund/refund',
            payload, { headers }
        );
        return res.json({ ...response.data, message: response.data.message });

    } catch (error) {
        return next(error)
    }
};