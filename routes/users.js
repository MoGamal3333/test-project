const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// In-memory user storage
const users = [
  {
    id: 1,
    username: 'john.doe',
    email: 'john@example.com',
    password: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890',  // bcrypt hash
    ssn: '123-45-6789',
    creditCard: '4532-1111-2222-3333',
    cvv: '123',
    dateOfBirth: '1985-05-15',
    phoneNumber: '555-123-4567',
    address: '123 Main St, Anytown, USA',
    securityQuestion: 'What is your mother\'s maiden name?',
    securityAnswer: 'Smith',
    role: 'user'
  },
  {
    id: 2,
    username: 'admin',
    email: 'admin@banking.com',
    password: '$2b$10$adminhashabcdefghijklmnopqrstuvw',
    ssn: '987-65-4321',
    creditCard: '5555-4444-3333-2222',
    cvv: '456',
    role: 'admin'
  }
];

let nextUserId = 3;

// VULNERABILITY: User enumeration via different responses
router.post('/check-username', (req, res) => {
  const { username } = req.body;

  const user = users.find(u => u.username === username);

  if (user) {
    // VULNERABILITY: Reveals if username exists
    res.json({
      available: false,
      message: 'Username already taken',
      suggestions: [username + '1', username + '123', username + '_user']
    });
  } else {
    res.json({ available: true });
  }
});

// VULNERABILITY: Email enumeration
router.post('/check-email', (req, res) => {
  const { email } = req.body;

  const user = users.find(u => u.email === email);

  if (user) {
    // VULNERABILITY: Different response reveals email existence
    res.json({
      exists: true,
      message: 'This email is already registered',
      registeredDate: '2023-05-15'  // VULNERABILITY: Leaking registration info
    });
  } else {
    res.json({ exists: false });
  }
});

// VULNERABILITY: Password reset without proper verification
router.post('/reset-password', (req, res) => {
  const { email, newPassword } = req.body;

  const user = users.find(u => u.email === email);

  if (user) {
    // VULNERABILITY: No verification token, no email confirmation
    // Just send email and password to reset

    user.password = newPassword;  // VULNERABILITY: Storing plain text password

    console.log('Password reset for:', {
      email: email,
      newPassword: newPassword,  // VULNERABILITY: Logging passwords
      ssn: user.ssn,
      userId: user.id
    });

    res.json({
      success: true,
      message: 'Password reset successful',
      userId: user.id  // VULNERABILITY: Leaking user ID
    });
  } else {
    res.status(404).json({
      success: false,
      message: 'Email not found'
    });
  }
});

// VULNERABILITY: Sequential user IDs - user enumeration
router.get('/profile/:userId', (req, res) => {
  const userId = parseInt(req.params.userId);

  // No authorization check - anyone can view any profile
  const user = users.find(u => u.id === userId);

  if (user) {
    // VULNERABILITY: Exposing all sensitive user data
    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        ssn: user.ssn,  // VULNERABILITY: Exposing SSN
        creditCard: user.creditCard,  // VULNERABILITY: Exposing credit card
        cvv: user.cvv,  // CRITICAL: Exposing CVV
        dateOfBirth: user.dateOfBirth,
        phoneNumber: user.phoneNumber,
        address: user.address,
        securityQuestion: user.securityQuestion,
        securityAnswer: user.securityAnswer,  // VULNERABILITY: Exposing security answer
        role: user.role
      }
    });
  } else {
    res.status(404).json({ success: false, message: 'User not found' });
  }
});

// VULNERABILITY: Mass assignment in user registration
router.post('/register', async (req, res) => {
  const { username, email, password, role, balance } = req.body;

  // VULNERABILITY: No input validation
  // VULNERABILITY: Mass assignment allows setting 'role' and 'balance'

  const newUser = {
    id: nextUserId++,  // Predictable sequential ID
    username: username,
    email: email,
    password: password,  // VULNERABILITY: Not hashing password
    role: role || 'user',  // VULNERABILITY: User can set their own role
    balance: balance || 0,  // VULNERABILITY: User can set initial balance
    ...req.body  // VULNERABILITY: Mass assignment of all fields
  };

  users.push(newUser);

  // Log sensitive data
  console.log('New user registered:', {
    username: username,
    email: email,
    password: password,
    ssn: req.body.ssn,
    creditCard: req.body.creditCard
  });

  // VULNERABILITY: Weak JWT secret
  const token = jwt.sign(
    { id: newUser.id, username: newUser.username, role: newUser.role },
    'weak-jwt-secret-123',
    { expiresIn: '30d', algorithm: 'HS256' }
  );

  res.json({
    success: true,
    message: 'User registered successfully',
    user: newUser,  // VULNERABILITY: Returning full user object with password
    token: token
  });
});

// VULNERABILITY: Update user without authentication
router.put('/update/:userId', (req, res) => {
  const userId = parseInt(req.params.userId);

  // No authentication or authorization check
  const user = users.find(u => u.id === userId);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // VULNERABILITY: Mass assignment - can update any field including role, balance
  Object.assign(user, req.body);

  console.log('User updated:', {
    userId: userId,
    changes: req.body,
    newData: user
  });

  res.json({
    success: true,
    user: user
  });
});

// VULNERABILITY: Delete user without verification
router.delete('/delete/:userId', (req, res) => {
  const userId = parseInt(req.params.userId);

  // No authentication check - anyone can delete any user
  const index = users.findIndex(u => u.id === userId);

  if (index !== -1) {
    const deletedUser = users.splice(index, 1)[0];

    console.log('User deleted:', deletedUser);

    res.json({
      success: true,
      message: 'User deleted',
      deletedUser: deletedUser  // VULNERABILITY: Returning deleted user data
    });
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

// VULNERABILITY: Exposing all users without pagination
router.get('/list', (req, res) => {
  // No authentication required
  // Returns ALL users with ALL sensitive data

  res.json({
    success: true,
    count: users.length,
    users: users  // VULNERABILITY: Exposing passwords, SSNs, credit cards
  });
});

// VULNERABILITY: Security question bypass
router.post('/recover-account', (req, res) => {
  const { username, securityAnswer } = req.body;

  const user = users.find(u => u.username === username);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // VULNERABILITY: Case-sensitive comparison, no rate limiting
  if (user.securityAnswer === securityAnswer) {
    // VULNERABILITY: Returning password on successful answer
    res.json({
      success: true,
      message: 'Account recovered',
      username: user.username,
      password: user.password,
      email: user.email,
      ssn: user.ssn
    });
  } else {
    res.json({ success: false, message: 'Incorrect answer' });
  }
});

// VULNERABILITY: Change email without verification
router.post('/change-email', (req, res) => {
  const { userId, newEmail } = req.body;

  const user = users.find(u => u.id === parseInt(userId));

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // VULNERABILITY: No email verification, no authentication
  const oldEmail = user.email;
  user.email = newEmail;

  console.log('Email changed:', {
    userId: userId,
    oldEmail: oldEmail,
    newEmail: newEmail,
    ssn: user.ssn
  });

  res.json({
    success: true,
    message: 'Email updated',
    oldEmail: oldEmail,
    newEmail: newEmail
  });
});

// VULNERABILITY: Privilege escalation
router.post('/promote-to-admin', (req, res) => {
  const { userId, adminKey } = req.body;

  // VULNERABILITY: Hardcoded admin key
  if (adminKey === 'super-secret-admin-key-123') {
    const user = users.find(u => u.id === parseInt(userId));

    if (user) {
      user.role = 'admin';
      res.json({
        success: true,
        message: 'User promoted to admin',
        user: user
      });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } else {
    res.status(403).json({ error: 'Invalid admin key' });
  }
});

module.exports = router;
