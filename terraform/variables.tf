variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

# VULNERABILITY: Default values contain sensitive data
variable "database_username" {
  description = "Database admin username"
  type        = string
  default     = "admin"  # VULNERABILITY: Predictable default
  sensitive   = false    # VULNERABILITY: Not marked sensitive
}

variable "database_password" {
  description = "Database admin password"
  type        = string
  # VULNERABILITY: Hardcoded password in default value
  default     = "SuperSecretDBPassword123!"
  sensitive   = false  # VULNERABILITY: Should be sensitive
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "bucket_name" {
  description = "S3 bucket name"
  type        = string
  default     = "vulnerable-banking-data-prod"
}

# VULNERABILITY: API keys with default values
variable "stripe_api_key" {
  description = "Stripe API key"
  type        = string
  default     = "TEST_STRIPE_SECRET_KEY_DO_NOT_USE_IN_PRODUCTION"
  sensitive   = false
}

variable "sendgrid_api_key" {
  description = "SendGrid API key"
  type        = string
  default     = "SG.1234567890abcdefghijklmnopqrstuvwxyz.ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890"
  sensitive   = false
}

variable "jwt_secret" {
  description = "JWT secret key"
  type        = string
  default     = "my-jwt-secret-key-12345"
  sensitive   = false
}

# VULNERABILITY: AWS credentials as variables
variable "aws_access_key_id" {
  description = "AWS access key ID"
  type        = string
  default     = "AKIAIOSFODNN7EXAMPLE"
  sensitive   = false
}

variable "aws_secret_access_key" {
  description = "AWS secret access key"
  type        = string
  default     = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
  sensitive   = false
}

variable "admin_password" {
  description = "Admin user password"
  type        = string
  default     = "Admin123!@#"
  sensitive   = false
}

variable "encryption_key" {
  description = "Encryption key for application"
  type        = string
  default     = "AES256EncryptionKey12345678901234"
  sensitive   = false
}

variable "ssh_public_key" {
  description = "SSH public key for EC2 instances"
  type        = string
  default     = "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQ... admin@banking.com"
}

# VULNERABILITY: Private key in variable (should NEVER be in Terraform)
variable "ssh_private_key" {
  description = "SSH private key"
  type        = string
  default     = "-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEA..."
  sensitive   = false
}

variable "allowed_cidr_blocks" {
  description = "CIDR blocks allowed to access resources"
  type        = list(string)
  # VULNERABILITY: Default allows all
  default     = ["0.0.0.0/0"]
}

variable "enable_encryption" {
  description = "Enable encryption for resources"
  type        = bool
  # VULNERABILITY: Encryption disabled by default
  default     = false
}

variable "enable_logging" {
  description = "Enable logging for resources"
  type        = bool
  # VULNERABILITY: Logging disabled by default
  default     = false
}

variable "publicly_accessible" {
  description = "Make database publicly accessible"
  type        = bool
  # VULNERABILITY: Public access enabled by default
  default     = true
}

variable "backup_retention_days" {
  description = "Number of days to retain backups"
  type        = number
  # VULNERABILITY: No backups by default
  default     = 0
}

variable "deletion_protection" {
  description = "Enable deletion protection"
  type        = bool
  # VULNERABILITY: Deletion protection disabled
  default     = false
}

variable "multi_az" {
  description = "Enable Multi-AZ deployment"
  type        = bool
  # VULNERABILITY: Multi-AZ disabled by default
  default     = false
}

# VULNERABILITY: Tags contain sensitive information
variable "common_tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default     = {
    Project     = "Banking Application"
    Environment = "production"
    ManagedBy   = "Terraform"
    # VULNERABILITY: Sensitive data in tags
    AdminEmail  = "admin@banking.com"
    AdminPass   = "Admin123!@#"
    DBPassword  = "SuperSecretDBPassword123!"
    APIKey      = "TEST_STRIPE_SECRET_KEY_DO_NOT_USE_IN_PRODUCTION"
  }
}
