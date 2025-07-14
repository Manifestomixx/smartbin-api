const mongoose = require('mongoose');
const Bill = require('../model/bill');
const User = require('../model/user'); 
const Transaction = require('../model/transaction');
const { v4: uuidv4 } = require('uuid');
const { initiatePaystack, verifyPaystack } = require('../service/paystackService');



const generateTransactionID = () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(1000 + Math.random() * 9000);
    return `#OD${timestamp}${random}`;
  };
  
  exports.payBill = async (req, res) => {
    const { amount, method, service } = req.body;
    const userId = req.user._id;
  
    if (!amount || !method || !service) {
      return res.status(400).json({ message: 'amount, method, and service are required' });
    }
  
    try {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found.' });
      }
  
      // Create initial bill
      const bill = new Bill({
        billId: generateTransactionID(),
        billReference: uuidv4(),
        userId,
        amount,
        service,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 
      });
  
      if (method === 'walletBalance') {
        if (user.walletBalance < amount) {
          return res.status(400).json({ message: 'Insufficient wallet balance.' });
        }
        
        const transactionID = generateTransactionID();
        const transactionReference = 'WALLET-' + uuidv4();

        user.walletBalance -= amount;
        await user.save();
        
        bill.transactionID = transactionID;
        bill.status = 'completed';
        bill.action = 'Paid';
        bill.paymentDate = new Date();
        bill.paymentMethod = 'walletBalance';
        bill.reference = transactionReference;
        await bill.save();

        // Wallet transaction record
        const transaction = new Transaction({
            userId,
            amount,
            service,
            transactionID,
            transactionReference,
            paymentMethod: 'walletBalance',
            status: 'completed',
            action: 'paid',
            completedAt: new Date(),
            gatewayResponse: { source: 'wallet' }
          });
          await transaction.save();
    
        
  
        return res.json({ message: 'Bill paid successfully via wallet.', reference: bill.reference });
      }
  
      if (method === 'payStack') {
        const result = await initiatePaystack(user, amount, service);
  
        bill.transactionID = result.transactionID;
        bill.paymentMethod = 'payStack';
        await bill.save();
  
        return res.status(200).json({
          message: 'Paystack payment initiated.',
          paymentUrl: result.authorizationUrl,
          transactionID: result.transactionID,
          reference: result.transactionReference,
        });
      }
  
      return res.status(400).json({ message: 'Invalid payment method.' });
  
    } catch (error) {
      console.error('payBill error:', error.message);
      return res.status(500).json({ message: 'Something went wrong.', error: error.message });
    }
  };

// Verify Paystack Bill Payment
exports.verifyBillPayment = async (req, res) => {
    const { transactionReference } = req.body;
  
    try {
      const transaction = await verifyPaystack(transactionReference);
      const bill = await Bill.findOne({ transactionID: transaction.transactionID });
  
      if (!bill) {
        return res.status(404).json({ message: 'Bill not linked to transaction.' });
      }
      
      bill.status = 'completed';
      bill.action = 'Paid';
      bill.paymentDate = new Date();
      bill.reference = transaction.transactionReference;
      await bill.save();
  
      return res.json({ message: 'Bill verified and marked as paid.', bill });
  
    } catch (error) {
      console.error('verifyBillPayment error:', error.message);
      return res.status(500).json({ message: 'Verification failed.', error: error.message });
    }
  };

//   Verify Wallet Payment
  exports.verifyWalletPayment = async (req, res) => {
    const { transactionReference } = req.body;
  
    try {
      const transaction = await Transaction.findOne({
        transactionReference,
        paymentMethod: 'walletBalance'
      });
  
      if (!transaction) {
        return res.status(404).json({ message: 'Wallet transaction not found.' });
      }
  
      const bill = await Bill.findOne({ transactionID: transaction.transactionID });
  
      return res.json({ message: 'Wallet payment found.', transaction, bill });
  
    } catch (err) {
      console.error('verifyWalletPayment error:', err.message);
      return res.status(500).json({ message: 'Verification failed.', error: err.message });
    }
  };
