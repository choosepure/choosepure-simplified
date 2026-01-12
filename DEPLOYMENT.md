# 🚀 Deployment Guide - ChoosePure Simplified

## Quick Deployment Overview

### Backend → Render
### Frontend → Vercel

---

## 🖥️ Backend Deployment (Render)

### Step 1: Prepare for Deployment

1. **Ensure your code is on GitHub** (follow GITHUB_SETUP.md first)

2. **Update server.py for production:**
```python
# Add this to server.py for production
import os
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8001))
    uvicorn.run(app, host="0.0.0.0", port=port)
```

### Step 2: Deploy to Render

1. **Go to [render.com](https://render.com)** and sign up/login
2. **Connect GitHub** account
3. **Create New Web Service**
4. **Select your repository:** `choosepure-simplified`
5. **Configure settings:**
   - **Name:** `choosepure-simplified-api`
   - **Root Directory:** `backend`
   - **Environment:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `python server.py`

### Step 3: Environment Variables

Add these environment variables in Render:

```env
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/choosepure_simplified
DB_NAME=choosepure_simplified
SECRET_KEY=your-production-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
MAILGUN_API_KEY=your-mailgun-api-key
MAILGUN_DOMAIN=your-domain.com
MAILGUN_FROM_EMAIL=noreply@your-domain.com
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret
ENVIRONMENT=production
```

### Step 4: Deploy

1. Click **"Create Web Service"**
2. Wait for deployment (5-10 minutes)
3. Note your backend URL: `https://choosepure-simplified-api.onrender.com`

---

## 🌐 Frontend Deployment (Vercel)

### Step 1: Prepare Frontend

1. **Update API URL** in frontend code to use environment variable
2. **Build optimization** is already configured

### Step 2: Deploy to Vercel

1. **Go to [vercel.com](https://vercel.com)** and sign up/login
2. **Import Project** from GitHub
3. **Select repository:** `choosepure-simplified`
4. **Configure settings:**
   - **Framework Preset:** `Create React App`
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build` (auto-detected)
   - **Output Directory:** `build` (auto-detected)

### Step 3: Environment Variables

Add this environment variable in Vercel:

```env
REACT_APP_API_URL=https://choosepure-simplified-api.onrender.com/api/v2
```

**Important:** Replace with your actual Render backend URL (no trailing slash)

### Step 4: Deploy

1. Click **"Deploy"**
2. Wait for deployment (2-3 minutes)
3. Your app will be live at: `https://choosepure-simplified.vercel.app`

---

## 🗄️ Database Setup (MongoDB Atlas)

### Step 1: Create MongoDB Cluster

1. **Go to [mongodb.com/atlas](https://www.mongodb.com/atlas)**
2. **Create free cluster**
3. **Create database user**
4. **Whitelist IP addresses** (0.0.0.0/0 for development)

### Step 2: Get Connection String

1. **Click "Connect"** on your cluster
2. **Choose "Connect your application"**
3. **Copy connection string**
4. **Replace `<password>` with your database user password**

### Step 3: Update Environment Variables

Update `MONGO_URL` in your Render environment variables with the connection string.

---

## 🔧 Post-Deployment Configuration

### Update CORS Settings

In `backend/server.py`, update CORS for production:

```python
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=[
        "https://choosepure-simplified.vercel.app",
        "http://localhost:3000"  # Keep for development
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Test Deployment

1. **Visit your frontend URL**
2. **Test user registration flow**
3. **Test voting functionality**
4. **Test dashboard access**
5. **Verify API calls work**

---

## 📊 Monitoring & Analytics

### Set Up Monitoring

1. **Render Metrics:** Built-in monitoring
2. **Vercel Analytics:** Enable in project settings
3. **MongoDB Monitoring:** Atlas provides metrics

### Performance Optimization

1. **Enable Vercel Analytics**
2. **Set up error tracking** (Sentry)
3. **Monitor API response times**
4. **Track conversion funnel metrics**

---

## 🔄 Continuous Deployment

### Automatic Deployments

Both Render and Vercel will automatically deploy when you push to GitHub:

1. **Push to main branch**
2. **Render rebuilds backend** (5-10 minutes)
3. **Vercel rebuilds frontend** (2-3 minutes)
4. **Changes go live automatically**

### Deployment Checklist

- [ ] Backend deployed to Render
- [ ] Frontend deployed to Vercel
- [ ] Database connected and seeded
- [ ] Environment variables configured
- [ ] CORS settings updated
- [ ] Test all user flows
- [ ] Monitor error logs
- [ ] Set up analytics tracking

---

## 🚨 Troubleshooting

### Common Issues

**Backend not starting:**
- Check environment variables
- Verify MongoDB connection
- Check Render logs

**Frontend API calls failing:**
- Verify REACT_APP_API_URL
- Check CORS settings
- Ensure backend is running

**Database connection issues:**
- Check MongoDB Atlas IP whitelist
- Verify connection string
- Check database user permissions

### Getting Help

1. **Check deployment logs** in Render/Vercel
2. **Monitor error tracking**
3. **Test locally first**
4. **Check environment variables**

---

## 🎉 Success!

Once deployed, you'll have:

- ✅ **Live backend API** on Render
- ✅ **Live frontend app** on Vercel  
- ✅ **MongoDB database** on Atlas
- ✅ **Automatic deployments** from GitHub
- ✅ **Production-ready** simplified user flow

**Share your live demo:** `https://choosepure-simplified.vercel.app`

---

**🚀 Your simplified ChoosePure platform is now live and ready to improve conversion rates!**