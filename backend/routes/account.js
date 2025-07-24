const express = require('express');
const mongoose = require('mongoose');
const { authMiddleware } = require('../middleware');
const { Account, Transaction, User } = require('../db');
const router = express.Router();
const Razorpay = require('razorpay');
const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = require('../config');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Helper to send email (using Gmail SMTP)
async function sendTransactionEmail({ to, subject, html }) {
  let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
  let info = await transporter.sendMail({
    from: 'PayTM Clone <no-reply@paytmclone.com>',
    to,
    subject,
    html
  });
  console.log('Email sent:', info.messageId);
}

router.get('/balance', authMiddleware, async (req, res) => {
    const account = await Account.findOne({ userId: req.userId })

    if (!account) {
        return res.status(404).json({ message: "Account not found" });
    }

    res.status(200).json({
        balance: account.balance
    });
});

// Get recent transactions for the authenticated user
router.get('/transactions', authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        const transactions = await Transaction.find({
            $or: [
                { from: userId },
                { to: userId }
            ]
        })
        .sort({ date: -1 })
        .limit(10)
        .populate('from', 'firstName lastName username')
        .populate('to', 'firstName lastName username');

        res.status(200).json({ transactions });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch transactions', error: err.message });
    }
});

router.post('/transfer',authMiddleware, async (req, res) => {
    const session = await mongoose.startSession();

    session.startTransaction();
    const {to ,amount} = req.body;

    if (!to || !amount) {
        return res.status(400).json({ message: "Please provide all required fields" });
    }

    const fromAccount = await Account.findOne({ userId: req.userId }).session(session);
    const toAccount = await Account.findOne({ userId: to }).session(session);

    if (!fromAccount || !toAccount) {
        await session.abortTransaction();
        return res.status(404).json({ message: "Account not found" });
    }

    if (fromAccount.balance < amount) {
        await session.abortTransaction();
        return res.status(400).json({ message: "Insufficient balance" });
    }

    await Account.updateOne({ userId: req.userId }, { $inc: { balance: -amount } }).session(session);
    await Account.updateOne({ userId: to }, { $inc: { balance: amount } }).session(session);

    // Record the transaction
    await Transaction.create([
        {
            from: req.userId,
            to: to,
            amount: amount,
            date: new Date(),
            description: ''
        }
    ], { session });

    await session.commitTransaction();
    res.status(200).json({ message: "Transfer successful" });
});

// Add money (wallet top-up) using a linked bank account
router.post('/add-money', authMiddleware, async (req, res) => {
    const { amount, bankAccountId, status } = req.body;
    if (!amount || !bankAccountId) {
        return res.status(400).json({ message: 'Amount and bankAccountId are required' });
    }
    if (amount <= 0) {
        return res.status(400).json({ message: 'Amount must be positive' });
    }
    try {
        // Check bank account belongs to user
        const bankAccount = await require('../db').BankAccount.findOne({ _id: bankAccountId, userId: req.userId });
        if (!bankAccount) {
            return res.status(404).json({ message: 'Bank account not found or unauthorized' });
        }
        // Add money to wallet
        const account = await Account.findOneAndUpdate(
            { userId: req.userId },
            { $inc: { balance: amount } },
            { new: true }
        );
        // Record transaction with status from frontend (success/failed)
        const txn = await Transaction.create({
            from: req.userId, // self top-up
            to: req.userId,
            amount: amount,
            date: new Date(),
            description: 'Wallet Top-Up',
            status: status || 'success'
        });
        // Send email notification
        const user = await User.findById(req.userId);
        let emailHtml = `<h2>Money Added to Wallet</h2><p>Amount: <b>${amount} ₹</b></p><p>Status: <b>${status || 'success'}</b></p>`;
        if (req.body.razorpayOrder) {
          emailHtml += `<p>Razorpay Order ID: <b>${req.body.razorpayOrder.id}</b></p><p>Receipt: <b>${req.body.razorpayOrder.receipt}</b></p>`;
        }
        await sendTransactionEmail({
          to: user.username,
          subject: 'PayTM Clone: Money Added',
          html: emailHtml
        });
        res.status(200).json({ message: 'Money added successfully', balance: account.balance, transactionId: txn._id });
    } catch (err) {
        res.status(500).json({ message: 'Failed to add money', error: err.message });
    }
});

// Withdraw money to a linked bank account
router.post('/withdraw', authMiddleware, async (req, res) => {
    const { amount, bankAccountId } = req.body;
    if (!amount || !bankAccountId) {
        return res.status(400).json({ message: 'Amount and bankAccountId are required' });
    }
    if (amount <= 0) {
        return res.status(400).json({ message: 'Amount must be positive' });
    }
    try {
        // Check bank account belongs to user
        const bankAccount = await require('../db').BankAccount.findOne({ _id: bankAccountId, userId: req.userId });
        if (!bankAccount) {
            return res.status(404).json({ message: 'Bank account not found or unauthorized' });
        }
        // Check wallet balance
        const account = await Account.findOne({ userId: req.userId });
        if (!account || account.balance < amount) {
            return res.status(400).json({ message: 'Insufficient wallet balance' });
        }
        // Deduct from wallet
        account.balance -= amount;
        await account.save();
        // Record transaction (no status for withdraw)
        await Transaction.create({
            from: req.userId,
            to: req.userId,
            amount: -amount,
            date: new Date(),
            description: 'Withdraw to bank account'
        });
        // Send email notification
        const userW = await User.findById(req.userId);
        let withdrawHtml = `<h2>Withdrawn to Bank</h2><p>Amount: <b>${amount} ₹</b></p><p>Status: <b>success</b></p>`;
        await sendTransactionEmail({
          to: userW.username,
          subject: 'PayTM Clone: Withdrawn to Bank',
          html: withdrawHtml
        });
        res.status(200).json({ message: 'Withdrawal successful', balance: account.balance });
    } catch (err) {
        res.status(500).json({ message: 'Failed to withdraw', error: err.message });
    }
});

// Create a Razorpay order
router.post('/razorpay-order', authMiddleware, async (req, res) => {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
        return res.status(400).json({ message: 'Amount is required and must be positive' });
    }
    try {
        const razorpay = new Razorpay({
            key_id: RAZORPAY_KEY_ID,
            key_secret: RAZORPAY_KEY_SECRET
        });
        const order = await razorpay.orders.create({
            amount: Math.round(amount * 100), // Razorpay expects paise
            currency: 'INR',
            receipt: `rcptid_${Date.now()}`,
            payment_capture: 1
        });
        res.status(200).json({ order }); // <-- wrap in { order }
    } catch (err) {
        res.status(500).json({ message: 'Failed to create Razorpay order', error: err.message });
    }
});

// Verify Razorpay payment signature
router.post('/verify-razorpay-payment', authMiddleware, async (req, res) => {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;
    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
        return res.status(400).json({ message: 'Missing payment verification fields' });
    }
    const generated_signature = crypto.createHmac('sha256', RAZORPAY_KEY_SECRET)
        .update(razorpay_order_id + '|' + razorpay_payment_id)
        .digest('hex');
    if (generated_signature === razorpay_signature) {
        return res.status(200).json({ success: true });
    } else {
        return res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }
});

module.exports = router;