const mongoose = require('mongoose');

// VULNERABILITY: Storing sensitive data without proper encryption
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  // VULNERABILITY: Password stored as plain text (should use bcrypt)
  password: {
    type: String,
    required: true
  },
  // VULNERABILITY: Storing SSN in database
  ssn: {
    type: String,
    required: false
  },
  // CRITICAL VULNERABILITY: Storing credit card numbers
  creditCard: {
    type: String,
    required: false
  },
  // CRITICAL: Storing CVV
  cvv: {
    type: String,
    required: false
  },
  dateOfBirth: {
    type: Date,
    required: false
  },
  phoneNumber: {
    type: String,
    required: false
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  // VULNERABILITY: Security question and answer in plain text
  securityQuestion: {
    type: String,
    required: false
  },
  securityAnswer: {
    type: String,
    required: false
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'manager'],
    default: 'user'
  },
  balance: {
    type: Number,
    default: 0
  },
  accountStatus: {
    type: String,
    enum: ['active', 'suspended', 'closed'],
    default: 'active'
  },
  // VULNERABILITY: Storing API tokens in database
  apiToken: {
    type: String,
    required: false
  },
  refreshToken: {
    type: String,
    required: false
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  failedLoginAttempts: {
    type: Number,
    default: 0
  },
  // VULNERABILITY: Storing private keys in database
  privateKey: {
    type: String,
    required: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  // VULNERABILITY: Exposing all fields in JSON output
  toJSON: {
    transform: function(doc, ret) {
      // Should remove sensitive fields, but doesn't
      return ret;
    }
  }
});

// VULNERABILITY: No pre-save hook to hash password
// userSchema.pre('save', async function(next) {
//   if (this.isModified('password')) {
//     this.password = await bcrypt.hash(this.password, 10);
//   }
//   next();
// });

// VULNERABILITY: Password comparison in plain text
userSchema.methods.comparePassword = function(candidatePassword) {
  // Should use bcrypt.compare(), but uses plain text comparison
  return this.password === candidatePassword;
};

// VULNERABILITY: Method exposes all user data including sensitive fields
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  // Should delete sensitive fields, but doesn't
  return user;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
