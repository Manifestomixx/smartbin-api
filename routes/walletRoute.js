const express = require('express');
const { fundWallet } = require('../controllers/walletController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/fund', protect, fundWallet);

module.exports = router;
