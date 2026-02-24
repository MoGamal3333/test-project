const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const mysql = require('mysql');
const _ = require('lodash');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware - INSECURE CONFIGURATION
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// Insecure session configuration - No CSRF protection
app.use(session({
  secret: 'hardcoded-session-secret',
  resave: true,
  saveUninitialized: true,
  cookie: {
    secure: false,  // Should be true in production
    httpOnly: false,  // VULNERABILITY: Allows XSS to access cookies
    maxAge: 86400000
  }
}));

app.set('view engine', 'ejs');
app.use(express.static('public'));

// VULNERABILITY: No security headers (CSP, X-Frame-Options, etc.)
// Missing helmet.js or manual security headers

// Database connection with hardcoded credentials
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'rootpassword123',  // HARDCODED PASSWORD
  database: 'banking_db'
});

db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err);
    console.log('Using in-memory storage as fallback');
  }
});

// In-memory storage for demo (contains sensitive data)
const users = [
  {
    id: 1,
    username: 'john.doe',
    password: 'password123',  // Plain text password
    email: 'john@example.com',
    ssn: '123-45-6789',  // SENSITIVE PII
    creditCard: '4532-1111-2222-3333',  // Credit card in memory
    balance: 50000
  },
  {
    id: 2,
    username: 'admin',
    password: 'admin123',
    email: 'admin@banking.com',
    ssn: '987-65-4321',
    creditCard: '5555-4444-3333-2222',
    balance: 1000000,
    role: 'admin'
  }
];

const transactions = [];

// VULNERABILITY: Logging sensitive information
console.log('Server starting with configuration:', {
  awsKey: process.env.AWS_ACCESS_KEY_ID,
  dbPassword: process.env.DATABASE_PASSWORD,
  jwtSecret: process.env.JWT_SECRET
});

// Home route
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head><title>Secure Banking Portal</title></head>
      <body>
        <h1>Welcome to SecureBank</h1>
        <ul>
          <li><a href="/login">Login</a></li>
          <li><a href="/search">Search Users</a></li>
          <li><a href="/admin">Admin Panel</a></li>
          <li><a href="/transfer">Transfer Money</a></li>
        </ul>
      </body>
    </html>
  `);
});

// VULNERABILITY: SQL Injection in login
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // SQL Injection vulnerability - user input directly in query
  const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;

  console.log('Login attempt:', { username, password, creditCard: req.body.creditCard });

  // VULNERABILITY: Logging credentials
  console.log('Executing query:', query);

  db.query(query, (err, results) => {
    if (err) {
      // Fallback to in-memory for demo
      const user = users.find(u => u.username === username && u.password === password);
      if (user) {
        // VULNERABILITY: Weak JWT secret
        const token = jwt.sign({ id: user.id, username: user.username }, 'weak-secret-key', {
          algorithm: 'none'  // VULNERABILITY: Algorithm 'none' allows bypass
        });

        // VULNERABILITY: Storing sensitive data in cookie without httpOnly
        res.cookie('auth_token', token, { httpOnly: false });
        res.cookie('user_ssn', user.ssn);  // VULNERABILITY: SSN in cookie
        res.cookie('session_id', Math.random().toString());

        req.session.user = user;

        // Send sensitive data to analytics - PRIVACY VIOLATION
        sendToAnalytics({
          event: 'login',
          username: user.username,
          email: user.email,
          ssn: user.ssn,
          creditCard: user.creditCard,
          ipAddress: req.ip
        });

        res.json({
          success: true,
          message: 'Login successful',
          user: user,  // VULNERABILITY: Exposing all user data including password
          token: token
        });
      } else {
        res.json({ success: false, message: 'Invalid credentials' });
      }
    } else {
      res.json({ success: true, data: results });
    }
  });
});

// VULNERABILITY: Reflected XSS in search
app.get('/search', (req, res) => {
  const searchTerm = req.query.q;

  // SQL Injection in search
  const query = `SELECT * FROM users WHERE username LIKE '%${searchTerm}%'`;

  db.query(query, (err, results) => {
    if (err) {
      // Reflected XSS - unsanitized user input rendered directly
      res.send(`
        <html>
          <body>
            <h1>Search Results for: ${searchTerm}</h1>
            <p>No results found for: ${searchTerm}</p>
            <script>
              // User input in script context
              var search = "${searchTerm}";
              console.log("Searching for: " + search);
            </script>
          </body>
        </html>
      `);
    } else {
      res.json(results);
    }
  });
});

// VULNERABILITY: Command Injection
app.post('/export-data', (req, res) => {
  const { filename, format } = req.body;

  // Command injection - user input in shell command
  const command = `cat /tmp/${filename}.${format} > /tmp/export_${filename}.${format}`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      res.status(500).send(`Error: ${error.message}`);
      return;
    }
    res.send(`Data exported to: export_${filename}.${format}`);
  });
});

// VULNERABILITY: Path Traversal
app.get('/download', (req, res) => {
  const file = req.query.file;

  // No validation - allows path traversal
  const filePath = path.join(__dirname, 'files', file);

  res.sendFile(filePath);
});

// VULNERABILITY: Using eval() - Remote Code Execution
app.post('/calculate', (req, res) => {
  const { expression } = req.body;

  try {
    // CRITICAL: eval() allows arbitrary code execution
    const result = eval(expression);
    res.json({ result: result });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// VULNERABILITY: ReDoS - Regular Expression Denial of Service
app.post('/validate-email', (req, res) => {
  const { email } = req.body;

  // Catastrophic backtracking regex
  const emailRegex = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;

  const isValid = emailRegex.test(email);
  res.json({ valid: isValid });
});

// VULNERABILITY: IDOR - Insecure Direct Object Reference
app.get('/account/:id', (req, res) => {
  const accountId = req.params.id;

  // No authorization check - any user can access any account
  const user = users.find(u => u.id == accountId);

  if (user) {
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      ssn: user.ssn,
      creditCard: user.creditCard,
      balance: user.balance
    });
  } else {
    res.status(404).json({ error: 'Account not found' });
  }
});

// VULNERABILITY: Mass Assignment
app.post('/update-profile', (req, res) => {
  const userId = req.session?.user?.id;

  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const user = users.find(u => u.id === userId);

  // Mass assignment - allows updating any field including 'role', 'balance'
  Object.assign(user, req.body);

  res.json({ success: true, user: user });
});

// VULNERABILITY: XML External Entity (XXE) - if XML parsing was added
app.post('/parse-xml', (req, res) => {
  // Placeholder for XXE vulnerability
  res.send('XML parsing endpoint');
});

// VULNERABILITY: Insecure Deserialization
app.post('/deserialize', (req, res) => {
  const { data } = req.body;

  try {
    // Using lodash template which can lead to RCE
    const template = _.template(data);
    const result = template();
    res.send(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// VULNERABILITY: Server-Side Request Forgery (SSRF)
app.post('/fetch-url', (req, res) => {
  const { url } = req.body;

  // No validation - allows internal network scanning
  axios.get(url)
    .then(response => {
      res.json({ data: response.data });
    })
    .catch(error => {
      res.status(500).json({ error: error.message });
    });
});

// VULNERABILITY: Unvalidated Redirects
app.get('/redirect', (req, res) => {
  const { url } = req.query;

  // No validation of redirect URL
  res.redirect(url);
});

// VULNERABILITY: Information Disclosure
app.get('/debug', (req, res) => {
  res.json({
    environment: process.env,
    users: users,
    sessions: req.session,
    secrets: {
      jwtSecret: process.env.JWT_SECRET,
      awsKey: process.env.AWS_ACCESS_KEY_ID,
      awsSecret: process.env.AWS_SECRET_ACCESS_KEY,
      dbPassword: process.env.DATABASE_PASSWORD
    }
  });
});

// Admin panel - No proper authentication
app.get('/admin', (req, res) => {
  // VULNERABILITY: Weak authentication check
  if (req.query.admin === 'true') {
    res.send(`
      <h1>Admin Panel</h1>
      <p>All Users: ${JSON.stringify(users)}</p>
      <p>All Transactions: ${JSON.stringify(transactions)}</p>
      <form action="/admin/delete-user" method="POST">
        <input name="userId" placeholder="User ID to delete">
        <button>Delete User</button>
      </form>
    `);
  } else {
    res.status(403).send('Access denied');
  }
});

// Helper function - sends PII to third parties
function sendToAnalytics(data) {
  console.log('Sending to analytics:', data);
  // VULNERABILITY: Sending PII to external service
  // In real app, this would send SSN, credit cards to Google Analytics, etc.
}

// Banking routes
const bankingRoutes = require('./routes/banking');
const userRoutes = require('./routes/users');
app.use('/banking', bankingRoutes);
app.use('/users', userRoutes);

// Error handler - Information leakage
app.use((err, req, res, next) => {
  console.error('Error:', err);

  // VULNERABILITY: Exposing stack traces and sensitive error info
  res.status(500).json({
    error: err.message,
    stack: err.stack,
    details: err
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Banking application running on port ${PORT}`);
  console.log(`AWS Credentials: ${process.env.AWS_ACCESS_KEY_ID}`);
  console.log(`Database Password: ${process.env.DATABASE_PASSWORD}`);
  console.log(`JWT Secret: ${process.env.JWT_SECRET}`);
});

// Export for testing
module.exports = app;
