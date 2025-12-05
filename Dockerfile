# Multi-stage build for Ch Application
# Stage 1: Frontend
FROM public.ecr.aws/nginx/nginx:alpine AS frontend
COPY . /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Stage 2: Backend
FROM public.ecr.aws/docker/library/python:3.12-slim

# Set working directory
WORKDIR /app

# Install system dependencies and build tools
RUN apt-get update && apt-get install -y \
    curl \
    nginx \
    supervisor \
    gcc \
    g++ \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements and install
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy entire application
COPY . .

# Copy nginx configuration
RUN cp nginx.conf /etc/nginx/sites-available/default
RUN sed -i "s|root /mnt/c/Users/HP/Ch|root /app|g" /etc/nginx/sites-available/default
RUN sed -i "s|listen 80;|listen 8080;|g" /etc/nginx/sites-available/default

# Create supervisor config to run both nginx and backend
RUN mkdir -p /var/log/supervisor
COPY <<'EOF' /etc/supervisor/conf.d/supervisord.conf
[supervisord]
nodaemon=true
logfile=/var/log/supervisor/supervisord.log
pidfile=/var/run/supervisord.pid

[program:nginx]
command=/usr/sbin/nginx -g "daemon off;"
autostart=true
autorestart=true
stderr_logfile=/dev/stderr
stderr_logfile_maxbytes=0
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0

[program:migrations]
command=/bin/bash -c "cd /app/backend && alembic upgrade head && echo 'Migrations complete'"
directory=/app/backend
autostart=true
autorestart=false
startsecs=0
priority=1
stderr_logfile=/dev/stderr
stderr_logfile_maxbytes=0
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0

[program:backend]
command=python3 -m uvicorn app.main:app --host 127.0.0.1 --port 8000
directory=/app/backend
autostart=true
autorestart=true
priority=2
stderr_logfile=/dev/stderr
stderr_logfile_maxbytes=0
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
EOF

# Expose port 8080 (nginx)
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Start supervisor
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
