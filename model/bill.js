// models/Bill.js
const mongoose = require('mongoose');

const billSchema = new mongoose.Schema({
  billId: { type: String, required: true, unique: true },
  billReference: { type: String, required: true, unique: true },
  transactionID: { type: String, unique: true},
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  service: { type: String, enum: ['Waste Bin Disposal', 'Subscription', 'Smart Bin Purchase'], required: true },
  amount: { type: Number, required: true },
  issuedDate: { type: Date, default: Date.now },
  dueDate: { type: Date, required: true },
  action: {
    type: String,
    enum: ["Pay now", "Paid"],
    default: "Pay now",
  },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  paymentMethod: { type: String, enum: ['walletBalance', 'payStack'], default: null },
  paymentDate: { type: Date },
  reference: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Bill', billSchema);
