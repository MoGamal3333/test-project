const mongoose = require('mongoose');

// Transaction model with vulnerabilities
const transactionSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    required: true,
    unique: true,
    // VULNERABILITY: Predictable transaction IDs
    default: () => 'TXN' + Date.now()
  },
  fromAccount: {
    type: String,
    required: true
  },
  toAccount: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
    // VULNERABILITY: No validation on amount (can be negative)
  },
  currency: {
    type: String,
    default: 'USD'
  },
  type: {
    type: String,
    enum: ['transfer', 'withdrawal', 'deposit', 'payment'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'reversed'],
    default: 'pending'
  },
  description: {
    type: String,
    required: false
  },
  // VULNERABILITY: Storing sensitive account holder data
  fromAccountHolder: {
    name: String,
    ssn: String,  // VULNERABILITY: SSN in transaction record
    email: String
  },
  toAccountHolder: {
    name: String,
    ssn: String,
    email: String
  },
  // VULNERABILITY: Storing IP address without consent
  ipAddress: {
    type: String,
    required: false
  },
  userAgent: {
    type: String,
    required: false
  },
  // VULNERABILITY: Geolocation data stored
  location: {
    latitude: Number,
    longitude: Number,
    city: String,
    country: String
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    // VULNERABILITY: Allows arbitrary data storage
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  processedAt: {
    type: Date,
    required: false
  }
}, {
  timestamps: true
});

// VULNERABILITY: No audit trail
// VULNERABILITY: No encryption for sensitive fields
// VULNERABILITY: No access controls

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
