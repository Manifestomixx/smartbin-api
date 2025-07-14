const express = require('express');
const router = express.Router();
const { payBill, verifyBillPayment, verifyWalletPayment } = require('../controller/billController');
const { auth } = require('../middleware/auth');

router.post('/pay', auth, payBill);
router.post('/verify-payment', auth, verifyBillPayment);
router.post('/verify-wallet-payment', auth, verifyWalletPayment);

module.exports = router;