# VULNERABILITY: Using outdated base image with known vulnerabilities
FROM node:16

# VULNERABILITY: Using latest tag instead of specific version
FROM node:latest

# VULNERABILITY: Running as root user
USER root

# VULNERABILITY: Hardcoded secrets in environment variables
ENV AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
ENV AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
ENV DATABASE_PASSWORD=SuperSecret123
ENV JWT_SECRET=my-jwt-secret-key-12345
ENV ADMIN_PASSWORD=Admin123!@#

# VULNERABILITY: No security updates
# RUN apt-get update && apt-get upgrade -y

# Set working directory
WORKDIR /app

# VULNERABILITY: Copying everything including secrets
COPY . .

# VULNERABILITY: Installing dependencies as root
RUN npm install

# VULNERABILITY: Exposing unnecessary ports
EXPOSE 3000
EXPOSE 22
EXPOSE 3306
EXPOSE 27017
EXPOSE 6379

# VULNERABILITY: No healthcheck defined
# HEALTHCHECK --interval=30s --timeout=3s CMD curl -f http://localhost:3000/health || exit 1

# VULNERABILITY: Running application as root
# No USER directive to drop privileges

# VULNERABILITY: Using shell form instead of exec form
CMD npm start

# VULNERABILITY: No resource limits defined

# Security issues:
# 1. Outdated base image (node:16)
# 2. Using :latest tag
# 3. Running as root (USER root)
# 4. Hardcoded secrets in ENV variables
# 5. No HEALTHCHECK
# 6. Exposing unnecessary ports (SSH, MySQL, MongoDB, Redis)
# 7. No security updates
# 8. Copying all files including .env
# 9. No USER directive to run as non-root
# 10. Using shell form for CMD (should use exec form)
# 11. No resource constraints
# 12. No vulnerability scanning in build process
