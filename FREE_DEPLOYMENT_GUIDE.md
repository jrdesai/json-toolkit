# 🆓 Free Deployment Guide for JSON Toolkit

This guide covers **100% FREE** deployment options for your JSON Toolkit application. Perfect for personal projects, demos, and small-scale applications.

## 📊 Free Tier Comparison

| Platform | Frontend | Backend | Free Tier Limits | Best For |
|----------|----------|---------|------------------|----------|
| **Vercel** | ✅ | ⚠️ (Serverless) | Unlimited | Frontend + API Routes |
| **Netlify** | ✅ | ⚠️ (Functions) | 100GB bandwidth | Frontend + Functions |
| **Render** | ✅ | ✅ | 750 hours/month | Full-stack |
| **Railway** | ✅ | ✅ | $5 credit/month | Full-stack |
| **Fly.io** | ✅ | ✅ | 3 VMs, 3GB RAM | Full-stack |
| **GitHub Pages** | ✅ | ❌ | Unlimited | Frontend only |
| **PythonAnywhere** | ❌ | ✅ | Limited | Backend only |

---

## 🎯 Recommended Free Setup (Easiest)

### Option 1: Render (Full-Stack) ⭐ **RECOMMENDED**

**Why Render?**
- ✅ Free tier: 750 hours/month (enough for 24/7)
- ✅ Automatic deployments from GitHub
- ✅ Free SSL certificates
- ✅ Easy setup
- ✅ Supports both frontend and backend

#### Step 1: Deploy Backend to Render

1. **Go to [Render.com](https://render.com)** and sign up (free)

2. **Create a new Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the repository

3. **Configure Backend Service:**
   ```
   Name: json-toolkit-backend
   Environment: Python 3
   Build Command: pip install -r requirements.txt
   Start Command: uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```

4. **Add Environment Variables:**
   ```
   PYTHONPATH=/opt/render/project/src
   ```

5. **Click "Create Web Service"**
   - Wait for deployment (5-10 minutes)
   - Copy your backend URL (e.g., `https://json-toolkit-backend.onrender.com`)

#### Step 2: Deploy Frontend to Render

1. **Create a new Static Site**
   - Click "New +" → "Static Site"
   - Connect your GitHub repository

2. **Configure Frontend:**
   ```
   Name: json-toolkit-frontend
   Build Command: cd frontend && npm install && npm run build
   Publish Directory: frontend/dist
   ```

3. **Add Environment Variable:**
   ```
   VITE_API_URL=https://json-toolkit-backend.onrender.com
   ```

4. **Update Frontend API Configuration**

   Create `frontend/src/config/api.js`:
   ```javascript
   const API_BASE_URL = import.meta.env.VITE_API_URL || 
     (import.meta.env.PROD ? window.location.origin : 'http://localhost:8000');
   
   export default API_BASE_URL;
   ```

   Update `frontend/src/components/JsonFormatter.jsx`:
   ```javascript
   import API_BASE_URL from '../config/api';
   
   // Replace all instances of 'http://localhost:8000' with:
   const response = await axios.post(`${API_BASE_URL}/format`, jsonData);
   ```

5. **Click "Create Static Site"**

#### Step 3: Update CORS Settings

Update `app/main.py`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "https://json-toolkit-frontend.onrender.com",  # Add your frontend URL
        "https://your-custom-domain.com"  # If you add a custom domain
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**✅ Done!** Your app is live at: `https://json-toolkit-frontend.onrender.com`

---

### Option 2: Vercel (Frontend) + Render (Backend) ⚡ **FASTEST**

**Why this combo?**
- ✅ Vercel: Best free tier for frontend (unlimited)
- ✅ Render: Reliable free backend
- ✅ Fast global CDN
- ✅ Automatic deployments

#### Deploy Frontend to Vercel

1. **Go to [Vercel.com](https://vercel.com)** and sign up with GitHub

2. **Import your repository**
   - Click "Add New" → "Project"
   - Select your repository

3. **Configure Build Settings:**
   ```
   Framework Preset: Vite
   Root Directory: frontend
   Build Command: npm run build
   Output Directory: dist
   ```

4. **Add Environment Variable:**
   ```
   VITE_API_URL=https://your-backend-url.onrender.com
   ```

5. **Click "Deploy"**
   - Vercel will automatically deploy on every push to main

**✅ Frontend URL:** `https://your-project.vercel.app`

---

### Option 3: Railway (Full-Stack) 🚂 **EASIEST**

**Why Railway?**
- ✅ $5 free credit/month (enough for small apps)
- ✅ One-click deployment
- ✅ Automatic deployments
- ✅ Simple setup

#### Deploy to Railway

1. **Go to [Railway.app](https://railway.app)** and sign up

2. **Create a new project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

3. **Railway will auto-detect:**
   - Backend: Python service
   - Frontend: Node.js service

4. **Configure Backend:**
   ```
   Start Command: uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```

5. **Configure Frontend:**
   ```
   Root Directory: frontend
   Build Command: npm install && npm run build
   Start Command: npm run preview
   ```

6. **Add Environment Variables:**
   - Backend: `PYTHONPATH=/app`
   - Frontend: `VITE_API_URL=${{backend.RAILWAY_PUBLIC_DOMAIN}}`

**✅ Your app will be live automatically!**

---

### Option 4: Fly.io (Full-Stack) 🚀 **MOST FLEXIBLE**

**Why Fly.io?**
- ✅ 3 free VMs
- ✅ 3GB RAM total
- ✅ Global edge network
- ✅ Docker-based

#### Deploy to Fly.io

1. **Install Fly CLI:**
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. **Login:**
   ```bash
   fly auth login
   ```

3. **Create Backend App:**
   ```bash
   cd /path/to/json-formatter
   fly launch --name json-toolkit-backend
   ```

4. **Create `fly.toml` for backend:**
   ```toml
   app = "json-toolkit-backend"
   primary_region = "iad"

   [build]

   [http_service]
     internal_port = 8000
     force_https = true
     auto_stop_machines = true
     auto_start_machines = true
     min_machines_running = 0

   [[services]]
     http_checks = []
     internal_port = 8000
     processes = ["app"]
     protocol = "tcp"
     script_checks = []
   ```

5. **Deploy:**
   ```bash
   fly deploy
   ```

6. **Repeat for frontend** (create separate app)

**✅ Your app is live!**

---

## 🔧 Required Code Changes

### 1. Create API Configuration

**File:** `frontend/src/config/api.js`
```javascript
// Get API URL from environment or use default
const getApiUrl = () => {
  // Production: use environment variable or same origin
  if (import.meta.env.PROD) {
    return import.meta.env.VITE_API_URL || window.location.origin;
  }
  // Development: use localhost
  return import.meta.env.VITE_API_URL || 'http://localhost:8000';
};

export const API_BASE_URL = getApiUrl();
export default API_BASE_URL;
```

### 2. Update JsonFormatter Component

**File:** `frontend/src/components/JsonFormatter.jsx`

Add import at top:
```javascript
import API_BASE_URL from '../config/api';
```

Replace all API calls:
```javascript
// OLD:
const response = await axios.post('http://localhost:8000/format', jsonData);

// NEW:
const response = await axios.post(`${API_BASE_URL}/format`, jsonData);
```

Do this for:
- `/format` endpoint
- `/convert` endpoint  
- `/query` endpoint

### 3. Update CORS Settings

**File:** `app/main.py`

```python
# Get allowed origins from environment
import os

ALLOWED_ORIGINS = os.getenv(
    'CORS_ORIGINS',
    'http://localhost:5173,http://localhost:5174,http://localhost:5175'
).split(',')

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 4. Create Environment Files

**File:** `.env.example`
```bash
# Backend
CORS_ORIGINS=https://your-frontend-url.vercel.app,https://your-frontend-url.onrender.com
PYTHONPATH=/app

# Frontend (for Vite)
VITE_API_URL=https://your-backend-url.onrender.com
```

---

## 📝 Step-by-Step: Render Deployment

### Backend Deployment

1. **Sign up at [Render.com](https://render.com)**

2. **New Web Service:**
   - Repository: Your GitHub repo
   - Name: `json-toolkit-api`
   - Environment: `Python 3`
   - Region: Choose closest to you
   - Branch: `main`
   - Root Directory: (leave empty)
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

3. **Environment Variables:**
   ```
   PYTHONPATH=/opt/render/project/src
   CORS_ORIGINS=https://json-toolkit.onrender.com
   ```

4. **Click "Create Web Service"**
   - Wait 5-10 minutes
   - Copy URL: `https://json-toolkit-api.onrender.com`

### Frontend Deployment

1. **New Static Site:**
   - Repository: Same GitHub repo
   - Name: `json-toolkit`
   - Branch: `main`
   - Root Directory: `frontend`
   - Build Command: `npm install && npm run build`
   - Publish Directory: `frontend/dist`

2. **Environment Variables:**
   ```
   VITE_API_URL=https://json-toolkit-api.onrender.com
   ```

3. **Click "Create Static Site"**
   - Wait 3-5 minutes
   - Your app is live!

---

## 🎨 Custom Domain (Optional)

### Render Custom Domain

1. Go to your service settings
2. Click "Custom Domains"
3. Add your domain
4. Update DNS records as instructed
5. SSL is automatic!

### Vercel Custom Domain

1. Go to project settings
2. Click "Domains"
3. Add your domain
4. Update DNS records
5. SSL is automatic!

---

## 🔍 Troubleshooting

### Issue: CORS Errors

**Solution:** Update `CORS_ORIGINS` in backend environment variables:
```
CORS_ORIGINS=https://your-frontend-url.vercel.app,https://your-frontend-url.onrender.com
```

### Issue: API Not Found

**Solution:** Check that `VITE_API_URL` is set correctly in frontend environment variables.

### Issue: Build Fails

**Solution:** 
- Check build logs
- Ensure all dependencies are in `requirements.txt` and `package.json`
- Verify Node.js and Python versions

### Issue: App Goes to Sleep (Render)

**Solution:** 
- Render free tier spins down after 15 minutes of inactivity
- First request after sleep takes ~30 seconds
- Consider upgrading to paid tier for always-on

---

## 💰 Free Tier Limits

### Render
- ✅ 750 hours/month (enough for 24/7)
- ⚠️ Spins down after 15 min inactivity
- ✅ Free SSL
- ✅ Custom domains

### Vercel
- ✅ Unlimited bandwidth (fair use)
- ✅ Unlimited deployments
- ✅ Free SSL
- ✅ Custom domains
- ✅ Global CDN

### Railway
- ✅ $5 credit/month
- ✅ ~500 hours of runtime
- ✅ Free SSL
- ⚠️ Credit expires monthly

### Fly.io
- ✅ 3 VMs free
- ✅ 3GB RAM total
- ✅ 160GB outbound data
- ✅ Free SSL

---

## 🚀 Quick Start Checklist

- [ ] Choose deployment platform
- [ ] Create API configuration file
- [ ] Update all API calls in JsonFormatter
- [ ] Update CORS settings
- [ ] Deploy backend first
- [ ] Get backend URL
- [ ] Set frontend environment variable
- [ ] Deploy frontend
- [ ] Test the live application
- [ ] (Optional) Add custom domain

---

## 📚 Additional Resources

- [Render Documentation](https://render.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Railway Documentation](https://docs.railway.app)
- [Fly.io Documentation](https://fly.io/docs)

---

## 🎉 You're Done!

Your JSON Toolkit is now live on the internet for free! Share your URL and enjoy your deployed application.

**Need help?** Check the troubleshooting section or open an issue on GitHub.

