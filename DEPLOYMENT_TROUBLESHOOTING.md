# 🔧 Deployment Troubleshooting Guide

## Network Error: Unable to connect to the server

If you're getting this error after deploying to Render, follow these steps:

### Step 1: Verify Backend is Running

1. **Check Backend Service Status**
   - Go to your Render dashboard
   - Open your backend service
   - Check if it's "Live" (green status)
   - If it's "Sleeping", click "Manual Deploy" to wake it up

2. **Test Backend URL**
   - Open your backend URL in browser: `https://your-backend-name.onrender.com`
   - You should see: `{"message": "JSON Toolkit - Professional JSON editing, formatting, and conversion tools"}`
   - Try the docs: `https://your-backend-name.onrender.com/docs`

### Step 2: Check Environment Variables

#### Frontend Environment Variables (Render Static Site)

1. Go to your **Frontend** service in Render
2. Click "Environment" tab
3. Verify `VITE_API_URL` is set:
   ```
   VITE_API_URL=https://your-backend-name.onrender.com
   ```
   - ⚠️ **Important**: Must include `https://` and the full URL
   - ⚠️ **Important**: No trailing slash

4. **If missing or incorrect:**
   - Add/Update the variable
   - Click "Save Changes"
   - **Redeploy** the frontend (Render will auto-redeploy)

#### Backend Environment Variables (Render Web Service)

1. Go to your **Backend** service in Render
2. Click "Environment" tab
3. Verify `CORS_ORIGINS` is set:
   ```
   CORS_ORIGINS=https://your-frontend-name.onrender.com
   ```
   - Replace with your actual frontend URL
   - Can include multiple URLs separated by commas

4. **If missing:**
   - Add the variable
   - Click "Save Changes"
   - **Redeploy** the backend

### Step 3: Verify URLs Match

**Frontend URL**: `https://your-frontend-name.onrender.com`  
**Backend URL**: `https://your-backend-name.onrender.com`

**Check:**
- ✅ Frontend `VITE_API_URL` = Backend URL
- ✅ Backend `CORS_ORIGINS` includes Frontend URL
- ✅ Both URLs use `https://` (not `http://`)

### Step 4: Check Browser Console

1. Open your deployed frontend
2. Open browser DevTools (F12)
3. Go to Console tab
4. Look for:
   - `API Base URL: https://...` (should show your backend URL)
   - Any CORS errors
   - Network request failures

### Step 5: Test API Directly

Open these URLs in your browser:

1. **Backend Root**: `https://your-backend-name.onrender.com/`
   - Should return JSON message

2. **Backend Docs**: `https://your-backend-name.onrender.com/docs`
   - Should show FastAPI docs

3. **Test Format Endpoint** (in browser console):
   ```javascript
   fetch('https://your-backend-name.onrender.com/format', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: '{"test": "data"}'
   }).then(r => r.json()).then(console.log)
   ```

### Step 6: Common Issues & Fixes

#### Issue: Backend is Sleeping
**Fix**: Render free tier spins down after 15 min inactivity
- First request takes ~30 seconds to wake up
- Consider upgrading to paid tier for always-on

#### Issue: CORS Error in Console
**Error**: `Access to fetch at '...' from origin '...' has been blocked by CORS policy`

**Fix**:
1. Check `CORS_ORIGINS` in backend includes frontend URL
2. Ensure URLs match exactly (including `https://`)
3. Redeploy backend after changing CORS_ORIGINS

#### Issue: 404 Not Found
**Error**: `Failed to fetch` or `404`

**Fix**:
1. Verify backend URL is correct
2. Check backend is actually running
3. Test backend URL directly in browser

#### Issue: Environment Variable Not Working
**Problem**: `VITE_API_URL` not being used

**Fix**:
1. **Important**: Environment variables must be set BEFORE building
2. In Render, set `VITE_API_URL` in Environment tab
3. **Redeploy** the frontend (this rebuilds with the env var)
4. Vite env vars must start with `VITE_` prefix

### Step 7: Manual Debugging

Add this to your browser console on the deployed site:

```javascript
// Check what API URL is being used
console.log('API Base URL:', import.meta.env.VITE_API_URL || 'Not set');

// Test API connection
fetch('https://your-backend-name.onrender.com/')
  .then(r => r.json())
  .then(data => console.log('Backend response:', data))
  .catch(err => console.error('Backend error:', err));
```

### Step 8: Render-Specific Checks

1. **Check Build Logs**
   - Frontend: Look for build errors
   - Backend: Look for startup errors

2. **Check Runtime Logs**
   - Backend: Look for request logs
   - Check if requests are reaching the backend

3. **Verify Service Types**
   - Backend: Should be "Web Service"
   - Frontend: Should be "Static Site"

### Quick Fix Checklist

- [ ] Backend service is "Live" (not sleeping)
- [ ] Frontend `VITE_API_URL` is set to backend URL
- [ ] Backend `CORS_ORIGINS` includes frontend URL
- [ ] Both services have been redeployed after env var changes
- [ ] URLs use `https://` (not `http://`)
- [ ] No trailing slashes in URLs
- [ ] Tested backend URL directly in browser
- [ ] Checked browser console for errors

### Still Not Working?

1. **Check Render Status Page**: https://status.render.com
2. **Review Render Logs**: Check both frontend and backend logs
3. **Test Locally**: Verify it works locally first
4. **Compare URLs**: Ensure frontend and backend URLs match exactly

### Alternative: Use Same Domain

If cross-origin is causing issues, you can:
1. Deploy frontend and backend on the same domain
2. Use nginx reverse proxy
3. Set `VITE_API_URL` to empty (will use same origin)

---

**Need more help?** Check the browser console and Render logs for specific error messages.

