# JSON Toolkit - Development Guide

## 🚀 Quick Start

### Using Scripts (Recommended)

```bash
# Start both servers
./scripts/dev-manager.sh

# Or start individually
./scripts/start-backend.sh
./scripts/start-frontend.sh

# Stop all servers
./scripts/stop-servers.sh
```

### Manual Commands

```bash
# Backend
cd /Users/jigardesai/Code/Projects/json-formatter
source venv/bin/activate
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Frontend
cd /Users/jigardesai/Code/Projects/json-formatter/frontend
npm run dev
```

## 🛡️ Preventing Multiple Server Instances

### 1. Always Check Before Starting
```bash
# Check what's running
ps aux | grep -E "(uvicorn|vite|node)" | grep -v grep

# Check ports
lsof -i :8000  # Backend
lsof -i :5173  # Frontend
```

### 2. Use the Development Manager
```bash
./scripts/dev-manager.sh
```
This provides a menu-driven interface to:
- Start/stop servers safely
- Check server status
- Restart all servers
- Avoid port conflicts

### 3. Frontend Package Scripts
```bash
# Start frontend (forced to port 5173)
npm run dev

# Force restart if needed
npm run dev:force

# Stop frontend
npm run stop
```

## 🔧 Troubleshooting

### Port Already in Use
```bash
# Find what's using the port
lsof -i :8000
lsof -i :5173

# Kill specific process
kill <PID>

# Or use our stop script
./scripts/stop-servers.sh
```

### Multiple Vite Instances
```bash
# Kill all Vite processes
pkill -f vite

# Or use npm script
npm run stop
```

### Backend Won't Start
```bash
# Check if virtual environment is activated
which python

# Should show: /Users/jigardesai/Code/Projects/json-formatter/venv/bin/python

# If not, activate it
source venv/bin/activate
```

## 📋 Best Practices

1. **Always stop servers before starting new ones**
2. **Use the development manager script**
3. **Check server status before making changes**
4. **Use one terminal per server type**
5. **Don't start multiple instances in different terminals**

## 🌐 URLs

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🚨 Emergency Stop

If everything goes wrong:
```bash
# Nuclear option - kill all related processes
pkill -f "uvicorn\|vite\|node.*vite"

# Or use our comprehensive stop script
./scripts/stop-servers.sh
```
