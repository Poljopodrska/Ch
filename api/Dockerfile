# Ch Project API Dockerfile - ECS Ready
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY api/requirements.txt ./requirements.txt

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY ch_app.html ./
COPY static ./static/
COPY api ./api/
COPY modules ./modules/

# Remove development-only files
RUN rm -rf modules/*-bundle.js \
    && rm -rf development/module-loader.js \
    && rm -rf scripts/build-dev-modules.js

# Create non-root user for security
RUN useradd -m -u 1000 chuser && chown -R chuser:chuser /app
USER chuser

# Expose port (ECS will map this)
EXPOSE 8080

# Health check for ECS
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8080/api/v1/health')" || exit 1

# Run the application
CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8080"]