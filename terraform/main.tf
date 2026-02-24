terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
  }
}

provider "aws" {
  region = var.aws_region

  # VULNERABILITY: Hardcoded AWS credentials
  access_key = "AKIAIOSFODNN7EXAMPLE"
  secret_key = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
}

# VULNERABILITY: S3 bucket with public access
resource "aws_s3_bucket" "banking_data" {
  bucket = "vulnerable-banking-data-prod"

  # VULNERABILITY: Public read ACL
  acl = "public-read"

  # VULNERABILITY: Versioning disabled
  versioning {
    enabled = false
  }

  # VULNERABILITY: No server-side encryption
  # server_side_encryption_configuration {
  #   rule {
  #     apply_server_side_encryption_by_default {
  #       sse_algorithm = "AES256"
  #     }
  #   }
  # }

  # VULNERABILITY: No logging enabled
  # logging {
  #   target_bucket = aws_s3_bucket.logs.id
  #   target_prefix = "s3-access-logs/"
  # }

  # VULNERABILITY: Public access block disabled
  # This should be enabled for security

  tags = {
    Name        = "Banking Data"
    Environment = "production"
    # VULNERABILITY: Sensitive data in tags
    Contains    = "customer-pii-credit-cards-ssn"
  }
}

# VULNERABILITY: S3 bucket public access block disabled
resource "aws_s3_bucket_public_access_block" "banking_data" {
  bucket = aws_s3_bucket.banking_data.id

  # VULNERABILITY: All public access protections disabled
  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

# VULNERABILITY: RDS instance publicly accessible
resource "aws_db_instance" "banking_db" {
  identifier = "banking-production-db"

  engine         = "mysql"
  engine_version = "5.7"  # VULNERABILITY: Outdated MySQL version
  instance_class = "db.t3.micro"

  allocated_storage = 20
  storage_type      = "gp2"

  # VULNERABILITY: Storage encryption disabled
  storage_encrypted = false

  # VULNERABILITY: Database is publicly accessible
  publicly_accessible = true

  # VULNERABILITY: Hardcoded database credentials
  username = "admin"
  password = "SuperSecretDBPassword123!"

  # VULNERABILITY: Default VPC and security group
  db_subnet_group_name = "default"

  # VULNERABILITY: Skip final snapshot
  skip_final_snapshot = true

  # VULNERABILITY: No backup retention
  backup_retention_period = 0

  # VULNERABILITY: Automated backups disabled
  backup_window = ""

  # VULNERABILITY: No deletion protection
  deletion_protection = false

  # VULNERABILITY: Multi-AZ disabled
  multi_az = false

  # VULNERABILITY: No enhanced monitoring
  # enabled_cloudwatch_logs_exports = ["error", "general", "slowquery"]

  # VULNERABILITY: Auto minor version upgrade disabled
  auto_minor_version_upgrade = false

  # VULNERABILITY: No IAM database authentication
  iam_database_authentication_enabled = false

  tags = {
    Name        = "Banking Production DB"
    Environment = "production"
  }
}

# VULNERABILITY: Security group allows all traffic
resource "aws_security_group" "banking_app" {
  name        = "banking-app-sg"
  description = "Security group for banking application"

  # VULNERABILITY: Inbound from anywhere
  ingress {
    description = "Allow all inbound traffic"
    from_port   = 0
    to_port     = 65535
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]  # CRITICAL: Open to internet
  }

  ingress {
    description = "SSH from anywhere"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]  # VULNERABILITY: SSH open to world
  }

  ingress {
    description = "Database from anywhere"
    from_port   = 3306
    to_port     = 3306
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]  # VULNERABILITY: Database open to world
  }

  # VULNERABILITY: Outbound to anywhere
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "Banking App Security Group"
  }
}

# VULNERABILITY: EC2 instance with public IP and wide-open security
resource "aws_instance" "banking_server" {
  ami           = "ami-0c55b159cbfafe1f0"  # VULNERABILITY: Hardcoded old AMI
  instance_type = "t2.micro"

  # VULNERABILITY: Public IP assignment
  associate_public_ip_address = true

  # VULNERABILITY: Using vulnerable security group
  vpc_security_group_ids = [aws_security_group.banking_app.id]

  # VULNERABILITY: No IAM instance profile
  # iam_instance_profile = aws_iam_instance_profile.banking.name

  # VULNERABILITY: Unencrypted root volume
  root_block_device {
    volume_size           = 20
    volume_type           = "gp2"
    encrypted             = false  # VULNERABILITY: No encryption
    delete_on_termination = true
  }

  # VULNERABILITY: Hardcoded credentials in user data
  user_data = <<-EOF
              #!/bin/bash
              export AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
              export AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
              export DB_PASSWORD=SuperSecretDBPassword123!
              export ADMIN_PASSWORD=Admin123!@#

              # Install application
              apt-get update
              apt-get install -y nodejs npm

              # Clone and run app
              git clone https://github.com/banking/app.git /app
              cd /app
              npm install
              npm start
              EOF

  # VULNERABILITY: No monitoring enabled
  monitoring = false

  # VULNERABILITY: No IMDSv2 enforcement
  metadata_options {
    http_endpoint = "enabled"
    http_tokens   = "optional"  # VULNERABILITY: IMDSv1 allowed
  }

  tags = {
    Name        = "Banking Application Server"
    Environment = "production"
    # VULNERABILITY: Sensitive info in tags
    AdminPassword = "Admin123!@#"
  }
}

# VULNERABILITY: IAM user with hardcoded access keys
resource "aws_iam_user" "banking_service" {
  name = "banking-service-user"

  tags = {
    Description = "Service user for banking application"
  }
}

resource "aws_iam_access_key" "banking_service" {
  user = aws_iam_user.banking_service.name
}

# VULNERABILITY: IAM policy too permissive
resource "aws_iam_user_policy" "banking_service" {
  name = "banking-service-policy"
  user = aws_iam_user.banking_service.name

  # VULNERABILITY: Admin access policy
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = "*"  # CRITICAL: Full admin access
        Resource = "*"
      }
    ]
  })
}

# VULNERABILITY: Secrets stored in plain text
resource "aws_secretsmanager_secret" "db_password" {
  name = "banking-db-password"

  # VULNERABILITY: No KMS encryption key specified
  # kms_key_id = aws_kms_key.banking.id

  # VULNERABILITY: No rotation policy
  # rotation_rules {
  #   automatically_after_days = 30
  # }
}

resource "aws_secretsmanager_secret_version" "db_password" {
  secret_id = aws_secretsmanager_secret.db_password.id

  # VULNERABILITY: Hardcoded secret value
  secret_string = jsonencode({
    username = "admin"
    password = "SuperSecretDBPassword123!"
    host     = aws_db_instance.banking_db.endpoint
  })
}

# VULNERABILITY: ELB without HTTPS
resource "aws_elb" "banking_lb" {
  name               = "banking-lb"
  availability_zones = ["us-east-1a", "us-east-1b"]

  # VULNERABILITY: HTTP only, no HTTPS
  listener {
    instance_port     = 3000
    instance_protocol = "http"
    lb_port           = 80
    lb_protocol       = "http"  # VULNERABILITY: No SSL/TLS
  }

  # VULNERABILITY: No access logs
  # access_logs {
  #   bucket  = aws_s3_bucket.lb_logs.id
  #   enabled = true
  # }

  # VULNERABILITY: No connection draining
  # connection_draining = true

  health_check {
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 3
    target              = "HTTP:3000/"
    interval            = 30
  }

  instances                   = [aws_instance.banking_server.id]
  cross_zone_load_balancing   = false
  idle_timeout                = 400
  connection_draining         = false
  connection_draining_timeout = 400

  tags = {
    Name = "Banking Load Balancer"
  }
}

# Output sensitive information
output "database_endpoint" {
  value = aws_db_instance.banking_db.endpoint
  # VULNERABILITY: Sensitive output not marked sensitive
  sensitive = false
}

output "database_password" {
  value = aws_db_instance.banking_db.password
  # VULNERABILITY: Password in output
  sensitive = false
}

output "aws_access_key" {
  value = aws_iam_access_key.banking_service.id
  # VULNERABILITY: Access key in output
  sensitive = false
}

output "aws_secret_key" {
  value = aws_iam_access_key.banking_service.secret
  # CRITICAL: Secret key in output
  sensitive = false
}

output "instance_public_ip" {
  value = aws_instance.banking_server.public_ip
}

# Summary of Terraform/IaC vulnerabilities:
# 1. Hardcoded AWS credentials in provider
# 2. S3 bucket with public-read ACL
# 3. S3 bucket without encryption
# 4. S3 bucket without versioning
# 5. S3 bucket without logging
# 6. Public access block disabled
# 7. RDS publicly accessible
# 8. RDS without encryption
# 9. RDS with hardcoded password
# 10. RDS without backups
# 11. RDS skip final snapshot
# 12. Outdated MySQL version
# 13. Security group allowing 0.0.0.0/0
# 14. SSH open to world
# 15. Database port open to world
# 16. EC2 with public IP
# 17. Unencrypted EBS volumes
# 18. Hardcoded secrets in user data
# 19. IMDSv1 enabled
# 20. IAM policy with * permissions
# 21. ELB without HTTPS
# 22. No access logging
# 23. Sensitive outputs not marked sensitive
# 24. No KMS encryption for secrets
# 25. Secrets in plain text
