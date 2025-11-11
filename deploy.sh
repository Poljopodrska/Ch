#!/bin/bash
# AWS Deployment Script for Ch Application

set -e  # Exit on error

echo "======================================"
echo "Ch Application - AWS Deployment"
echo "======================================"

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo "Please don't run as root. Use sudo when needed."
    exit 1
fi

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
echo "Deployment directory: $SCRIPT_DIR"

# Install nginx if not installed
if ! command -v nginx &> /dev/null; then
    echo "Installing nginx..."
    sudo apt update
    sudo apt install -y nginx
else
    echo "nginx is already installed"
fi

# Backup existing nginx config if exists
if [ -f /etc/nginx/sites-available/ch-app ]; then
    echo "Backing up existing nginx config..."
    sudo cp /etc/nginx/sites-available/ch-app /etc/nginx/sites-available/ch-app.backup.$(date +%Y%m%d_%H%M%S)
fi

# Update nginx config with correct path
echo "Configuring nginx..."
sudo cp "$SCRIPT_DIR/nginx.conf" /etc/nginx/sites-available/ch-app
sudo sed -i "s|root /mnt/c/Users/HP/Ch|root $SCRIPT_DIR|g" /etc/nginx/sites-available/ch-app

# Enable site
sudo ln -sf /etc/nginx/sites-available/ch-app /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test nginx config
echo "Testing nginx configuration..."
sudo nginx -t

# Reload nginx
echo "Reloading nginx..."
sudo systemctl reload nginx
sudo systemctl enable nginx

echo ""
echo "======================================"
echo "Setting up backend service..."
echo "======================================"

# Create systemd service for backend
echo "Creating systemd service..."
sudo tee /etc/systemd/system/ch-backend.service > /dev/null <<EOF
[Unit]
Description=Ch Backend API
After=network.target

[Service]
User=$USER
WorkingDirectory=$SCRIPT_DIR/backend
ExecStart=/usr/bin/python3 -m uvicorn app.main:app --host 127.0.0.1 --port 8000
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd
echo "Reloading systemd..."
sudo systemctl daemon-reload

# Start backend service
echo "Starting backend service..."
sudo systemctl enable ch-backend
sudo systemctl restart ch-backend

# Wait a bit for backend to start
sleep 3

# Check status
echo ""
echo "======================================"
echo "Deployment Status"
echo "======================================"

echo ""
echo "Nginx status:"
sudo systemctl status nginx --no-pager | head -5

echo ""
echo "Backend status:"
sudo systemctl status ch-backend --no-pager | head -10

echo ""
echo "======================================"
echo "Testing endpoints..."
echo "======================================"

echo ""
echo "Testing backend health (direct):"
curl -s http://localhost:8000/health | python3 -m json.tool || echo "Backend not responding"

echo ""
echo "Testing backend health (through nginx):"
curl -s http://localhost/health | python3 -m json.tool || echo "Nginx proxy not working"

echo ""
echo "======================================"
echo "Deployment Complete!"
echo "======================================"
echo ""
echo "Your application should now be accessible at:"
echo "  http://$(hostname -I | awk '{print $1}')"
echo ""
echo "Or via your AWS Load Balancer URL"
echo ""
echo "Useful commands:"
echo "  sudo systemctl status nginx"
echo "  sudo systemctl status ch-backend"
echo "  sudo tail -f /var/log/nginx/error.log"
echo "  sudo journalctl -u ch-backend -f"
echo ""
