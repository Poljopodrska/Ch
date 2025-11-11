#!/bin/bash
# Quick Deploy Script - Run this on your AWS EC2 instance

set -e

echo "========================================="
echo " Ch Application - Quick Deployment"
echo "========================================="

# Navigate to Ch directory (try common locations)
if [ -d "/home/ubuntu/Ch" ]; then
    cd /home/ubuntu/Ch
elif [ -d "$HOME/Ch" ]; then
    cd $HOME/Ch
elif [ -d "/var/www/Ch" ]; then
    cd /var/www/Ch
else
    echo "ERROR: Cannot find Ch directory"
    echo "Please run this script from the Ch directory"
    exit 1
fi

echo "Working directory: $(pwd)"
echo ""

# Pull latest code
echo "[1/8] Pulling latest code..."
git pull origin main

# Install nginx
echo "[2/8] Installing nginx..."
sudo apt update -qq
sudo apt install -y nginx

# Configure nginx
echo "[3/8] Configuring nginx..."
sudo cp nginx.conf /etc/nginx/sites-available/ch-app
sudo sed -i "s|root /mnt/c/Users/HP/Ch|root $(pwd)|g" /etc/nginx/sites-available/ch-app
sudo ln -sf /etc/nginx/sites-available/ch-app /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test nginx config
echo "[4/8] Testing nginx configuration..."
sudo nginx -t

# Reload nginx
echo "[5/8] Reloading nginx..."
sudo systemctl reload nginx
sudo systemctl enable nginx

# Stop existing backend
echo "[6/8] Stopping existing backend processes..."
pkill -f "uvicorn app.main:app" || true
sleep 2

# Start backend
echo "[7/8] Starting backend on port 8000..."
cd backend
nohup python3 -m uvicorn app.main:app --host 127.0.0.1 --port 8000 > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend started with PID: $BACKEND_PID"
cd ..

# Wait for backend to start
echo "[8/8] Waiting for backend to start..."
sleep 5

# Test endpoints
echo ""
echo "========================================="
echo " Testing Deployment"
echo "========================================="

echo "Backend (direct):"
curl -s http://localhost:8000/health | python3 -m json.tool || echo "FAILED"

echo ""
echo "Nginx proxy:"
curl -s http://localhost/health | python3 -m json.tool || echo "FAILED"

echo ""
echo "========================================="
echo " Deployment Complete!"
echo "========================================="
echo "Backend PID: $BACKEND_PID"
echo "Backend logs: /tmp/backend.log"
echo ""
echo "Your app should be accessible at:"
echo "http://ch-alb-2140286266.us-east-1.elb.amazonaws.com"
echo ""
echo "IMPORTANT: Hard refresh browser (Ctrl+Shift+R)"
echo "========================================="
