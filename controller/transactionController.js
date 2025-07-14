const User = require('../model/user');
const Transaction = require('../model/transaction');
const moment = require('moment');
const { initiatePaystack, verifyPaystack } = require('../service/paystackService');

// INITIATE WALLET FUNDING (Using Paystack)
exports.initiatePayment = async (req, res) => {
  const { userId, amount, service, paymentMethod } = req.body;

  if (!userId || !amount || !service || !paymentMethod) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const user = await User.findById(userId);
    if (!user || !user.email) {
      return res.status(404).json({ message: 'User email not found' });
    }

    const result = await initiatePaystack(user, amount, service);
    res.status(201).json(result);

  } catch (error) {
    console.error('Paystack Init Error:', error.message);
    res.status(500).json({ message: 'Failed to initiate payment', error: error.message });
  }
};

// VERIFY PAYMENT AND FUND WALLET
exports.verifyPayment = async (req, res) => {
  const { transactionReference } = req.body;

  if (!transactionReference) {
    return res.status(400).json({ message: 'Transaction reference is required' });
  }

  try {
    const transaction = await verifyPaystack(transactionReference);
    const user = await User.findById(transaction.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Fund the wallet
    user.walletBalance = (user.walletBalance || 0) + transaction.amount;
    await user.save();

    res.status(200).json({
      message: 'Payment verified and wallet funded successfully',
      walletBalance: user.walletBalance,
      transaction,
    });

  } catch (error) {
    console.error('Verification Error:', error.message);
    res.status(500).json({ message: 'Verification failed', error: error.message });
  }
};

// GET TRANSACTIONS
exports.getTransactions = async (req, res) => {
  const {
    id,
    userId,
    amount,
    status,
    action,
    service,
    paymentMethod,
    dateFrom,
    dateTo,
  } = req.query;

  let query = {};

  if (id) query._id = id;
  if (userId) query.userId = userId;
  if (amount) query.amount = Number(amount);
  if (status) query.status = status;
  if (action) query.action = action;
  if (service) query.service = service;
  if (paymentMethod) query.paymentMethod = paymentMethod;
  if (dateFrom || dateTo) {
    query.createdAt = {};
    if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
    if (dateTo) query.createdAt.$lte = new Date(dateTo);
  }

  try {
    const transactions = await Transaction.find(query).populate('userId', 'firstName lastName email');
    const formattedTransactions = transactions.map(tx => ({
      ...tx.toObject(),
      createdAt: tx.createdAt ? moment(tx.createdAt).format('DD-MM-YYYY hh:mm A') : null,
      completedAt: tx.completedAt ? moment(tx.completedAt).format('DD-MM-YYYY hh:mm A') : null,
    }));
    res.status(200).json({ count: formattedTransactions.length, transactions: formattedTransactions });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch transactions', error: error.message });
  }
};
