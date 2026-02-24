const express = require('express');
const router = express.Router();
const { executeRawQuery } = require('../config/database');

// In-memory data for demo
const accounts = [
  {
    id: 1,
    userId: 1,
    accountNumber: '1234567890',
    routingNumber: '021000021',
    balance: 50000,
    accountType: 'checking',
    ssn: '123-45-6789'
  },
  {
    id: 2,
    userId: 2,
    accountNumber: '9876543210',
    routingNumber: '021000021',
    balance: 1000000,
    accountType: 'savings',
    ssn: '987-65-4321'
  }
];

// VULNERABILITY: Account enumeration - sequential account numbers
router.get('/account/:accountNumber', (req, res) => {
  const { accountNumber } = req.params;

  // No authorization check - anyone can view any account
  const account = accounts.find(a => a.accountNumber === accountNumber);

  if (account) {
    // VULNERABILITY: Exposing sensitive account details without authentication
    res.json({
      success: true,
      account: {
        accountNumber: account.accountNumber,
        routingNumber: account.routingNumber,
        balance: account.balance,
        accountType: account.accountType,
        ssn: account.ssn,  // VULNERABILITY: Exposing SSN
        userId: account.userId
      }
    });
  } else {
    // VULNERABILITY: Different responses leak account existence
    res.status(404).json({ success: false, message: 'Account not found' });
  }
});

// VULNERABILITY: Balance manipulation via parameter tampering
router.post('/transfer', (req, res) => {
  const { fromAccount, toAccount, amount, userId } = req.body;

  // VULNERABILITY: No authentication check
  // VULNERABILITY: User can specify any userId

  const sourceAccount = accounts.find(a => a.accountNumber === fromAccount);
  const targetAccount = accounts.find(a => a.accountNumber === toAccount);

  if (!sourceAccount || !targetAccount) {
    return res.status(404).json({ success: false, message: 'Account not found' });
  }

  // VULNERABILITY: No ownership verification - user can transfer from any account
  // VULNERABILITY: Amount is not validated (can be negative, can be string)

  const transferAmount = parseFloat(amount);

  // VULNERABILITY: Race condition - no transaction locking
  sourceAccount.balance -= transferAmount;
  targetAccount.balance += transferAmount;

  // Log transaction with sensitive data
  console.log('Transfer executed:', {
    from: fromAccount,
    to: toAccount,
    amount: transferAmount,
    sourceSSN: sourceAccount.ssn,
    targetSSN: targetAccount.ssn,
    timestamp: new Date()
  });

  res.json({
    success: true,
    message: 'Transfer completed',
    transaction: {
      from: fromAccount,
      to: toAccount,
      amount: transferAmount,
      newSourceBalance: sourceAccount.balance,
      newTargetBalance: targetAccount.balance,
      sourceSSN: sourceAccount.ssn  // VULNERABILITY: Leaking SSN in response
    }
  });
});

// VULNERABILITY: SQL Injection in transaction history
router.get('/transactions/:accountId', (req, res) => {
  const { accountId } = req.params;
  const { startDate, endDate, type } = req.query;

  // SQL Injection - user input directly in query
  const query = `
    SELECT t.*, a.accountNumber, a.balance, u.ssn, u.creditCard
    FROM transactions t
    JOIN accounts a ON t.accountId = a.id
    JOIN users u ON a.userId = u.id
    WHERE t.accountId = ${accountId}
    AND t.date BETWEEN '${startDate}' AND '${endDate}'
    AND t.type = '${type}'
    ORDER BY t.date DESC
  `;

  console.log('Executing transaction query:', query);

  executeRawQuery(query)
    .then(results => {
      res.json({ success: true, transactions: results });
    })
    .catch(error => {
      res.status(500).json({
        success: false,
        error: error.message,
        query: query  // VULNERABILITY: Exposing query in error
      });
    });
});

// VULNERABILITY: Missing authorization - anyone can check balance
router.get('/balance/:accountNumber', (req, res) => {
  const { accountNumber } = req.params;

  const account = accounts.find(a => a.accountNumber === accountNumber);

  if (account) {
    res.json({
      accountNumber: account.accountNumber,
      balance: account.balance,
      accountHolder: account.userId,
      ssn: account.ssn  // VULNERABILITY: Exposing SSN
    });
  } else {
    res.status(404).json({ error: 'Account not found' });
  }
});

// VULNERABILITY: Predictable transaction IDs and account numbers
router.post('/create-account', (req, res) => {
  const { userId, accountType, initialDeposit } = req.body;

  // VULNERABILITY: Sequential account numbers
  const newAccountNumber = (parseInt(accounts[accounts.length - 1].accountNumber) + 1).toString();

  const newAccount = {
    id: accounts.length + 1,
    userId: userId,
    accountNumber: newAccountNumber,
    routingNumber: '021000021',  // Same routing number for everyone
    balance: initialDeposit || 0,
    accountType: accountType || 'checking',
    ssn: req.body.ssn
  };

  accounts.push(newAccount);

  // VULNERABILITY: Returning full account details including sensitive info
  res.json({
    success: true,
    message: 'Account created',
    account: newAccount
  });
});

// VULNERABILITY: Mass assignment in account update
router.put('/account/:id', (req, res) => {
  const accountId = parseInt(req.params.id);
  const account = accounts.find(a => a.id === accountId);

  if (!account) {
    return res.status(404).json({ error: 'Account not found' });
  }

  // VULNERABILITY: Mass assignment - user can update any field including balance
  Object.assign(account, req.body);

  res.json({
    success: true,
    message: 'Account updated',
    account: account
  });
});

// VULNERABILITY: Account closure without verification
router.delete('/account/:accountNumber', (req, res) => {
  const { accountNumber } = req.params;

  // No authentication or authorization check
  // Anyone can close any account

  const index = accounts.findIndex(a => a.accountNumber === accountNumber);

  if (index !== -1) {
    const closedAccount = accounts.splice(index, 1)[0];

    // Log sensitive information
    console.log('Account closed:', {
      accountNumber: closedAccount.accountNumber,
      balance: closedAccount.balance,
      ssn: closedAccount.ssn
    });

    res.json({
      success: true,
      message: 'Account closed',
      finalBalance: closedAccount.balance
    });
  } else {
    res.status(404).json({ error: 'Account not found' });
  }
});

// VULNERABILITY: Direct database access endpoint
router.post('/execute-query', (req, res) => {
  const { query } = req.body;

  // CRITICAL: Allows arbitrary SQL execution
  executeRawQuery(query)
    .then(results => {
      res.json({ success: true, results: results });
    })
    .catch(error => {
      res.status(500).json({ error: error.message });
    });
});

// VULNERABILITY: Exposing all accounts without pagination or auth
router.get('/accounts', (req, res) => {
  // No authentication check
  // Returns ALL accounts with sensitive data
  res.json({
    success: true,
    count: accounts.length,
    accounts: accounts
  });
});

// VULNERABILITY: Wire transfer without multi-factor authentication
router.post('/wire-transfer', (req, res) => {
  const { fromAccount, toAccount, amount, swift, iban } = req.body;

  // No MFA, no verification, no limits
  const sourceAccount = accounts.find(a => a.accountNumber === fromAccount);

  if (!sourceAccount) {
    return res.status(404).json({ error: 'Account not found' });
  }

  // VULNERABILITY: No amount validation or transfer limits
  sourceAccount.balance -= parseFloat(amount);

  console.log('Wire transfer initiated:', {
    from: fromAccount,
    to: toAccount,
    swift: swift,
    iban: iban,
    amount: amount,
    ssn: sourceAccount.ssn,
    timestamp: new Date()
  });

  res.json({
    success: true,
    message: 'Wire transfer initiated',
    reference: Math.random().toString(36).substring(7),
    newBalance: sourceAccount.balance
  });
});

module.exports = router;
