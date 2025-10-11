# JSON Toolkit - Deployment Options Guide

## Overview

This document outlines all the deployment options available for the JSON Toolkit application. Each option includes detailed steps, requirements, and considerations.

## 🐳 Option 1: Docker Deployment (Recommended for Production)

### What This Includes:
- Complete containerization of both frontend and backend
- Production-ready nginx configuration
- Health checks and restart policies
- Easy scaling and management

### Files to Create:

#### 1. Backend Dockerfile
**File:** `Dockerfile`
```dockerfile
FROM python:3.13-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY app/ ./app/

# Expose port
EXPOSE 8000

# Run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

#### 2. Frontend Dockerfile
**File:** `frontend/Dockerfile`
```dockerfile
# Build stage
FROM node:18-alpine as build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

#### 3. Docker Compose Configuration
**File:** `docker-compose.yml`
```yaml
version: '3.8'

services:
  backend:
    build: .
    ports:
      - "8000:8000"
    environment:
      - PYTHONPATH=/app
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    depends_on:
      - backend
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:80/"]
      interval: 30s
      timeout: 10s
      retries: 3
```

#### 4. Nginx Configuration
**File:** `frontend/nginx.conf`
```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Handle client-side routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy to backend
    location /api/ {
        proxy_pass http://backend:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

#### 5. Build and Deploy Scripts
**File:** `scripts/build.sh`
```bash
#!/bin/bash

echo "🏗️  Building JSON Toolkit for production..."

# Build backend
echo "📦 Building backend..."
docker build -t json-toolkit-backend .

# Build frontend
echo "🎨 Building frontend..."
cd frontend
docker build -t json-toolkit-frontend .
cd ..

# Build complete application
echo "🚀 Building complete application..."
docker-compose build

echo "✅ Build complete!"
echo "Run 'docker-compose up -d' to start the application"
```

**File:** `scripts/deploy.sh`
```bash
#!/bin/bash

echo "🚀 Deploying JSON Toolkit..."

# Pull latest changes
git pull origin main

# Build and start services
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Check if services are running
if curl -f http://localhost:8000/ > /dev/null 2>&1; then
    echo "✅ Backend is running!"
else
    echo "❌ Backend failed to start"
    exit 1
fi

if curl -f http://localhost:3000/ > /dev/null 2>&1; then
    echo "✅ Frontend is running!"
else
    echo "❌ Frontend failed to start"
    exit 1
fi

echo "🎉 Deployment successful!"
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:3000"
echo "API Docs: http://localhost:8000/docs"
```

### Commands to Run:
```bash
# Make scripts executable
chmod +x scripts/build.sh scripts/deploy.sh

# Build and start
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### Access URLs:
- **Frontend**: `http://localhost:3000`
- **Backend**: `http://localhost:8000`
- **API Docs**: `http://localhost:8000/docs`

---

## ☁️ Option 2: Heroku Deployment (Easiest)

### What This Includes:
- Simple git-based deployment
- Automatic scaling
- Built-in monitoring
- SSL certificates

### Files to Create:

#### 1. Heroku Configuration
**File:** `Procfile`
```
web: uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

**File:** `runtime.txt`
```
python-3.13.0
```

**File:** `app.json`
```json
{
  "name": "JSON Toolkit",
  "description": "Professional JSON editing, formatting, and conversion tools",
  "repository": "https://github.com/jrdesai/json-toolkit",
  "logo": "https://raw.githubusercontent.com/jrdesai/json-toolkit/main/logo.png",
  "keywords": ["json", "formatter", "converter", "xml", "csv", "yaml"],
  "stack": "heroku-22",
  "buildpacks": [
    {
      "url": "heroku/python"
    }
  ],
  "env": {
    "PYTHONPATH": {
      "description": "Python path for the application",
      "value": "/app"
    }
  }
}
```

### Commands to Run:
```bash
# Install Heroku CLI
# Login to Heroku
heroku login

# Create Heroku app
heroku create json-toolkit-yourname

# Deploy
git push heroku main

# Open app
heroku open
```

### Access URLs:
- **Main App**: `https://your-app-name.herokuapp.com`
- **API Docs**: `https://your-app-name.herokuapp.com/docs`

---

## 🚂 Option 3: Railway Deployment (Very Easy)

### What This Includes:
- Automatic deployments from GitHub
- Built-in monitoring
- Custom domains
- Environment variables management

### Files to Create:

#### 1. Railway Configuration
**File:** `railway.json`
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "uvicorn app.main:app --host 0.0.0.0 --port $PORT",
    "healthcheckPath": "/",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### Commands to Run:
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Deploy
railway up
```

### Access URLs:
- **Main App**: `https://your-app-name.railway.app`
- **API Docs**: `https://your-app-name.railway.app/docs`

---

## 🎨 Option 4: Render Deployment (Easy)

### What This Includes:
- GitHub integration
- Automatic SSL
- Custom domains
- Environment management

### Files to Create:

#### 1. Render Configuration
**File:** `render.yaml`
```yaml
services:
  - type: web
    name: json-toolkit-backend
    env: python
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn app.main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: PYTHONPATH
        value: /opt/render/project/src
```

### Setup Steps:
1. Connect GitHub repository to Render
2. Select "Web Service"
3. Use these settings:
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Python Version**: `3.13`

### Access URLs:
- **Main App**: `https://your-app-name.onrender.com`
- **API Docs**: `https://your-app-name.onrender.com/docs`

---

## 🖥️ Option 5: VPS/Server Deployment

### What This Includes:
- Full control over server
- Custom configurations
- Cost-effective for high traffic
- Requires server management knowledge

### Files to Create:

#### 1. Production Configuration
**File:** `production.py`
```python
import os
from app.main import app

# Production settings
if os.getenv("ENVIRONMENT") == "production":
    # Disable debug mode
    app.debug = False
    
    # Add production middleware
    from fastapi.middleware.trustedhost import TrustedHostMiddleware
    app.add_middleware(
        TrustedHostMiddleware, 
        allowed_hosts=["yourdomain.com", "www.yourdomain.com"]
    )
    
    # Add security headers
    from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware
    app.add_middleware(HTTPSRedirectMiddleware)
```

#### 2. Gunicorn Configuration
**File:** `gunicorn.conf.py`
```python
bind = "0.0.0.0:8000"
workers = 4
worker_class = "uvicorn.workers.UvicornWorker"
worker_connections = 1000
max_requests = 1000
max_requests_jitter = 100
timeout = 30
keepalive = 2
preload_app = True
```

#### 3. Systemd Service
**File:** `json-toolkit.service`
```ini
[Unit]
Description=JSON Toolkit FastAPI application
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/opt/json-toolkit
Environment=PATH=/opt/json-toolkit/venv/bin
ExecStart=/opt/json-toolkit/venv/bin/gunicorn -c gunicorn.conf.py app.main:app
Restart=always

[Install]
WantedBy=multi-user.target
```

### Setup Steps:
1. Set up Ubuntu/Debian server
2. Install Python 3.13, nginx, and dependencies
3. Clone repository and install dependencies
4. Configure nginx as reverse proxy
5. Set up SSL with Let's Encrypt
6. Configure systemd service

---

## 🔧 Frontend Configuration Updates

### Files to Modify:

#### 1. Environment Configuration
**File:** `frontend/src/config.js`
```javascript
// Environment configuration
const config = {
  development: {
    API_BASE_URL: 'http://localhost:8000',
    ENVIRONMENT: 'development'
  },
  production: {
    API_BASE_URL: process.env.REACT_APP_API_URL || window.location.origin,
    ENVIRONMENT: 'production'
  }
};

// Get current environment
const environment = process.env.NODE_ENV || 'development';

// Export current config
export default config[environment];
```

#### 2. Update JsonFormatter Component
**File:** `frontend/src/components/JsonFormatter.jsx`

Add import:
```javascript
import config from '../config';
```

Update API calls:
```javascript
// Change from:
const response = await axios.post('http://localhost:8000/format', parsedJson);

// To:
const response = await axios.post(`${config.API_BASE_URL}/format`, parsedJson);
```

---

## 📋 Environment Configuration

### Files to Create:

#### 1. Development Environment
**File:** `env.development.example`
```bash
# Development Environment Variables
ENVIRONMENT=development
DEBUG=true
LOG_LEVEL=debug

# CORS for development
CORS_ORIGINS=http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000
```

#### 2. Production Environment
**File:** `env.production.example`
```bash
# Production Environment Variables
ENVIRONMENT=production
DEBUG=false
LOG_LEVEL=info

# CORS for production
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Security
SECRET_KEY=your-super-secret-key-here
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
```

---

## 🚀 CI/CD Pipeline

### Files to Create:

#### 1. GitHub Actions Workflow
**File:** `.github/workflows/deploy.yml`
```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.13'
    
    - name: Install dependencies
      run: |
        python -m pip install --upgrade pip
        pip install -r requirements.txt
    
    - name: Run backend tests
      run: |
        echo "Running backend tests..."
        # python -m pytest tests/
    
    - name: Set up Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
        cache-dependency-path: frontend/package-lock.json
    
    - name: Install frontend dependencies
      run: |
        cd frontend
        npm ci
    
    - name: Run frontend tests
      run: |
        cd frontend
        npm run lint
    
    - name: Build frontend
      run: |
        cd frontend
        npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Deploy to production
      run: |
        echo "Deploying to production..."
        # Add your deployment commands here
```

---

## 📊 Comparison Table

| Option | Difficulty | Cost | Setup Time | Scalability | Maintenance |
|--------|------------|------|------------|-------------|-------------|
| Docker | Medium | Free | 30 min | High | Medium |
| Heroku | Easy | $7+/month | 10 min | Medium | Low |
| Railway | Easy | $5+/month | 5 min | Medium | Low |
| Render | Easy | $7+/month | 15 min | Medium | Low |
| VPS | Hard | $5+/month | 2+ hours | High | High |

---

## 🎯 Recommendations

### For Beginners:
1. **Heroku** - Easiest to get started
2. **Railway** - Very simple, good for small projects
3. **Render** - Good balance of features and simplicity

### For Production:
1. **Docker** - Most flexible and scalable
2. **VPS** - Full control, cost-effective for high traffic
3. **Heroku** - Good for medium-scale applications

### For Development:
1. **Docker** - Matches production environment
2. **Local development** - Fastest iteration

---

## 📝 Implementation Checklist

### Before Deployment:
- [ ] Test all conversion features locally
- [ ] Update CORS settings for production domain
- [ ] Set up environment variables
- [ ] Choose deployment platform
- [ ] Configure domain (if needed)
- [ ] Set up monitoring and logging
- [ ] Test deployment in staging environment

### After Deployment:
- [ ] Verify all endpoints work
- [ ] Test conversion features
- [ ] Monitor application logs
- [ ] Set up health checks
- [ ] Configure monitoring alerts
- [ ] Update documentation
- [ ] Share deployment URL

---

## 🔍 Troubleshooting

### Common Issues:

1. **Port conflicts**: Stop local development servers before deploying
2. **CORS errors**: Update CORS settings for production domain
3. **Build failures**: Check dependencies and build logs
4. **Environment variables**: Ensure all required variables are set
5. **SSL certificates**: Set up HTTPS for production

### Debug Commands:

```bash
# Docker
docker-compose logs -f
docker-compose ps

# Heroku
heroku logs --tail
heroku ps

# Railway
railway logs
railway status

# Render
# Check logs in Render dashboard
```

---

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Heroku Documentation](https://devcenter.heroku.com/)
- [Railway Documentation](https://docs.railway.app/)
- [Render Documentation](https://render.com/docs)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)
- [React Deployment](https://create-react-app.dev/docs/deployment/)

---

*This document provides a comprehensive overview of all deployment options. Choose the option that best fits your needs, budget, and technical expertise.*
