# 🚀 Quick Fix: Add Environment Variables to Render

## Problem
Emails not working on production because SMTP variables are missing on Render.

## Solution (5 minutes)

### Step 1: Go to Render Dashboard
1. Open: https://dashboard.render.com
2. Login with your account
3. Click on your backend service (probably named "restro-ai" or similar)

### Step 2: Add Environment Variables

1. Click **"Environment"** in the left sidebar
2. Click **"Add Environment Variable"** button
3. Add these 8 variables one by one:

```
Variable Name: EMAIL_PROVIDER
Value: smtp

Variable Name: SMTP_HOST
Value: smtpout.secureserver.net

Variable Name: SMTP_PORT
Value: 587

Variable Name: SMTP_USER
Value: shiv@billbytekot.in

Variable Name: SMTP_PASSWORD
Value: n7_$l_w047

Variable Name: SMTP_FROM_EMAIL
Value: shiv@billbytekot.in

Variable Name: SMTP_FROM_NAME
Value: BillByteKOT

Variable Name: DEBUG_MODE
Value: false
```

### Step 3: Save and Deploy

1. Click **"Save Changes"** button at the bottom
2. Render will automatically redeploy (takes 2-3 minutes)
3. Wait for status to show **"Live"**

### Step 4: Test

**Test Registration:**
1. Go to: https://billbytekot.in/login
2. Click "Register"
3. Fill in your email
4. Check email for OTP (should arrive in 1-2 minutes)

**Test Password Reset:**
1. Go to: https://billbytekot.in/forgot-password
2. Enter your email
3. Check email for OTP

## Verify It's Working

### Check Render Logs:
1. In Render dashboard, click **"Logs"** tab
2. Look for: `✅ SMTP connection successful!`
3. If you see: `EMAIL_PROVIDER: console` - variables not applied yet

### Check Email:
- OTP should arrive within 1-2 minutes
- Check spam folder if not in inbox
- Email from: shiv@billbytekot.in

## That's It!

Once variables are added and service redeployed:
- ✅ Registration emails will work
- ✅ Password reset emails will work
- ✅ Welcome emails will be sent
- ✅ All OTP emails will be delivered

---

**Time Required:** 5 minutes
**Difficulty:** Easy
**Status:** Required for production
