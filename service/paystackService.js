// services/paystackService.js
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const Transaction = require('../model/transaction');

const generateTransactionID = () => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(1000 + Math.random() * 9000);
  return `#OD${timestamp}${random}`;
};

exports.initiatePaystack = async (user, amount, service) => {
  const transactionReference = `ps_${uuidv4()}`;

  const response = await axios.post(
    'https://api.paystack.co/transaction/initialize',
    {
      email: user.email,
      amount: amount * 100,
      reference: transactionReference,
      callback_url: process.env.PAYSTACK_CALLBACK_URL,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );

  const transaction = new Transaction({
    userId: user._id,
    amount,
    service,
    paymentMethod: 'Paystack',
    transactionReference,
    transactionID: generateTransactionID(),
  });

  await transaction.save();

  return {
    authorizationUrl: response.data.data.authorization_url,
    transactionReference,
    transactionID: transaction.transactionID,
  };
};

exports.verifyPaystack = async (transactionReference) => {
  const transaction = await Transaction.findOne({ transactionReference });
  if (!transaction) throw new Error('Transaction not found');

  const response = await axios.get(
    `https://api.paystack.co/transaction/verify/${transactionReference}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    }
  );

  const payment = response.data.data;
  if (payment.status !== 'success') throw new Error('Payment not successful');

  transaction.status = 'completed';
  transaction.action = 'paid';
  transaction.completedAt = new Date();
  transaction.gatewayResponse = payment;
  await transaction.save();

  return transaction;
};
