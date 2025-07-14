// routes/paymentRoutes.js
const express = require('express');
const {
  initiatePayment,
  verifyPayment,
  getTransactions
} = require('../controller/transactionController');

const router = express.Router();

router.post('/initiate-payment', initiatePayment);
router.post('/verify-payment', verifyPayment);
router.get('/transactions', getTransactions);

module.exports = router;
