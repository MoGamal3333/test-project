# Security Testing Guide - Quick Reference

## 10 Tools That Will Trigger on This Application

### 1. npm audit (Built-in)
**What it finds:** Vulnerable Node.js dependencies
```bash
npm audit
npm audit --json > reports/npm-audit.json
```
**Expected findings:**
- express@4.17.1 vulnerabilities
- lodash@4.17.19 - Prototype Pollution (CVE-2020-8203)
- axios@0.21.1 - SSRF (CVE-2021-3749)
- jsonwebtoken@8.5.1 - Security issues
- 8-12 total vulnerabilities

### 2. Snyk
**What it finds:** Open source vulnerabilities with detailed remediation
```bash
npm install -g snyk
snyk auth
snyk test
```
**Expected findings:**
- All npm audit findings plus additional context
- Detailed CVE information
- Upgrade paths and patches

### 3. Semgrep (SAST)
**What it finds:** Code-level security vulnerabilities
```bash
pip install semgrep
semgrep --config=auto .
semgrep --config=p/security-audit .
semgrep --config=p/owasp-top-ten .
```
**Expected findings in app.js:**
- SQL Injection (lines ~65, ~85, ~90)
- Command Injection (line ~110)
- eval() usage (line ~135)
- Reflected XSS (line ~95)
- Path Traversal (line ~125)
- SSRF (line ~185)
- Hardcoded secrets
- 25-35 total issues

### 4. Gitleaks
**What it finds:** Secrets in git repository
```bash
# macOS/Linux
brew install gitleaks
# or download from https://github.com/gitleaks/gitleaks

gitleaks detect --source . --verbose
gitleaks detect --source . --report-path reports/gitleaks.json
```
**Expected findings:**
- AWS_ACCESS_KEY_ID in .env
- AWS_SECRET_ACCESS_KEY in .env
- Database passwords (multiple files)
- JWT secrets
- Stripe API keys
- SendGrid API keys
- Private keys (RSA, SSH)
- 20-30 secrets total

### 5. TruffleHog
**What it finds:** High entropy secrets and credentials
```bash
pip install truffleHog
trufflehog filesystem . --json
trufflehog git file://. --json
```
**Expected findings:**
- Same secrets as Gitleaks
- High entropy strings
- API keys across all files
- 15-25 secrets

### 6. Trivy (Container Security)
**What it finds:** Container vulnerabilities and IaC issues
```bash
# Install Trivy
brew install aquasecurity/trivy/trivy
# or from https://aquasecurity.github.io/trivy/

# Scan configurations
trivy config Dockerfile
trivy config docker-compose.yml
trivy config .

# Build and scan image
docker build -t vulnerable-banking:latest .
trivy image vulnerable-banking:latest
```
**Expected findings:**
- Dockerfile: Running as root, outdated base, hardcoded secrets
- docker-compose.yml: Privileged containers, host network
- Image vulnerabilities: 40-60 total issues

### 7. Checkov (IaC Security)
**What it finds:** Infrastructure as Code misconfigurations
```bash
pip install checkov

# Scan everything
checkov -d .

# Scan specific files
checkov -f Dockerfile
checkov -f docker-compose.yml
checkov -d kubernetes/
checkov -d terraform/
```
**Expected findings:**

**Dockerfile (15-20 checks fail):**
- CIS-DI-0001: Running as root
- CIS-DI-0002: USER not set
- CIS-DI-0005: Using :latest tag
- CIS-DI-0006: No HEALTHCHECK
- Hardcoded secrets in ENV

**Kubernetes (30-40 checks fail):**
- CKV_K8S_8: No liveness probe
- CKV_K8S_9: No readiness probe
- CKV_K8S_14: Running as root
- CKV_K8S_20: Privileged container
- CKV_K8S_22: No resource limits
- CKV_K8S_28: Docker socket mounted
- CKV_K8S_40: Service account token automount

**Terraform (30-40 checks fail):**
- CKV_AWS_18: S3 logging not enabled
- CKV_AWS_19: S3 encryption disabled
- CKV_AWS_21: S3 versioning disabled
- CKV_AWS_16: RDS publicly accessible
- CKV_AWS_17: RDS not encrypted
- CKV_AWS_23: Security group allows 0.0.0.0/0
- CKV_AWS_41: IAM policy too permissive

**Total: 70-90 IaC issues**

### 8. OWASP Dependency-Check
**What it finds:** Known vulnerabilities in dependencies
```bash
# Download from https://owasp.org/www-project-dependency-check/
dependency-check --project "Vulnerable Banking" --scan . --format JSON --format HTML
```
**Expected findings:**
- CVE matches for all vulnerable dependencies
- 10-15 findings with detailed CVE info

### 9. Bandit (Python - Bonus)
**What it finds:** Python security issues
```bash
pip install bandit
bandit -r .
```
**Expected findings:**
- While this is a Node.js app, if any Python scripts exist
- Can demonstrate multi-language security scanning

### 10. Safety (Python Dependencies - Bonus)
**What it finds:** Vulnerable Python packages
```bash
pip install safety
safety check
```
**Note:** Primarily for Python projects, included for completeness

## Running All Scans at Once

Use the provided script:
```bash
./run-all-scans.sh
```

This will:
1. Create a `reports/` directory
2. Run all 10+ security tools
3. Save JSON reports for each tool
4. Display summary of findings

## Expected Total Findings Summary

| Tool | Category | Expected Findings |
|------|----------|------------------|
| npm audit | Dependencies | 8-12 |
| Snyk | Dependencies | 10-15 |
| Semgrep | Code (SAST) | 25-35 |
| Gitleaks | Secrets | 20-30 |
| TruffleHog | Secrets | 15-25 |
| Trivy | Containers | 40-60 |
| Checkov | IaC | 70-90 |
| OWASP DC | Dependencies | 10-15 |
| **TOTAL** | **All Categories** | **200-280** |

## Vulnerability Types Present

### OWASP Top 10 (2021) - ALL 10 PRESENT

1. **A01 - Broken Access Control**
   - Files: `routes/banking.js`, `routes/users.js`, `app.js`
   - IDOR, missing authorization, privilege escalation

2. **A02 - Cryptographic Failures**
   - Files: `.env`, `config/database.js`, `models/User.js`
   - Hardcoded secrets, weak encryption, plain text passwords

3. **A03 - Injection**
   - Files: `app.js`, `routes/banking.js`
   - SQL injection, command injection, eval(), template injection

4. **A04 - Insecure Design**
   - Files: All
   - No rate limiting, no CSRF protection, predictable IDs

5. **A05 - Security Misconfiguration**
   - Files: `Dockerfile`, `docker-compose.yml`, `kubernetes/`
   - Running as root, missing headers, default credentials

6. **A06 - Vulnerable Components**
   - Files: `package.json`
   - Outdated dependencies with known CVEs

7. **A07 - Authentication Failures**
   - Files: `app.js`, `routes/users.js`
   - Weak password reset, no MFA, session issues

8. **A08 - Software and Data Integrity**
   - Files: `app.js`
   - Insecure deserialization, mass assignment

9. **A09 - Security Logging Failures**
   - Files: `app.js`, `routes/banking.js`
   - Logging sensitive data (passwords, SSNs, credit cards)

10. **A10 - SSRF**
    - Files: `app.js`
    - Unvalidated URL fetching

## Installation Prerequisites

### Required Tools
```bash
# Node.js and npm (required)
node --version  # Should be v14+
npm --version

# Python and pip (for some tools)
python3 --version
pip3 --version

# Install security tools
npm install -g snyk
pip install semgrep checkov truffleHog bandit safety

# Install Gitleaks
brew install gitleaks
# or download from: https://github.com/gitleaks/gitleaks/releases

# Install Trivy
brew install aquasecurity/trivy/trivy
# or download from: https://aquasecurity.github.io/trivy/

# Install OWASP Dependency Check
# Download from: https://owasp.org/www-project-dependency-check/
```

### Docker (for container scanning)
```bash
docker --version
docker-compose --version
```

## Testing Individual Vulnerabilities

### SQL Injection
```bash
# Start the app
npm start

# Test SQL injection in login
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin'\'' OR '\''1'\''='\''1","password":"anything"}'

# Test SQL injection in search
curl "http://localhost:3000/search?q=test' OR '1'='1"
```

### Command Injection
```bash
curl -X POST http://localhost:3000/export-data \
  -H "Content-Type: application/json" \
  -d '{"filename":"data; ls -la", "format":"csv"}'
```

### XSS (Reflected)
```bash
curl "http://localhost:3000/search?q=<script>alert('XSS')</script>"
```

### Path Traversal
```bash
curl "http://localhost:3000/download?file=../../etc/passwd"
```

### Code Injection (eval)
```bash
curl -X POST http://localhost:3000/calculate \
  -H "Content-Type: application/json" \
  -d '{"expression":"process.exit()"}'
```

### IDOR
```bash
# Access any user's account
curl http://localhost:3000/account/1
curl http://localhost:3000/account/2
```

### SSRF
```bash
curl -X POST http://localhost:3000/fetch-url \
  -H "Content-Type: application/json" \
  -d '{"url":"http://169.254.169.254/latest/meta-data/"}'
```

## File-by-File Vulnerability Map

### High Severity Files

1. **`.env`** - CRITICAL
   - 10+ hardcoded secrets
   - AWS keys, database passwords, API keys
   - Tools: Gitleaks, TruffleHog

2. **`config/database.js`** - CRITICAL
   - 15+ hardcoded credentials
   - Private keys, admin passwords
   - Tools: Gitleaks, TruffleHog, Semgrep

3. **`app.js`** - CRITICAL
   - SQL injection (3 locations)
   - Command injection
   - eval() usage
   - XSS, SSRF, Path Traversal
   - Tools: Semgrep, Snyk Code

4. **`package.json`** - HIGH
   - 8-12 vulnerable dependencies
   - Tools: npm audit, Snyk, OWASP DC

5. **`Dockerfile`** - HIGH
   - Running as root
   - Hardcoded secrets
   - Outdated base image
   - Tools: Trivy, Checkov

6. **`docker-compose.yml`** - CRITICAL
   - Privileged containers
   - Docker socket mounted
   - Host network mode
   - Tools: Trivy, Checkov

7. **`kubernetes/deployment.yaml`** - CRITICAL
   - 30+ misconfigurations
   - Running as root, privileged
   - No resource limits
   - Tools: Checkov, Trivy

8. **`terraform/main.tf`** - CRITICAL
   - Public S3 buckets
   - RDS publicly accessible
   - Hardcoded AWS credentials
   - Security group 0.0.0.0/0
   - Tools: Checkov, Trivy

## CI/CD Integration

Add to `.github/workflows/security.yml`:
```yaml
name: Security Scans
on: [push, pull_request]
jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: npm audit
        run: npm audit
      - name: Snyk
        run: npx snyk test
      - name: Semgrep
        run: semgrep --config=auto .
      - name: Gitleaks
        run: gitleaks detect --source .
      - name: Trivy
        run: trivy fs .
      - name: Checkov
        run: checkov -d .
```

## Remediation Priorities

### Priority 1 - CRITICAL (Fix Immediately)
- Remove all hardcoded secrets (`.env`, `config/database.js`)
- Fix SQL injection (use parameterized queries)
- Remove eval() usage
- Fix command injection
- Update vulnerable dependencies

### Priority 2 - HIGH (Fix Soon)
- Implement proper authentication/authorization
- Add input validation and sanitization
- Fix container security (run as non-root)
- Fix IaC misconfigurations
- Implement security headers

### Priority 3 - MEDIUM (Fix Eventually)
- Add rate limiting
- Implement CSRF protection
- Add proper logging (without sensitive data)
- Implement MFA
- Add monitoring and alerting

## Additional Resources

- OWASP Top 10: https://owasp.org/Top10/
- CWE Top 25: https://cwe.mitre.org/top25/
- Docker CIS Benchmarks: https://www.cisecurity.org/benchmark/docker
- Kubernetes CIS Benchmarks: https://www.cisecurity.org/benchmark/kubernetes
- Terraform Security Best Practices: https://www.terraform.io/docs/cloud/guides/recommended-practices/

## Support

This is a training application. For questions:
1. Check the main README.md
2. Review tool documentation
3. Search for CVE numbers in NVD database
