const mysql = require('mysql');
const mongoose = require('mongoose');

// HARDCODED DATABASE CREDENTIALS
const dbConfig = {
  mysql: {
    host: 'production-db.company.com',
    user: 'banking_admin',
    password: 'Prod_DB_P@ssw0rd_2024!',  // VULNERABILITY: Hardcoded password
    database: 'banking_production',
    port: 3306,
    multipleStatements: true  // VULNERABILITY: Allows SQL injection to execute multiple queries
  },

  mongodb: {
    // VULNERABILITY: Connection string with embedded credentials
    uri: 'mongodb://admin:SuperSecretMongoP@ss123!@cluster0.mongodb.net/banking?retryWrites=true&w=majority',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      user: 'admin',
      pass: 'SuperSecretMongoP@ss123!'
    }
  },

  redis: {
    host: 'redis-prod.company.com',
    port: 6379,
    password: 'Redis_Prod_Pass_9876!',  // VULNERABILITY: Hardcoded password
    db: 0
  }
};

// API Keys embedded in code
const apiKeys = {
  stripeSecretKey: 'TEST_STRIPE_SECRET_KEY_DO_NOT_USE_IN_PRODUCTION',
  stripePublishableKey: 'pk_live_51HxYz2ABCdefghijk1234567890',
  sendgridApiKey: 'SG.1234567890abcdefghijklmnopqrstuvwxyz.ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890',
  twilioAccountSid: 'AC1234567890abcdefghijklmnopqrstuv',
  twilioAuthToken: '1234567890abcdef1234567890abcdef',
  awsAccessKeyId: 'AKIAIOSFODNN7EXAMPLE',
  awsSecretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
  googleApiKey: 'AIzaSyD1234567890abcdefghijklmnopqrstuv',
  facebookAppSecret: '1234567890abcdef1234567890abcdef'
};

// JWT Configuration with weak secret
const jwtConfig = {
  secret: 'banking-jwt-secret-key-12345',  // VULNERABILITY: Weak secret
  expiresIn: '7d',
  algorithm: 'HS256'
};

// Encryption keys hardcoded
const encryptionKeys = {
  aes256Key: 'AES256EncryptionKey12345678901234',  // VULNERABILITY: Hardcoded encryption key
  initVector: '1234567890123456',
  masterKey: 'MASTER_ENCRYPTION_KEY_PROD_2024_DO_NOT_SHARE'
};

// Database connection function
function connectMySQL() {
  const connection = mysql.createConnection(dbConfig.mysql);

  connection.connect((err) => {
    if (err) {
      console.error('MySQL connection error:', err);
      // VULNERABILITY: Logging sensitive connection details
      console.error('Failed to connect with:', dbConfig.mysql);
      return;
    }
    console.log('Connected to MySQL database');
    console.log('Connection details:', dbConfig.mysql);  // VULNERABILITY: Logging credentials
  });

  return connection;
}

// MongoDB connection
function connectMongoDB() {
  mongoose.connect(dbConfig.mongodb.uri, dbConfig.mongodb.options)
    .then(() => {
      console.log('Connected to MongoDB');
      // VULNERABILITY: Logging connection string with password
      console.log('MongoDB URI:', dbConfig.mongodb.uri);
    })
    .catch((err) => {
      console.error('MongoDB connection error:', err);
    });
}

// Raw SQL query function - VULNERABLE TO SQL INJECTION
function executeRawQuery(query, params) {
  const connection = connectMySQL();

  // VULNERABILITY: String concatenation instead of parameterized queries
  const fullQuery = query + ' ' + (params || '');

  return new Promise((resolve, reject) => {
    connection.query(fullQuery, (error, results) => {
      if (error) {
        console.error('Query error:', error);
        console.error('Failed query:', fullQuery);  // VULNERABILITY: Logging queries
        reject(error);
      } else {
        resolve(results);
      }
      connection.end();
    });
  });
}

// Admin credentials - HARDCODED
const adminCredentials = {
  username: 'admin',
  password: 'Admin123!@#Banking',
  email: 'admin@banking-corp.com',
  apiKey: 'admin-api-key-prod-2024',
  masterPassword: 'MasterAdminP@ss2024!'
};

// Third-party service credentials
const serviceCredentials = {
  // Payment processor
  plaidClientId: 'plaid_client_id_1234567890',
  plaidSecret: 'plaid_secret_1234567890abcdefghijk',
  plaidPublicKey: 'plaid_public_key_1234567890',

  // Email service
  mailgunApiKey: 'key-1234567890abcdefghijklmnopqrstuv',
  mailgunDomain: 'mg.banking-corp.com',

  // SMS service
  nexmoApiKey: 'nexmo_api_key_1234567890',
  nexmoApiSecret: 'nexmo_api_secret_abcdefghijk',

  // Analytics
  mixpanelToken: 'mixpanel_token_1234567890abcdefghij',
  segmentWriteKey: 'segment_write_key_1234567890abcdef'
};

// Private keys embedded in code
const privateKeys = {
  rsaPrivateKey: `-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMN
OPQRSTUVWXYZ1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQR
STUVWXYZ1234567890abcdefghijklmnopqrstuvwxyz
-----END RSA PRIVATE KEY-----`,

  sshPrivateKey: `-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAABFwAAAAdzc2gtcn
NhAAAAAwEAAQAAAQEA1234567890abcdefghijklmnopqrstuvwxyz
-----END OPENSSH PRIVATE KEY-----`
};

module.exports = {
  dbConfig,
  apiKeys,
  jwtConfig,
  encryptionKeys,
  adminCredentials,
  serviceCredentials,
  privateKeys,
  connectMySQL,
  connectMongoDB,
  executeRawQuery
};
