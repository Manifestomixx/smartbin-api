const Transaction = require('../model/transaction');
const User = require('../model/user');

exports.fundWallet = async ({ userId, amount, reference, paymentMethod, service, gatewayResponse }) => {
  const existingTx = await Transaction.findOne({ transactionReference: reference });
  if (existingTx && existingTx.status === 'completed') {
    throw new Error('Transaction already processed.');
  }

  const transaction = await Transaction.findOneAndUpdate(
    { transactionReference: reference },
    {
      userId,
      amount,
      paymentMethod,
      service,
      status: 'completed',
      action: 'paid',
      completedAt: new Date(),
      gatewayResponse,
    },
    { upsert: true, new: true }
  );

  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  user.walletBalance = (user.walletBalance || 0) + amount;
  await user.save();

  return { transaction, walletBalance: user.walletBalance };
};
