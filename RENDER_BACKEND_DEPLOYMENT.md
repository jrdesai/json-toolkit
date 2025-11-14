# 🚀 Render.com Backend Deployment Guide

Step-by-step instructions to deploy the JSON Toolkit backend to Render.com.

## Prerequisites

- ✅ GitHub account
- ✅ Code pushed to GitHub repository
- ✅ Render.com account (sign up at https://render.com - it's free!)

---

## Step 1: Sign Up / Log In to Render

1. Go to [https://render.com](https://render.com)
2. Click **"Get Started for Free"** or **"Sign In"**
3. Sign up with GitHub (recommended) or email
4. Verify your email if required

---

## Step 2: Create a New Web Service

1. In your Render dashboard, click the **"New +"** button (top right)
2. Select **"Web Service"** from the dropdown menu

---

## Step 3: Connect Your Repository

1. **Connect Repository:**
   - If using GitHub, click **"Connect account"** or **"Configure account"**
   - Authorize Render to access your GitHub repositories
   - Select your repository: `json-toolkit` (or your repo name)

2. **Select Repository:**
   - Choose your repository from the list
   - Click **"Connect"**

---

## Step 4: Configure Backend Service

Fill in the following settings:

### Basic Settings

- **Name**: `json-toolkit-backend` (or any name you prefer)
- **Region**: Choose closest to you (e.g., `Oregon (US West)`)
- **Branch**: `main` (or your default branch)
- **Root Directory**: Leave **empty** (or set to `.` if needed)

### Build & Deploy Settings

- **Environment**: Select **"Python 3"**
- **Build Command**: 
  ```
  pip install -r requirements.txt
  ```
- **Start Command**: 
  ```
  uvicorn app.main:app --host 0.0.0.0 --port $PORT
  ```

### Instance Type

- **Free**: Select **"Free"** (750 hours/month)
- Or choose a paid plan for always-on service

---

## Step 5: Add Environment Variables

Click **"Advanced"** → **"Add Environment Variable"** and add:

### Required Variables

1. **PYTHONPATH**
   - **Key**: `PYTHONPATH`
   - **Value**: `/opt/render/project/src`
   - **Description**: Python path for the application

2. **CORS_ORIGINS** (Important!)
   - **Key**: `CORS_ORIGINS`
   - **Value**: `https://your-frontend-name.onrender.com`
   - **Note**: Replace `your-frontend-name` with your actual frontend service name
   - **If frontend not deployed yet**: You can add this later and redeploy
   - **Multiple origins**: Separate with commas: `https://frontend1.onrender.com,https://frontend2.vercel.app`

### Optional Variables

3. **ENVIRONMENT**
   - **Key**: `ENVIRONMENT`
   - **Value**: `production`
   - **Description**: Environment identifier

4. **LOG_LEVEL**
   - **Key**: `LOG_LEVEL`
   - **Value**: `info`
   - **Description**: Logging level

---

## Step 6: Deploy

1. **Review Settings:**
   - Double-check all settings
   - Verify environment variables

2. **Click "Create Web Service"**
   - Render will start building your backend
   - This takes 5-10 minutes on first deploy

3. **Watch the Build:**
   - You'll see build logs in real-time
   - Wait for "Your service is live" message

---

## Step 7: Verify Deployment

### Check Service Status

1. **Dashboard:**
   - Service should show **"Live"** status (green)
   - If it shows "Sleeping", that's normal for free tier

2. **Get Your Backend URL:**
   - Copy the URL shown (e.g., `https://json-toolkit-backend.onrender.com`)
   - This is your backend API URL

### Test Backend

1. **Test Root Endpoint:**
   - Open: `https://your-backend-name.onrender.com/`
   - Should show: `{"message": "JSON Toolkit - Professional JSON editing, formatting, and conversion tools"}`

2. **Test API Documentation:**
   - Open: `https://your-backend-name.onrender.com/docs`
   - Should show FastAPI interactive documentation

3. **Test Health:**
   - Open: `https://your-backend-name.onrender.com/`
   - Should return JSON response

---

## Step 8: Update CORS (After Frontend Deployment)

Once you deploy your frontend:

1. Go to your **Backend** service in Render
2. Click **"Environment"** tab
3. Find `CORS_ORIGINS` variable
4. Update the value to include your frontend URL:
   ```
   https://your-frontend-name.onrender.com
   ```
5. Click **"Save Changes"**
6. Render will automatically redeploy

---

## 📋 Quick Reference

### Backend Configuration Summary

```
Name: json-toolkit-backend
Environment: Python 3
Build Command: pip install -r requirements.txt
Start Command: uvicorn app.main:app --host 0.0.0.0 --port $PORT
Instance Type: Free
```

### Environment Variables

```
PYTHONPATH=/opt/render/project/src
CORS_ORIGINS=https://your-frontend-name.onrender.com
ENVIRONMENT=production (optional)
LOG_LEVEL=info (optional)
```

### Your Backend URL

After deployment, your backend will be available at:
```
https://your-service-name.onrender.com
```

---

## 🔍 Troubleshooting

### Build Fails

**Error**: `ModuleNotFoundError` or dependency issues
- **Fix**: Check `requirements.txt` includes all dependencies
- Verify Python version compatibility

**Error**: `Command not found: uvicorn`
- **Fix**: Ensure `uvicorn` is in `requirements.txt`
- Check build logs for installation errors

### Service Won't Start

**Error**: Port binding issues
- **Fix**: Ensure start command uses `$PORT` (not hardcoded port)
- Verify `--host 0.0.0.0` is in start command

**Error**: Import errors
- **Fix**: Check `PYTHONPATH` is set correctly
- Verify project structure matches repository

### CORS Errors

**Error**: `CORS policy: No 'Access-Control-Allow-Origin' header`
- **Fix**: 
  1. Add frontend URL to `CORS_ORIGINS` environment variable
  2. Redeploy backend
  3. Ensure URLs match exactly (including `https://`)

### Service is Sleeping

**Issue**: First request takes 30+ seconds
- **Explanation**: Render free tier spins down after 15 min inactivity
- **Fix**: 
  - Wait for first request (it will wake up)
  - Or upgrade to paid tier for always-on

---

## 📝 Next Steps

After backend is deployed:

1. ✅ **Copy your backend URL** (e.g., `https://json-toolkit-backend.onrender.com`)
2. ✅ **Deploy frontend** (see `RENDER_FRONTEND_DEPLOYMENT.md`)
3. ✅ **Update CORS_ORIGINS** with frontend URL
4. ✅ **Test the full application**

---

## 🎉 Success Checklist

- [ ] Backend service shows "Live" status
- [ ] Root endpoint returns JSON: `https://your-backend.onrender.com/`
- [ ] API docs accessible: `https://your-backend.onrender.com/docs`
- [ ] Environment variables are set
- [ ] CORS_ORIGINS includes frontend URL (after frontend deployment)
- [ ] Backend URL copied for frontend configuration

---

**Your backend is now live! 🚀**

Next: Deploy the frontend and connect them together.

