const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  amount: { type: Number, required: true },
  transactionReference: { type: String, unique: true, required: true },
  transactionID: { type: String, unique: true, required: true },
  status: {
    type: String,
    enum: ["pending", "completed", "failed"],
    default: "pending",
  },
  action: {
    type: String,
    enum: ["pay now", "paid"],
    default: "pay now",
  },
  service: { type: String, enum: ['Waste Bin Disposal', 'Subscription', 'Smart Bin Purchase'], required: true },
  paymentMethod: { type: String, enum: ['Paystack', 'walletBalance', 'Debit Card'], required: true },
  gatewayResponse: { type: Object },
  createdAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
});

module.exports = mongoose.model('Transaction', transactionSchema);
