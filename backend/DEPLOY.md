# Railway Deployment Guide - El-Tetu Backend

This guide will walk you through deploying the El-Tetu Django backend to Railway.

## Prerequisites

- Git repository with your code
- Railway account (sign up at https://railway.app)
- GitHub account (for repository connection)

## Overview

The backend will be deployed with:
- **Framework**: Django 5.2.7 with Django REST Framework
- **Database**: PostgreSQL (Railway managed service)
- **Web Server**: Gunicorn with 3 workers
- **Static Files**: Served via WhiteNoise
- **Auto-deployment**: Migrations and user creation on each deploy

---

## Step 1: Install Railway CLI (Optional but Recommended)

```bash
# Windows (PowerShell)
iwr https://railway.app/install.ps1 | iex

# macOS/Linux
curl -fsSL https://railway.app/install.sh | sh

# Verify installation
railway --version

# Login to Railway
railway login
```

---

## Step 2: Create Railway Project

### Option A: Using Railway Dashboard (Recommended for First Time)

1. Go to https://railway.app/dashboard
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Authenticate with GitHub and select your `El-Tetu` repository
5. Railway will detect your repository

### Option B: Using Railway CLI

```bash
# Navigate to your backend directory
cd backend

# Initialize new Railway project
railway init

# Link to your Railway project (if already created)
railway link
```

---

## Step 3: Add PostgreSQL Database

1. In your Railway project dashboard, click **"New"** → **"Database"** → **"Add PostgreSQL"**
2. Railway will automatically provision a PostgreSQL database
3. The `DATABASE_URL` variable will be automatically available to your backend service
4. **Important**: Make sure both services are in the same project

---

## Step 4: Configure Backend Service

### 4.1 Set Root Directory

If you deployed the entire repository:
1. Go to your backend service settings
2. Under **"Settings"** → **"Build"**
3. Set **Root Directory**: `backend`
4. Railway should auto-detect the Dockerfile

### 4.2 Configure Environment Variables

In Railway Dashboard → Your Backend Service → **"Variables"** tab, add:

```bash
# Required Variables
SECRET_KEY=<generate-with-command-below>
DEBUG=False
ALLOWED_HOSTS=*.railway.app

# JWT Settings (optional - defaults are configured)
JWT_ACCESS_TOKEN_LIFETIME_MINUTES=60
JWT_REFRESH_TOKEN_LIFETIME_DAYS=7

# CORS - Update after deployment with your mobile app URL
CORS_ALLOWED_ORIGINS=https://your-mobile-app.com
```

#### Generate SECRET_KEY

Run this command locally to generate a secure secret key:

```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

Copy the output and paste it as the `SECRET_KEY` value in Railway.

### 4.3 Connect Database

Railway should automatically connect the PostgreSQL database to your backend service.

Verify by checking that `DATABASE_URL` appears in your environment variables (it should be automatically added).

---

## Step 5: Deploy

### Option A: Deploy via Git Push

```bash
# Commit your changes
git add .
git commit -m "Configure for Railway deployment"
git push origin main

# Railway will automatically deploy on push
```

### Option B: Deploy via Railway CLI

```bash
# From the backend directory
railway up

# Or deploy specific branch
railway up --branch main
```

---

## Step 6: Verify Deployment

### 6.1 Check Build Logs

1. Go to Railway Dashboard → Your Backend Service
2. Click on **"Deployments"** tab
3. Watch the build logs for any errors
4. You should see:
   - ✅ "Running database migrations..."
   - ✅ "Collecting static files..."
   - ✅ "Creating initial users..."
   - ✅ "Starting Gunicorn server..."

### 6.2 Get Your Backend URL

1. In Railway Dashboard → Backend Service → **"Settings"**
2. Under **"Networking"**, you'll see your public URL
3. It will look like: `https://your-app-name.railway.app`
4. **Save this URL** - you'll need it for your mobile app

### 6.3 Test the API

Open your browser or use curl to test:

```bash
# Health check (should return available endpoints)
curl https://your-app-name.railway.app/api/

# Admin panel
https://your-app-name.railway.app/admin/
```

---

## Step 7: Access Django Admin

### Default Test Users

The deployment automatically creates these test users:

| Email | Password | Role |
|-------|----------|------|
| admin@mail.com | admin123 | Admin |
| vendedor@mail.com | vendedor123 | Vendedor |
| cliente@mail.com | cliente123 | Cliente |

### Access Admin Panel

1. Navigate to: `https://your-app-name.railway.app/admin/`
2. Login with: `admin@mail.com` / `admin123`
3. **⚠️ IMPORTANT**: Change the admin password immediately!

```python
# In Django admin or via Railway CLI:
railway run python manage.py changepassword admin@mail.com
```

---

## Step 8: Update CORS for Mobile App

After deployment, update the CORS settings:

1. In Railway Dashboard → Backend Service → **"Variables"**
2. Update `CORS_ALLOWED_ORIGINS` with your actual frontend/mobile URLs:

```bash
# Example for Expo app
CORS_ALLOWED_ORIGINS=https://your-app.railway.app,exp://your-expo-app

# Multiple origins (comma-separated, no spaces)
CORS_ALLOWED_ORIGINS=https://domain1.com,https://domain2.com,https://app.example.com
```

3. Railway will automatically redeploy with the new settings

---

## Step 9: Configure Mobile App

Update your mobile app's API URL:

In your Expo/React Native app:

```env
# .env or app.json
EXPO_PUBLIC_API_URL=https://your-app-name.railway.app/api
```

---

## Post-Deployment Checklist

- [ ] Backend is successfully deployed and accessible
- [ ] Database migrations completed without errors
- [ ] Admin panel is accessible at `/admin/`
- [ ] Test users can login via API (`/api/auth/login/`)
- [ ] Changed default admin password
- [ ] Updated `CORS_ALLOWED_ORIGINS` with real domains
- [ ] Tested API endpoints from mobile app
- [ ] Verified product images upload (note: files are ephemeral)
- [ ] Set up monitoring/alerts (optional)

---

## Useful Railway CLI Commands

```bash
# View logs in real-time
railway logs

# Run Django management commands
railway run python manage.py createsuperuser
railway run python manage.py shell

# Open Railway dashboard
railway open

# Check environment variables
railway variables

# Restart service
railway restart

# Connect to PostgreSQL database
railway connect postgres
```

---

## Database Management

### Run Migrations Manually

If you need to run migrations manually:

```bash
railway run python manage.py migrate
```

### Create a Backup

```bash
# Export database
railway run python manage.py dumpdata > backup.json

# Restore database
railway run python manage.py loaddata backup.json
```

### Access Database Directly

```bash
# Using Railway CLI
railway connect postgres

# Using connection string
railway variables get DATABASE_URL
# Copy the URL and connect with your preferred PostgreSQL client
```

---

## Troubleshooting

### Build Fails

**Error**: "Could not find Dockerfile"
- **Solution**: Set Root Directory to `backend` in service settings

**Error**: "Package installation failed"
- **Solution**: Check `requirements.txt` for any platform-specific dependencies

### Deployment Succeeds but App Crashes

**Check logs**:
```bash
railway logs
```

**Common issues**:
- Missing environment variables (especially `SECRET_KEY`)
- Database connection issues (check `DATABASE_URL`)
- Port binding issues (Railway auto-sets `$PORT`)

### Database Connection Errors

**Error**: "FATAL: database doesn't exist"
- **Solution**: Wait a few minutes for PostgreSQL to fully provision
- Redeploy the backend service

**Error**: "Connection refused"
- **Solution**: Verify PostgreSQL service is running in Railway dashboard
- Check that services are in the same Railway project

### CORS Errors from Mobile App

**Error**: "Access-Control-Allow-Origin blocked"
- **Solution**: Add your mobile app's domain to `CORS_ALLOWED_ORIGINS`
- For Expo Go: Include the Expo URL (shown in Expo terminal)
- For production builds: Include your production domains

### Static Files Not Loading

**Error**: 404 on `/static/` files
- **Solution**: Railway runs `collectstatic` automatically in the entrypoint script
- Verify in deployment logs that "Collecting static files..." succeeded
- Check `STATIC_ROOT` and `STATICFILES_STORAGE` in settings.py

### Media Files Disappearing

**Note**: Railway uses ephemeral storage - uploaded files are lost on redeploy.

**Solution**: Integrate cloud storage (future enhancement)
- Cloudinary (recommended for images)
- AWS S3
- Railway Volumes (for persistent storage)

---

## Production Best Practices

### Security

1. **Never commit `.env` files** to git
2. Use strong, unique `SECRET_KEY` (generated randomly)
3. Change default test user passwords
4. Set `DEBUG=False` in production
5. Regularly update dependencies

### Monitoring

1. Enable Railway monitoring in dashboard
2. Set up uptime monitoring (UptimeRobot, Pingdom)
3. Monitor database size and performance

### Scaling

As your app grows:
1. Increase Gunicorn workers: `--workers $((2 * CPU_CORES + 1))`
2. Enable Railway autoscaling
3. Consider database read replicas
4. Add Redis for caching

---

## Cost Estimation

Railway pricing (as of 2024):
- **Hobby Plan**: $5/month + usage
- **PostgreSQL**: ~$5-10/month (usage-based)
- **Backend Service**: ~$5-10/month (usage-based)

**Estimated monthly cost**: $10-20 for low-medium traffic

Railway offers $5 free credit monthly for hobby tier.

---

## Support & Resources

- **Railway Docs**: https://docs.railway.app
- **Django Deployment Checklist**: https://docs.djangoproject.com/en/5.0/howto/deployment/checklist/
- **Railway Discord**: https://discord.gg/railway

---

## Next Steps

After successful deployment:

1. **Add Media Storage**: Integrate Cloudinary or S3 for persistent image uploads
2. **Custom Domain**: Configure a custom domain in Railway settings
3. **CI/CD**: Set up automated testing before deployment
4. **Monitoring**: Add Sentry for error tracking
5. **Caching**: Add Redis for improved performance
6. **Email**: Configure email backend for notifications

---

**Deployment Date**: _________
**Backend URL**: _________
**Database**: PostgreSQL on Railway
**Status**: ✅ Deployed
