# Vulnerable Banking Application - Security Testing Project

## DISCLAIMER
This is a **deliberately vulnerable** application created for security testing and training purposes. **DO NOT** deploy this application in production or expose it to the internet. It contains numerous critical security vulnerabilities.

## Overview
This Node.js Express application simulates a banking system with intentional security vulnerabilities designed to trigger all 10 security scanning tools:

1. **npm audit** - Vulnerable dependencies
2. **Snyk** - Open source vulnerabilities
3. **Bandit** - Python security issues (if Python files present)
4. **Semgrep** - SAST code analysis
5. **Gitleaks** - Secret detection in git
6. **TruffleHog** - Secret scanning
7. **Trivy** - Container vulnerabilities
8. **Checkov** - IaC security
9. **OWASP Dependency Check** - Dependency vulnerabilities
10. **Safety** - Python dependency checker (if applicable)

## Architecture

```
test-project/
├── app.js                      # Main Express application (multiple vulnerabilities)
├── package.json                # Vulnerable old dependencies
├── .env                        # Hardcoded secrets (AWS, DB, API keys)
├── config/
│   └── database.js             # More hardcoded credentials
├── routes/
│   ├── banking.js              # Banking-specific vulnerabilities
│   └── users.js                # User management vulnerabilities
├── models/                     # Database models
├── Dockerfile                  # Vulnerable container config
├── docker-compose.yml          # Insecure orchestration
├── kubernetes/
│   ├── deployment.yaml         # K8s misconfigurations
│   └── service.yaml            # K8s service config
└── terraform/
    ├── main.tf                 # IaC security issues
    └── variables.tf            # Terraform variables
```

## Installation

```bash
# Clone or navigate to project
cd /Users/user/SecurityAgent/test-project

# Install dependencies (vulnerable versions)
npm install

# Run the application
npm start
```

The application will start on http://localhost:3000

## Vulnerabilities by Category

### 1. Dependency Vulnerabilities (npm audit, Snyk, OWASP Dependency Check)
**Tools triggered:** npm audit, Snyk, OWASP Dependency Check

- **express@4.17.1** - Known vulnerabilities
- **lodash@4.17.19** - Prototype pollution (CVE-2020-8203)
- **jsonwebtoken@8.5.1** - Security issues in old versions
- **axios@0.21.1** - SSRF vulnerability (CVE-2021-3749)
- **mongoose@5.12.0** - Old version with issues
- **ejs@3.1.5** - Template injection vulnerabilities

**How to detect:**
```bash
# npm audit
npm audit

# Snyk
snyk test

# OWASP Dependency Check
dependency-check --project "Banking App" --scan .
```

### 2. Code Vulnerabilities (Semgrep, Bandit)
**Tools triggered:** Semgrep, Bandit (for any Python scripts)

**In app.js:**
- **SQL Injection** (lines ~65, ~85) - User input directly in SQL queries
- **Command Injection** (line ~110) - `exec()` with unsanitized input
- **eval() usage** (line ~135) - Remote code execution risk
- **XSS** (lines ~90-100) - Reflected XSS in search endpoint
- **Path Traversal** (line ~125) - File download without validation
- **SSRF** (line ~185) - Unvalidated URL fetching
- **ReDoS** (line ~145) - Catastrophic backtracking regex
- **Insecure Deserialization** (line ~200) - lodash template injection
- **IDOR** (line ~160) - Direct object reference without auth
- **Mass Assignment** (line ~170) - Arbitrary field updates

**In routes/banking.js:**
- SQL injection in transaction history
- Missing authorization checks
- Balance manipulation via parameter tampering
- Account enumeration

**In routes/users.js:**
- User enumeration
- Password reset without verification
- Email enumeration
- Privilege escalation

**How to detect:**
```bash
# Semgrep
semgrep --config=auto .

# Bandit (if Python files exist)
bandit -r .
```

### 3. Hardcoded Secrets (Gitleaks, TruffleHog)
**Tools triggered:** Gitleaks, TruffleHog

**In .env:**
- AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
- AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
- DATABASE_PASSWORD=SuperSecret123!@#
- JWT_SECRET=my-super-secret-jwt-key-12345
- STRIPE_API_KEY=sk_live_51HxYz...
- SENDGRID_API_KEY=SG.1234567890...

**In config/database.js:**
- MySQL passwords
- MongoDB connection strings with passwords
- API keys (Stripe, SendGrid, Twilio, AWS)
- Private keys (RSA, SSH)
- Admin credentials

**In terraform/main.tf:**
- AWS credentials in provider block
- Hardcoded database passwords
- IAM access keys in outputs

**How to detect:**
```bash
# Gitleaks
gitleaks detect --source . --verbose

# TruffleHog
trufflehog filesystem . --json

# After git commit
git add .
git commit -m "Initial commit"
gitleaks detect --source . --log-opts="--all"
```

### 4. Container Vulnerabilities (Trivy)
**Tools triggered:** Trivy

**In Dockerfile:**
- Outdated base image (node:16)
- Using :latest tag
- Running as root (USER root)
- Hardcoded secrets in ENV
- No HEALTHCHECK
- Exposing unnecessary ports (22, 3306, 27017, 6379)
- No security updates

**In docker-compose.yml:**
- Privileged containers
- Host network mode
- Mounted /var/run/docker.sock (container escape)
- Hardcoded secrets in environment
- No resource limits

**How to detect:**
```bash
# Trivy - scan Dockerfile
trivy config .

# Build and scan image
docker build -t vulnerable-banking:latest .
trivy image vulnerable-banking:latest

# Scan docker-compose
trivy config docker-compose.yml
```

### 5. Infrastructure as Code (Checkov)
**Tools triggered:** Checkov

**In kubernetes/deployment.yaml:**
- hostNetwork: true
- hostPID: true
- privileged: true
- runAsUser: 0 (root)
- No resource limits
- No readiness/liveness probes
- Hardcoded secrets in env vars
- Mounting /var/run/docker.sock
- Mounting host root filesystem
- Using :latest tag
- capabilities: add: ALL

**In terraform/main.tf:**
- S3 bucket with public-read ACL
- No S3 encryption
- RDS publicly accessible
- RDS without encryption
- Hardcoded credentials
- Security group allowing 0.0.0.0/0
- No backup retention
- ELB without HTTPS
- Unencrypted EBS volumes
- IAM policy with * permissions

**How to detect:**
```bash
# Checkov - scan all IaC
checkov -d .

# Scan specific files
checkov -f Dockerfile
checkov -f docker-compose.yml
checkov -f kubernetes/deployment.yaml
checkov -f terraform/main.tf

# Detailed output
checkov -d . --framework kubernetes --framework terraform --framework dockerfile
```

## Expected Security Findings

### Tool #1: npm audit
```
# Known vulnerabilities
found 8 vulnerabilities (3 moderate, 5 high)
```

### Tool #2: Snyk
```
Tested 14 dependencies for known issues, found 8 issues
- lodash: Prototype Pollution
- axios: Server-Side Request Forgery
- ejs: Arbitrary Code Execution
```

### Tool #3: Semgrep
```
- SQL Injection detected (app.js:65, banking.js:45)
- Command Injection (app.js:110)
- eval() usage - RCE risk (app.js:135)
- Hardcoded secrets (multiple files)
- Missing authentication checks
```

### Tool #4: Gitleaks
```
Finding:     AWS Access Key
Secret:      AKIAIOSFODNN7EXAMPLE
File:        .env
Line:        2

Finding:     AWS Secret Key
Secret:      wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
File:        .env
Line:        3

... (20+ findings expected)
```

### Tool #5: TruffleHog
```
- AWS keys in .env
- Database passwords in config/database.js
- Private keys in config files
- API keys in terraform files
```

### Tool #6: Trivy
```
Dockerfile (dockerfile)
=======================
CRITICAL: User root specified (CIS-DI-0002)
HIGH: Healthcheck not set (CIS-DI-0006)
HIGH: Latest tag used (CIS-DI-0005)

docker-compose.yml (yaml)
=========================
HIGH: Container running in privileged mode
HIGH: Host network mode used
CRITICAL: Docker socket mounted
```

### Tool #7: Checkov (Kubernetes)
```
kubernetes/deployment.yaml
==========================
FAILED: CKV_K8S_8 - Liveness probe not set
FAILED: CKV_K8S_9 - Readiness probe not set
FAILED: CKV_K8S_14 - Containers run as root
FAILED: CKV_K8S_20 - Containers should not run privileged
FAILED: CKV_K8S_22 - No resource limits set
FAILED: CKV_K8S_28 - Docker socket mounted
FAILED: CKV_K8S_40 - No service account token automount disabled

... (30+ K8s checks expected to fail)
```

### Tool #8: Checkov (Terraform)
```
terraform/main.tf
=================
FAILED: CKV_AWS_18 - S3 bucket logging not enabled
FAILED: CKV_AWS_19 - S3 bucket encryption not enabled
FAILED: CKV_AWS_21 - S3 bucket versioning not enabled
FAILED: CKV_AWS_16 - RDS is publicly accessible
FAILED: CKV_AWS_17 - RDS storage not encrypted
FAILED: CKV_AWS_23 - Security group allows ingress from 0.0.0.0/0
FAILED: CKV_AWS_41 - IAM policy grants full permissions

... (40+ Terraform checks expected to fail)
```

### Tool #9: OWASP Dependency Check
```
Medium severity vulnerabilities found in:
- express@4.17.1
- lodash@4.17.19
- axios@0.21.1

High severity vulnerabilities found in:
- jsonwebtoken@8.5.1
- ejs@3.1.5
```

### Tool #10: Bandit/Safety (if applicable)
```
# If Python files added, Bandit would flag:
- Hardcoded passwords
- Use of exec()
- SQL injection patterns
```

## Running Security Scans

### 1. Dependency Scanning
```bash
# npm audit
npm audit
npm audit --json > npm-audit-results.json

# Snyk
snyk auth
snyk test
snyk test --json > snyk-results.json

# OWASP Dependency Check
dependency-check --project "Vulnerable Banking" --scan . --format ALL
```

### 2. Secret Scanning
```bash
# Initialize git first
git init
git add .
git commit -m "Initial vulnerable commit"

# Gitleaks
gitleaks detect --source . --verbose
gitleaks detect --source . --report-path gitleaks-report.json

# TruffleHog
trufflehog filesystem . --json > trufflehog-results.json
trufflehog git file://. --json
```

### 3. SAST Scanning
```bash
# Semgrep
semgrep --config=auto . --json > semgrep-results.json
semgrep --config=p/security-audit .
semgrep --config=p/owasp-top-ten .

# Bandit (if Python)
bandit -r . -f json -o bandit-results.json
```

### 4. Container Scanning
```bash
# Build image
docker build -t vulnerable-banking:latest .

# Trivy - scan image
trivy image vulnerable-banking:latest
trivy image --severity HIGH,CRITICAL vulnerable-banking:latest

# Trivy - scan Dockerfile
trivy config Dockerfile
trivy config docker-compose.yml
```

### 5. IaC Scanning
```bash
# Checkov - comprehensive scan
checkov -d . --output json > checkov-results.json

# Checkov - by framework
checkov --framework dockerfile -f Dockerfile
checkov --framework docker_compose -f docker-compose.yml
checkov --framework kubernetes -d kubernetes/
checkov --framework terraform -d terraform/

# Checkov - compact output
checkov -d . --compact --quiet
```

## Vulnerability Categories Present

### OWASP Top 10 (2021)
1. **A01:2021 - Broken Access Control**
   - IDOR in /account/:id
   - Missing authorization checks
   - Privilege escalation endpoint

2. **A02:2021 - Cryptographic Failures**
   - Plain text passwords stored
   - Weak JWT secrets
   - No encryption for sensitive data
   - Hardcoded encryption keys

3. **A03:2021 - Injection**
   - SQL injection (login, search, transactions)
   - Command injection (export-data)
   - eval() usage (calculate endpoint)
   - Template injection (lodash)

4. **A04:2021 - Insecure Design**
   - No rate limiting
   - No CSRF protection
   - Predictable account numbers
   - No security controls

5. **A05:2021 - Security Misconfiguration**
   - Missing security headers
   - Detailed error messages
   - Default credentials
   - Unnecessary ports exposed

6. **A06:2021 - Vulnerable Components**
   - Old Express version
   - Vulnerable lodash
   - Outdated axios
   - Old jsonwebtoken

7. **A07:2021 - Authentication Failures**
   - Weak password reset
   - No MFA
   - Session fixation
   - Weak session management

8. **A08:2021 - Software and Data Integrity**
   - No integrity checks
   - Insecure deserialization
   - Mass assignment

9. **A09:2021 - Security Logging Failures**
   - Logging sensitive data (passwords, SSNs)
   - No audit trail
   - Excessive logging

10. **A10:2021 - Server-Side Request Forgery (SSRF)**
    - Unvalidated URL fetching
    - No allow-list

### CWE (Common Weakness Enumeration)
- CWE-89: SQL Injection
- CWE-78: OS Command Injection
- CWE-79: Cross-site Scripting (XSS)
- CWE-94: Code Injection (eval)
- CWE-22: Path Traversal
- CWE-918: SSRF
- CWE-798: Hardcoded Credentials
- CWE-759: Password in Configuration File
- CWE-732: Incorrect Permission Assignment
- CWE-250: Running with Unnecessary Privileges

## Testing the Vulnerabilities

### SQL Injection
```bash
# Login bypass
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin'\'' OR '\''1'\''='\''1","password":"anything"}'

# Search injection
curl "http://localhost:3000/search?q=test' OR '1'='1"
```

### Command Injection
```bash
curl -X POST http://localhost:3000/export-data \
  -H "Content-Type: application/json" \
  -d '{"filename":"data; ls -la", "format":"csv"}'
```

### XSS
```bash
# Reflected XSS
curl "http://localhost:3000/search?q=<script>alert('XSS')</script>"
```

### Path Traversal
```bash
curl "http://localhost:3000/download?file=../../etc/passwd"
```

### Code Injection
```bash
curl -X POST http://localhost:3000/calculate \
  -H "Content-Type: application/json" \
  -d '{"expression":"require('\''child_process'\'').exec('\''whoami'\'')"}'
```

## Comprehensive Security Scan Script

Create a file `run-all-scans.sh`:

```bash
#!/bin/bash

echo "=== Running All Security Scans ==="

echo "\n1. NPM Audit..."
npm audit --json > reports/npm-audit.json

echo "\n2. Snyk..."
snyk test --json > reports/snyk.json

echo "\n3. Semgrep..."
semgrep --config=auto . --json > reports/semgrep.json

echo "\n4. Gitleaks..."
gitleaks detect --source . --report-path reports/gitleaks.json

echo "\n5. TruffleHog..."
trufflehog filesystem . --json > reports/trufflehog.json

echo "\n6. Trivy Container..."
docker build -t vulnerable-banking:latest .
trivy image vulnerable-banking:latest --format json > reports/trivy-image.json

echo "\n7. Trivy IaC..."
trivy config . --format json > reports/trivy-config.json

echo "\n8. Checkov..."
checkov -d . --output json > reports/checkov.json

echo "\n9. OWASP Dependency Check..."
dependency-check --project "Vulnerable Banking" --scan . --format JSON --out reports/

echo "\n=== All scans complete! Check reports/ directory ==="
```

## Expected Total Findings

When running all security tools, expect approximately:

- **npm audit**: 8-12 vulnerable packages
- **Snyk**: 8-15 vulnerabilities
- **Semgrep**: 25-35 code issues
- **Gitleaks**: 20-30 secrets found
- **TruffleHog**: 15-25 secrets found
- **Trivy**: 40-60 vulnerabilities (image + config)
- **Checkov**: 70-90 IaC misconfigurations
- **OWASP DC**: 10-15 dependency issues

**Total: 200+ security findings across all tools**

## Remediation Guide

This application is for testing only. To fix these vulnerabilities in a real application:

1. **Update dependencies** to latest secure versions
2. **Use parameterized queries** instead of string concatenation
3. **Validate and sanitize** all user input
4. **Never use eval()** or similar dynamic code execution
5. **Use environment variables** for secrets, never commit them
6. **Implement proper authentication** and authorization
7. **Add security headers** (CSP, HSTS, X-Frame-Options)
8. **Use HTTPS** everywhere
9. **Implement rate limiting** and CSRF protection
10. **Run containers as non-root** with minimal privileges
11. **Enable encryption** for data at rest and in transit
12. **Follow least privilege** principle for IAM/RBAC
13. **Enable logging and monitoring** (without logging sensitive data)
14. **Regular security scanning** in CI/CD pipeline

## License

This project is for educational purposes only. Use at your own risk.

## Support

For questions about security testing with this application, refer to the documentation for each scanning tool.
