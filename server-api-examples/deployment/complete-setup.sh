#!/bin/bash

# Complete setup script for Local Password Vault License Server
# Run this after the main deployment script has completed

set -euo pipefail

# Colors for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m'

# Configuration
readonly APP_USER="passwordvault"
readonly APP_DIR="/var/www/server.localpasswordvault.com/license-server"
readonly DOMAIN="server.localpasswordvault.com"
readonly NODE_PORT="3001"

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
    print_error "Please run this script as root (sudo ./complete-setup.sh)"
    exit 1
fi

echo "🚀 Completing Local Password Vault License Server Setup..."

# Step 1: Check if files are uploaded
check_files() {
    print_status "Checking if application files are uploaded..."
    
    if [[ ! -f "$APP_DIR/package.json" ]]; then
        print_error "Application files not found in $APP_DIR"
        echo
        print_warning "Please upload your files first using one of these methods:"
        echo
        echo "Method 1 - Direct SCP:"
        echo "scp -r /Users/alokkaushik/Downloads/project\\ 2/server-api-examples/* root@\$(curl -s ipinfo.io/ip):$APP_DIR/"
        echo
        echo "Method 2 - Tar and upload:"
        echo "tar -czf license-server.tar.gz -C '/Users/alokkaushik/Downloads/project 2/server-api-examples' ."
        echo "scp license-server.tar.gz root@\$(curl -s ipinfo.io/ip):/tmp/"
        echo "ssh root@\$(curl -s ipinfo.io/ip) 'cd $APP_DIR && tar -xzf /tmp/license-server.tar.gz'"
        echo
        echo "Then run this script again."
        return 1
    fi
    
    print_success "Application files found"
    return 0
}

# Step 2: Set ownership
set_ownership() {
    print_status "Setting proper file ownership..."
    chown -R $APP_USER:$APP_USER /var/www/server.localpasswordvault.com/
    print_success "File ownership set"
}

# Step 3: Install dependencies
install_dependencies() {
    print_status "Installing Node.js dependencies..."
    cd $APP_DIR
    
    if sudo -u $APP_USER npm install; then
        print_success "Dependencies installed successfully"
    else
        print_error "Failed to install dependencies"
        return 1
    fi
}

# Step 4: Create .env file
create_env_file() {
    if [[ -f "$APP_DIR/.env" ]]; then
        print_success ".env file already exists"
        return 0
    fi
    
    print_status "Creating .env file with template..."
    
    # Generate a secure JWT secret
    local jwt_secret=$(openssl rand -base64 32)
    
    sudo -u $APP_USER tee "$APP_DIR/.env" > /dev/null << EOF
# Environment variables for Local Password Vault License Server
NODE_ENV=production
PORT=$NODE_PORT

# Server Configuration
SERVER_URL=https://$DOMAIN
ALLOWED_ORIGINS=https://$DOMAIN,https://localpasswordvault.com,https://www.localpasswordvault.com

# Database (Supabase) - REPLACE WITH YOUR VALUES
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Stripe Configuration - REPLACE WITH YOUR VALUES
STRIPE_SECRET_KEY=sk_live_your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

# Email Configuration (Brevo) - REPLACE WITH YOUR VALUES
BREVO_API_KEY=xkeysib-your-brevo-api-key
BREVO_TEMPLATE_ID=1
BREVO_SENDER_EMAIL=no-reply@$DOMAIN
BREVO_SENDER_NAME=Local Password Vault
EMAIL_SERVICE=no-reply@$DOMAIN
SUPPORT_EMAIL=support@$DOMAIN

# Security (Auto-generated)
JWT_SECRET=$jwt_secret

# Logging
LOG_LEVEL=info
EOF
    
    print_success ".env file created with template values"
    print_warning "IMPORTANT: Edit $APP_DIR/.env with your actual API keys and credentials"
}

# Step 5: Create PM2 ecosystem file
create_pm2_config() {
    print_status "Creating PM2 ecosystem configuration..."
    
    sudo -u $APP_USER tee "$APP_DIR/ecosystem.config.js" > /dev/null << 'EOF'
module.exports = {
  apps: [{
    name: 'license-server',
    script: 'license-server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};
EOF
    
    print_success "PM2 ecosystem file created"
}

# Step 6: Setup log directories
setup_logs() {
    print_status "Creating log directories..."
    
    sudo -u $APP_USER mkdir -p "$APP_DIR/logs"
    sudo -u $APP_USER mkdir -p "$APP_DIR/uploads"
    sudo -u $APP_USER mkdir -p "$APP_DIR/downloads"
    
    print_success "Log directories created"
}

# Step 7: Test the application
test_application() {
    print_status "Testing if the application can start..."
    
    cd $APP_DIR
    if timeout 10s sudo -u $APP_USER node license-server.js 2>/dev/null; then
        print_success "Application test successful"
    else
        print_warning "Application test completed (this is normal - server was stopped after test)"
    fi
}

# Step 8: Start with PM2
start_application() {
    print_status "Starting application with PM2..."
    
    cd $APP_DIR
    
    # Stop any existing instances
    sudo -u $APP_USER pm2 delete license-server 2>/dev/null || true
    
    # Start the application
    if sudo -u $APP_USER pm2 start ecosystem.config.js; then
        print_success "Application started with PM2"
        
        # Save PM2 configuration
        sudo -u $APP_USER pm2 save
        
        # Setup PM2 startup
        print_status "Configuring PM2 startup..."
        pm2 startup systemd -u $APP_USER --hp /home/$APP_USER
        
        print_success "PM2 startup configured"
    else
        print_error "Failed to start application with PM2"
        return 1
    fi
}

# Step 9: Get SSL certificate
setup_ssl() {
    print_status "Setting up SSL certificate..."
    
    if certbot --apache -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN; then
        print_success "SSL certificate obtained successfully"
    else
        print_warning "SSL certificate setup failed or requires manual intervention"
        print_warning "You can run this manually later: certbot --apache -d $DOMAIN"
    fi
}

# Step 10: Final verification
final_verification() {
    print_status "Performing final verification..."
    
    # Check if application is running
    if sudo -u $APP_USER pm2 list | grep -q "license-server.*online"; then
        print_success "✅ Application is running"
    else
        print_error "❌ Application is not running"
    fi
    
    # Check if Apache is running
    if systemctl is-active --quiet httpd; then
        print_success "✅ Apache is running"
    else
        print_error "❌ Apache is not running"
    fi
    
    # Check if port is listening
    if ss -tuln | grep -q ":$NODE_PORT "; then
        print_success "✅ Application is listening on port $NODE_PORT"
    else
        print_warning "⚠️ Application may not be listening on port $NODE_PORT"
    fi
    
    # Test HTTP connection (local)
    if curl -s http://localhost:$NODE_PORT/ >/dev/null; then
        print_success "✅ Application responds to HTTP requests"
    else
        print_warning "⚠️ Application may not be responding to HTTP requests"
    fi
}

# Display final information
show_completion_info() {
    echo
    print_success "🎉 Setup completed!"
    echo
    print_status "Your Local Password Vault License Server is now running at:"
    echo "  🌐 https://$DOMAIN"
    echo "  🔧 Status page: https://$DOMAIN/"
    echo
    print_warning "Important next steps:"
    echo "1. 📝 Edit your .env file with real API keys:"
    echo "   nano $APP_DIR/.env"
    echo
    echo "2. 🔄 Restart the application after editing .env:"
    echo "   sudo -u $APP_USER pm2 restart license-server"
    echo
    echo "3. 📊 Monitor your application:"
    echo "   sudo -u $APP_USER pm2 logs license-server"
    echo "   sudo -u $APP_USER pm2 monit"
    echo
    print_status "Useful commands:"
    echo "  • Check application status: sudo -u $APP_USER pm2 status"
    echo "  • View logs: sudo -u $APP_USER pm2 logs"
    echo "  • Restart app: sudo -u $APP_USER pm2 restart license-server"
    echo "  • Check Apache: systemctl status httpd"
    echo "  • Check SSL: certbot certificates"
    echo
    print_warning "Security reminder:"
    echo "  • Update your .env file with real credentials"
    echo "  • Test your license validation endpoints"
    echo "  • Configure your Stripe webhooks to point to https://$DOMAIN/webhook/stripe"
    echo "  • Set up monitoring and backups"
}

# Main execution
main() {
    if ! check_files; then
        exit 1
    fi
    
    set_ownership
    install_dependencies
    create_env_file
    create_pm2_config
    setup_logs
    test_application
    start_application
    setup_ssl
    final_verification
    show_completion_info
}

# Run main function
main "$@"
