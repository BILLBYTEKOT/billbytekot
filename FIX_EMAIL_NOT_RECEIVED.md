# 🔧 Fix: Emails Not Being Received

## Problem
Emails are not being received on production (Render).

## Root Cause
Environment variables for SMTP are not configured on Render server.

## Solution

### Step 1: Add Environment Variables to Render

1. **Go to Render Dashboard:**
   - https://dashboard.render.com

2. **Select Your Backend Service:**
   - Click on "restro-ai" or your backend service name

3. **Go to Environment Tab:**
   - Click "Environment" in the left sidebar

4. **Add These Variables:**

Click "Add Environment Variable" for each:

```
EMAIL_PROVIDER
smtp

SMTP_HOST
smtpout.secureserver.net

SMTP_PORT
587

SMTP_USER
shiv@billbytekot.in

SMTP_PASSWORD
n7_$l_w047

SMTP_FROM_EMAIL
shiv@billbytekot.in

SMTP_FROM_NAME
BillByteKOT

DEBUG_MODE
false
```

5. **Save Changes:**
   - Click "Save Changes"
   - Render will automatically redeploy (takes 2-3 minutes)

### Step 2: Wait for Deployment

- Watch the deployment logs
- Wait for "Live" status
- Should take 2-3 minutes

### Step 3: Test Email

**Test Registration:**
1. Go to https://billbytekot.in/login
2. Click "Register"
3. Fill in details with your email
4. Click "Register"
5. Check email for OTP

**Test Password Reset:**
1. Go to https://billbytekot.in/forgot-password
2. Enter your email
3. Click "Send OTP"
4. Check email for OTP

### Step 4: Check Render Logs

If still not working:

1. Go to Render Dashboard
2. Click on your service
3. Go to "Logs" tab
4. Look for:
   - "📧 REGISTRATION OTP EMAIL"
   - "📧 PASSWORD RESET OTP EMAIL"
   - Any error messages

## Quick Verification

### Check if Variables are Set:

In Render logs, you should see:
```
EMAIL_PROVIDER: smtp
SMTP_HOST: smtpout.secureserver.net
```

If you see:
```
EMAIL_PROVIDER: console
```

Then environment variables are NOT set correctly.

## Common Issues

### Issue 1: Variables Not Applied

**Solution:**
- Make sure you clicked "Save Changes"
- Wait for redeploy to complete
- Check "Environment" tab shows all variables

### Issue 2: Wrong Password

**Solution:**
- Double-check password: `n7_$l_w047`
- Make sure no extra spaces
- Special characters: `$` and `_`

### Issue 3: Port Blocked

**Solution:**
- Port 587 should work on Render
- If blocked, try port 465 (SSL)
- Update SMTP_PORT to 465

### Issue 4: GoDaddy SMTP Blocked

**Solution:**
- Login to GoDaddy webmail: https://email.secureserver.net
- Verify account is active
- Check if SMTP is enabled
- Contact GoDaddy support if needed

## Alternative: Use SendGrid (If GoDaddy Fails)

### Quick Setup:

1. **Sign up for SendGrid:**
   - https://sendgrid.com
   - Free tier: 100 emails/day

2. **Get API Key:**
   - Go to Settings → API Keys
   - Create API Key
   - Copy the key (starts with `SG.`)

3. **Update Render Variables:**
   ```
   EMAIL_PROVIDER=sendgrid
   SENDGRID_API_KEY=SG.your-api-key-here
   SMTP_FROM_EMAIL=shiv@billbytekot.in
   SMTP_FROM_NAME=BillByteKOT
   ```

4. **Verify Sender:**
   - Go to Settings → Sender Authentication
   - Verify shiv@billbytekot.in
   - Check email for verification link

## Testing Locally

To test if SMTP works:

```bash
cd backend
python test_email.py
```

Enter your email when prompted. If you receive the email, SMTP is working.

## Render Environment Variables Checklist

Make sure ALL these are set in Render:

- [ ] EMAIL_PROVIDER = smtp
- [ ] SMTP_HOST = smtpout.secureserver.net
- [ ] SMTP_PORT = 587
- [ ] SMTP_USER = shiv@billbytekot.in
- [ ] SMTP_PASSWORD = n7_$l_w047
- [ ] SMTP_FROM_EMAIL = shiv@billbytekot.in
- [ ] SMTP_FROM_NAME = BillByteKOT
- [ ] DEBUG_MODE = false

## Expected Behavior

### When Working:

**Registration:**
1. User fills form
2. Backend sends OTP email
3. User receives email within 1-2 minutes
4. Email contains 6-digit OTP
5. User enters OTP
6. Account created
7. Welcome email sent

**Password Reset:**
1. User enters email
2. Backend sends OTP email
3. User receives email within 1-2 minutes
4. Email contains 6-digit OTP
5. User enters OTP + new password
6. Password updated

### When Not Working:

**Console Mode (No Variables Set):**
- OTP logged to Render console
- No email sent
- User never receives OTP
- Registration/reset fails

## Quick Fix Commands

### Check Render Logs:
```bash
# In Render dashboard → Logs tab
# Look for:
"📧 REGISTRATION OTP EMAIL (Console Mode)"  # BAD - means no SMTP
"✅ SMTP connection successful!"            # GOOD - means SMTP working
```

### Force Redeploy:
1. Go to Render dashboard
2. Click "Manual Deploy"
3. Select "Clear build cache & deploy"
4. Wait for deployment

## Support

If still not working after following all steps:

1. **Check Render Logs** for specific errors
2. **Test SMTP locally** with test_email.py
3. **Verify GoDaddy account** is active
4. **Try SendGrid** as alternative
5. **Contact Render support** if port blocked

## Status After Fix

Once environment variables are added:

✅ Emails will be sent via GoDaddy SMTP
✅ Users will receive OTP emails
✅ Registration will work
✅ Password reset will work
✅ Welcome emails will be sent

---

**Estimated Fix Time:** 5 minutes
**Difficulty:** Easy
**Priority:** HIGH - Required for registration/password reset
