#!/bin/bash

# Comprehensive Security Scan Script for Vulnerable Banking Application
# This script runs all 10 security scanning tools

set -e

echo "======================================================="
echo "  Vulnerable Banking App - Security Scan Suite"
echo "======================================================="
echo ""

# Create reports directory
mkdir -p reports

echo "[1/10] Running npm audit (Dependency Vulnerabilities)..."
echo "-------------------------------------------------------"
npm audit || true
npm audit --json > reports/npm-audit.json 2>&1 || true
echo "✓ npm audit complete - results in reports/npm-audit.json"
echo ""

echo "[2/10] Running Snyk (Open Source Vulnerabilities)..."
echo "-------------------------------------------------------"
if command -v snyk &> /dev/null; then
    snyk test --json > reports/snyk.json 2>&1 || true
    snyk test || true
    echo "✓ Snyk complete - results in reports/snyk.json"
else
    echo "⚠ Snyk not installed. Install: npm install -g snyk"
fi
echo ""

echo "[3/10] Running Semgrep (SAST Code Analysis)..."
echo "-------------------------------------------------------"
if command -v semgrep &> /dev/null; then
    semgrep --config=auto . --json > reports/semgrep.json 2>&1 || true
    semgrep --config=p/security-audit . || true
    semgrep --config=p/owasp-top-ten . || true
    echo "✓ Semgrep complete - results in reports/semgrep.json"
else
    echo "⚠ Semgrep not installed. Install: pip install semgrep"
fi
echo ""

echo "[4/10] Running Gitleaks (Secret Detection)..."
echo "-------------------------------------------------------"
if command -v gitleaks &> /dev/null; then
    gitleaks detect --source . --verbose --report-path reports/gitleaks.json || true
    gitleaks detect --source . --log-opts="--all" || true
    echo "✓ Gitleaks complete - results in reports/gitleaks.json"
else
    echo "⚠ Gitleaks not installed. Install from: https://github.com/gitleaks/gitleaks"
fi
echo ""

echo "[5/10] Running TruffleHog (Secret Scanning)..."
echo "-------------------------------------------------------"
if command -v trufflehog &> /dev/null; then
    trufflehog filesystem . --json > reports/trufflehog.json 2>&1 || true
    trufflehog git file://. --json >> reports/trufflehog-git.json 2>&1 || true
    echo "✓ TruffleHog complete - results in reports/trufflehog.json"
else
    echo "⚠ TruffleHog not installed. Install: pip install truffleHog"
fi
echo ""

echo "[6/10] Running Trivy (Container Vulnerabilities)..."
echo "-------------------------------------------------------"
if command -v trivy &> /dev/null; then
    # Scan Dockerfile
    trivy config Dockerfile --format json > reports/trivy-dockerfile.json 2>&1 || true

    # Scan docker-compose
    trivy config docker-compose.yml --format json > reports/trivy-compose.json 2>&1 || true

    # Build and scan Docker image
    echo "Building Docker image..."
    docker build -t vulnerable-banking:latest . || true
    trivy image vulnerable-banking:latest --format json > reports/trivy-image.json 2>&1 || true
    trivy image vulnerable-banking:latest --severity HIGH,CRITICAL || true

    echo "✓ Trivy complete - results in reports/trivy-*.json"
else
    echo "⚠ Trivy not installed. Install from: https://aquasecurity.github.io/trivy/"
fi
echo ""

echo "[7/10] Running Checkov (IaC Security - Dockerfile)..."
echo "-------------------------------------------------------"
if command -v checkov &> /dev/null; then
    checkov -f Dockerfile --output json > reports/checkov-dockerfile.json 2>&1 || true
    checkov -f Dockerfile || true
    echo "✓ Checkov Dockerfile scan complete"
else
    echo "⚠ Checkov not installed. Install: pip install checkov"
fi
echo ""

echo "[8/10] Running Checkov (IaC Security - Docker Compose)..."
echo "-------------------------------------------------------"
if command -v checkov &> /dev/null; then
    checkov -f docker-compose.yml --output json > reports/checkov-compose.json 2>&1 || true
    checkov -f docker-compose.yml || true
    echo "✓ Checkov Docker Compose scan complete"
fi
echo ""

echo "[9/10] Running Checkov (IaC Security - Kubernetes)..."
echo "-------------------------------------------------------"
if command -v checkov &> /dev/null; then
    checkov -d kubernetes/ --output json > reports/checkov-k8s.json 2>&1 || true
    checkov -d kubernetes/ || true
    echo "✓ Checkov Kubernetes scan complete"
fi
echo ""

echo "[10/10] Running Checkov (IaC Security - Terraform)..."
echo "-------------------------------------------------------"
if command -v checkov &> /dev/null; then
    checkov -d terraform/ --output json > reports/checkov-terraform.json 2>&1 || true
    checkov -d terraform/ || true
    echo "✓ Checkov Terraform scan complete"
fi
echo ""

echo "BONUS: Running OWASP Dependency Check..."
echo "-------------------------------------------------------"
if command -v dependency-check &> /dev/null; then
    dependency-check --project "Vulnerable Banking App" --scan . --format JSON --format HTML --out reports/ || true
    echo "✓ OWASP Dependency Check complete - results in reports/"
else
    echo "⚠ OWASP Dependency Check not installed"
fi
echo ""

echo "BONUS: Running Bandit (Python Security - if applicable)..."
echo "-------------------------------------------------------"
if command -v bandit &> /dev/null; then
    bandit -r . -f json -o reports/bandit.json 2>&1 || true
    echo "✓ Bandit scan complete"
else
    echo "⚠ Bandit not installed. Install: pip install bandit"
fi
echo ""

echo "======================================================="
echo "  All Security Scans Complete!"
echo "======================================================="
echo ""
echo "Summary of Results:"
echo "-------------------"
echo "📁 All reports saved in: ./reports/"
echo ""
echo "Individual Reports:"
echo "  1. npm-audit.json          - Dependency vulnerabilities"
echo "  2. snyk.json               - Open source vulnerabilities"
echo "  3. semgrep.json            - SAST findings"
echo "  4. gitleaks.json           - Secret detection"
echo "  5. trufflehog.json         - Secret scanning"
echo "  6. trivy-*.json            - Container vulnerabilities"
echo "  7. checkov-*.json          - IaC security issues"
echo "  8. dependency-check/       - OWASP dependency findings"
echo ""
echo "Expected Findings:"
echo "  • 8-12 vulnerable npm packages"
echo "  • 20-30 hardcoded secrets"
echo "  • 25-35 code vulnerabilities"
echo "  • 70-90 IaC misconfigurations"
echo "  • 40-60 container issues"
echo ""
echo "Total Expected Issues: 200+ across all tools"
echo ""
echo "Review the reports/ directory for detailed findings."
echo "======================================================="
