# EAS CI/CD Setup Guide

This guide will help you set up automatic APK builds using GitHub Actions and EAS (Expo Application Services).

## Prerequisites

1. **Expo Account**: You need an Expo account (free tier works)
2. **EAS CLI**: Should be installed locally for initial setup
3. **GitHub Repository**: Your code should be in a GitHub repository

## Step-by-Step Setup

### 1. Install EAS CLI (if not already installed)

```bash
npm install -g eas-cli
```

### 2. Login to EAS

```bash
cd mobile
eas login
```

### 3. Configure EAS Project

If you haven't already configured your project with EAS:

```bash
cd mobile
eas build:configure
```

This will link your project to your Expo account.

### 4. Generate an Expo Access Token

This token allows GitHub Actions to authenticate with EAS:

```bash
eas whoami
```

Then create a personal access token:

1. Go to https://expo.dev/accounts/[your-account]/settings/access-tokens
2. Click "Create Token"
3. Give it a name like "GitHub Actions CI/CD"
4. Select appropriate scopes (at minimum: read:projects, write:builds)
5. Copy the generated token (you won't see it again!)

### 5. Add GitHub Secrets

Go to your GitHub repository:

1. Navigate to: **Settings** → **Secrets and variables** → **Actions**
2. Click **"New repository secret"**
3. Add the following secrets:

   - **EXPO_TOKEN**: Paste the access token from step 4
   - **EXPO_ACCOUNT** (optional): Your Expo account username/slug

### 6. Configure Android Build Credentials

You need to set up Android credentials for EAS builds:

```bash
cd mobile
eas build --platform android --profile production
```

The first time you run this, EAS will:
- Ask if you want to generate a new keystore (choose Yes if you don't have one)
- Create and manage the Android signing credentials for you

**Important**: Let EAS manage your credentials in the cloud for CI/CD to work smoothly.

### 7. Test the Workflow

You can test the workflow in two ways:

#### Option A: Push to main branch
```bash
git add .
git commit -m "Setup EAS CI/CD"
git push origin main
```

#### Option B: Manual trigger
1. Go to GitHub: **Actions** tab
2. Select "EAS Build APK" workflow
3. Click "Run workflow"
4. Select the branch and click "Run workflow"

### 8. Monitor Your Build

After triggering:

1. Check the **Actions** tab in your GitHub repository
2. Click on the running workflow to see logs
3. Visit https://expo.dev to see the actual EAS build progress
4. Once complete, download your APK from the Expo dashboard

## Workflow Behavior

The workflow will:
- ✅ Trigger automatically on pushes to `main` branch (only when files in `mobile/` change)
- ✅ Allow manual triggering from GitHub UI
- ✅ Build an Android APK using the `production` profile
- ✅ Use EAS cloud build service
- ✅ The build runs asynchronously (doesn't wait for completion in GitHub Actions)

## Important Notes

1. **Build Duration**: EAS builds can take 10-20 minutes depending on queue
2. **EAS Pricing**: Free tier has limited builds per month. Check https://expo.dev/pricing
3. **Credentials**: EAS manages your Android keystore in the cloud
4. **Build Artifact**: APK will be available on https://expo.dev dashboard
5. **Notifications**: You'll receive email notifications when builds complete

## Downloading the APK

After a successful build:

1. Go to https://expo.dev
2. Navigate to your project
3. Click on "Builds"
4. Find your latest build
5. Click "Download" to get the APK

## Advanced Configuration

### Auto-download APK to GitHub Artifacts

If you want to automatically download the APK to GitHub Actions artifacts, you'll need to:

1. Wait for the build to complete in the workflow
2. Use EAS CLI to download the artifact
3. Upload it to GitHub Actions artifacts

This requires modifying the workflow to use `--wait` flag and additional steps. Let me know if you need this functionality!

### Build on Pull Requests

To build on PRs, modify the workflow trigger:

```yaml
on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main
    paths:
      - 'mobile/**'
```

## Troubleshooting

### Build fails with authentication error
- Verify `EXPO_TOKEN` secret is correctly set
- Check token hasn't expired
- Ensure token has proper scopes

### Build fails with credentials error
- Run `eas credentials` locally to verify Android keystore exists
- Ensure EAS is managing credentials (not local keystore)

### Workflow doesn't trigger
- Verify you pushed to the `main` branch
- Check that files in `mobile/` directory were changed
- Check GitHub Actions is enabled for the repository

## Next Steps

- Consider setting up different build profiles (development, preview, production)
- Implement automatic versioning
- Set up notifications (Slack, Discord, etc.)
- Configure code signing for production releases

---

For more information, visit:
- EAS Build Documentation: https://docs.expo.dev/build/introduction/
- GitHub Actions Documentation: https://docs.github.com/en/actions
