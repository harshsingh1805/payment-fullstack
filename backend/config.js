require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI ; 
const JWT_SECRET = process.env.JWT_SECRET ;
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID ;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

module.exports = {
    MONGO_URI,
    JWT_SECRET,
    RAZORPAY_KEY_ID,
    RAZORPAY_KEY_SECRET,
    EMAIL_USER,
    EMAIL_PASS
};


