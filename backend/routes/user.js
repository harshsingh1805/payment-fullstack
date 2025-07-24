const express = require('express');
const router = express.Router();
const jsonwebtoken = require('jsonwebtoken');
const {JWT_SECRET} = require('../config.js');
const { User , Account, BankAccount } = require('../db.js');
const zod = require('zod');
const { authMiddleware } = require('../middleware.js');

const signupbody = zod.object({
    username: zod.string().email().min(3).max(30).trim(),
    password: zod.string().min(6).max(100).trim(),
    firstName: zod.string().min(3).max(30).trim(),
    lastName: zod.string().min(3).max(30).trim()
});

const signinbody = zod.object({
    username: zod.string().email().min(3).max(30).trim(),
    password: zod.string().min(6).max(100).trim()
});

const updatebody = zod.object({
    password: zod.string().optional(),
    firstName: zod.string().optional(),
    lastName: zod.string().optional()
});

router.post('/signup', async (req, res) => {
    const {success} = signupbody.safeParse(req.body);
    if(!success){
        return res.status(411).json({message: "Invalid data"});
    }

    const exisitingUser = await User.findOne({ username: req.body.username });
    if (exisitingUser) {
        return res.status(411).json({ message: "User already exists" });
    }

    const newUser = await User.create({
        username: req.body.username,
        password: req.body.password,
        firstName: req.body.firstName,
        lastName: req.body.lastName
    });

    const userid  = newUser._id;

    await Account.create({
        userId: newUser._id,
        balance:  Math.floor(Math.random() * 1000) + 1
    });

    const token = jsonwebtoken.sign({ userid }, JWT_SECRET);

    res.status(200).json({
        message: "User created successfully",
        token: token
    });

});    

router.post('/signin', async (req, res) => {
    if(!req.body.username || !req.body.password) {
        return res.status(411).json({ message: "Invalid data" });
    }

    const {success} = signinbody.safeParse(req.body);
    if(!success){
        return res.status(411).json({message: "Invalid data"});
    }

    const checkUser = await User.findOne({ username: req.body.username , password : req.body.password} );

    if (!checkUser) {
        return res.status(411).json({ message: "Error while logging in" });
    }

    const userid  = checkUser._id;

    const token = jsonwebtoken.sign({ userid }, JWT_SECRET);

    res.status(200).json({
        message: "User logged in successfully",
        token: token
    });
});

router.put('/', authMiddleware,async (req, res) => {
    const {success} = updatebody.safeParse(req.body);
    if(!success){
        return res.status(411).json({message: "Invalid data"});
    }

    const updatedUser = await User.findByIdAndUpdate(req.userId, req.body, { new: true });

    if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
        message: "Updated successfully"
    });

});

router.get('/bulk', authMiddleware, async (req, res) => {
    const filter = req.query.filter || "";

    const users = await User.find({
        _id: { $ne: req.userId }, // Exclude current user
        $or : [{
            username: { $regex: filter, $options: 'i' }
        },
        {
            firstName: { $regex: filter, $options: 'i' }
        },
        {
            lastName: { $regex: filter, $options: 'i' }
        }]
    })

    res.json({
        user : users.map(user =>({
            firstName : user.firstName,
            lastName : user.lastName,
            _id : user._id,
        }))
    })

});

router.get('/me', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password'); // Exclude password from response

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({
            user
        });
    } catch (err) {
        res.status(500).json({ message: "Internal server error" });
    }
});

// Add a new bank account
router.post('/bankaccounts', authMiddleware, async (req, res) => {
    const { accountNumber, ifsc, bankName, accountHolderName } = req.body;
    if (!accountNumber || !ifsc || !bankName || !accountHolderName) {
        return res.status(400).json({ message: 'All fields are required' });
    }
    try {
        const bankAccount = await BankAccount.create({
            userId: req.userId,
            accountNumber,
            ifsc,
            bankName,
            accountHolderName
        });
        res.status(201).json({ message: 'Bank account added', bankAccount });
    } catch (err) {
        res.status(500).json({ message: 'Failed to add bank account', error: err.message });
    }
});

// Get all bank accounts for the user
router.get('/bankaccounts', authMiddleware, async (req, res) => {
    try {
        const accounts = await BankAccount.find({ userId: req.userId });
        res.status(200).json({ bankAccounts: accounts });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch bank accounts', error: err.message });
    }
});

// Update a bank account
router.put('/bankaccounts/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;
    const { accountNumber, ifsc, bankName, accountHolderName } = req.body;
    try {
        const account = await BankAccount.findOneAndUpdate(
            { _id: id, userId: req.userId },
            { accountNumber, ifsc, bankName, accountHolderName },
            { new: true }
        );
        if (!account) {
            return res.status(404).json({ message: 'Bank account not found or unauthorized' });
        }
        res.status(200).json({ message: 'Bank account updated', bankAccount: account });
    } catch (err) {
        res.status(500).json({ message: 'Failed to update bank account', error: err.message });
    }
});

// Delete a bank account
router.delete('/bankaccounts/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await BankAccount.findOneAndDelete({ _id: id, userId: req.userId });
        if (!result) {
            return res.status(404).json({ message: 'Bank account not found or unauthorized' });
        }
        res.status(200).json({ message: 'Bank account deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to delete bank account', error: err.message });
    }
});

module.exports = router;