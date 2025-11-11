# AWS Deployment Guide

## Architecture

- **Frontend**: Served via Nginx on port 80 (through AWS Load Balancer)
- **Backend API**: Python FastAPI on port 8000 (internal only)
- **Reverse Proxy**: Nginx proxies `/api/v1/*` requests to backend

## Setup Instructions

### 1. Install Nginx (if not already installed)

```bash
sudo apt update
sudo apt install nginx -y
```

### 2. Configure Nginx

Copy the nginx.conf to the appropriate location:

```bash
sudo cp /mnt/c/Users/HP/Ch/nginx.conf /etc/nginx/sites-available/ch-app
sudo ln -sf /etc/nginx/sites-available/ch-app /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
```

Update the root path in `/etc/nginx/sites-available/ch-app` to match your deployment directory:

```nginx
root /path/to/your/deployment;  # Update this line
```

### 3. Test and Reload Nginx

```bash
sudo nginx -t
sudo systemctl reload nginx
```

### 4. Start Backend API

The backend should run on port 8000 (internal only, not exposed):

```bash
cd /mnt/c/Users/HP/Ch/backend
python3 -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Or use a process manager like systemd:

```bash
sudo nano /etc/systemd/system/ch-backend.service
```

Add:

```ini
[Unit]
Description=Ch Backend API
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/mnt/c/Users/HP/Ch/backend
ExecStart=/usr/bin/python3 -m uvicorn app.main:app --host 127.0.0.1 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

Then:

```bash
sudo systemctl daemon-reload
sudo systemctl enable ch-backend
sudo systemctl start ch-backend
sudo systemctl status ch-backend
```

### 5. AWS Security Group Settings

**Inbound Rules:**
- Port 80 (HTTP) - Open to 0.0.0.0/0 (for Load Balancer)
- Port 443 (HTTPS) - Open to 0.0.0.0/0 (if using SSL)
- Port 22 (SSH) - Open to your IP only

**Port 8000 should NOT be exposed** - it's internal only.

### 6. Verify Deployment

1. Check backend health:
   ```bash
   curl http://localhost:8000/health
   ```

2. Check through Nginx proxy:
   ```bash
   curl http://localhost/health
   ```

3. Access via browser:
   ```
   http://your-aws-load-balancer-url
   ```

## Troubleshooting

### Backend not accessible

```bash
# Check if backend is running
sudo systemctl status ch-backend

# Check backend logs
journalctl -u ch-backend -f

# Test backend directly
curl http://localhost:8000/api/v1/suppliers/
```

### Nginx errors

```bash
# Check nginx status
sudo systemctl status nginx

# Check nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Test configuration
sudo nginx -t
```

### API 404 errors

Make sure:
1. Backend is running on port 8000
2. Nginx is configured correctly
3. The proxy_pass directive points to `http://localhost:8000`

## File Structure

```
/mnt/c/Users/HP/Ch/
├── index.html              # Main HTML file
├── static/                 # Static assets
│   └── js/
│       ├── app.js
│       ├── config.js
│       └── storage_adapter.js
├── modules/                # Frontend modules
│   ├── crm/
│   │   └── customer_crm.js
│   └── procurement/
│       └── suppliers.js
├── backend/                # Backend API
│   ├── app/
│   │   ├── main.py
│   │   ├── api/
│   │   └── models/
│   └── requirements.txt
└── nginx.conf             # Nginx configuration
```
