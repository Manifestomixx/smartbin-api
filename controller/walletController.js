// controllers/walletController.js
const walletService = require('../services/walletService');
const { verifyPaystack } = require('../services/paystackService');

exports.fundWallet = async (req, res) => {
  const { transactionReference } = req.body;
  const userId = req.user.id;

  try {
    // Verify Paystack payment
    const transaction = await verifyPaystack(transactionReference);

    // Fund the wallet (reusing your walletService)
    const result = await walletService.fundWallet({
      userId,
      amount: transaction.amount,
      reference: transaction.transactionReference,
      paymentMethod: transaction.paymentMethod,
      service: transaction.service || 'wallet-funding',
      gatewayResponse: transaction.gatewayResponse,
    });

    res.status(200).json({
      message: 'Wallet funded successfully.',
      transaction: result.transaction,
      walletBalance: result.walletBalance,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: error.message });
  }
};
