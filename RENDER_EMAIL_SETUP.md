# Render Email Configuration - GoDaddy SMTP

## Current Configuration

Your GoDaddy SMTP credentials:
- **Host:** smtpout.secureserver.net
- **Port:** 587
- **User:** shiv@billbytekot.in
- **From:** shiv@billbytekot.in

## Step 1: Update Render Environment Variables

1. **Go to Render Dashboard:**
   - https://dashboard.render.com

2. **Select Your Backend Service:**
   - Click on your "restro-ai" or backend service

3. **Go to Environment Tab:**
   - Click "Environment" in the left sidebar

4. **Add/Update These Variables:**

   Click "Add Environment Variable" for each:

   ```
   Key: EMAIL_PROVIDER
   Value: smtp
   ```

   ```
   Key: SMTP_HOST
   Value: smtpout.secureserver.net
   ```

   ```
   Key: SMTP_PORT
   Value: 587
   ```

   ```
   Key: SMTP_USER
   Value: shiv@billbytekot.in
   ```

   ```
   Key: SMTP_PASSWORD
   Value: n7_$l_w047
   ```

   ```
   Key: SMTP_FROM_EMAIL
   Value: shiv@billbytekot.in
   ```

   ```
   Key: SMTP_FROM_NAME
   Value: BillByteKOT
   ```

   ```
   Key: DEBUG_MODE
   Value: false
   ```

5. **Save Changes:**
   - Click "Save Changes" button
   - Render will automatically redeploy your service

6. **Wait for Deployment:**
   - Wait 2-3 minutes for deployment to complete
   - Check deployment logs for any errors

## Step 2: Test Email Sending

### Option A: Test via Website
1. Go to https://billbytekot.in/forgot-password
2. Enter your email: shiv@billbytekot.in
3. Click "Send Reset Instructions"
4. Check your inbox (and spam folder)

### Option B: Test via Python Script
```bash
cd backend
python test_email.py
```

Enter your email when prompted to receive a test email.

### Option C: Test via API
```bash
curl -X POST https://restro-ai.onrender.com/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "shiv@billbytekot.in"}'
```

## Step 3: Verify Email Delivery

### Check Inbox:
- Look for email from "BillByteKOT <shiv@billbytekot.in>"
- Subject: "Reset Your BillByteKOT Password"
- Should have reset link button

### Check Spam Folder:
- First few emails might go to spam
- Mark as "Not Spam" to improve delivery

### Check Render Logs:
1. Go to Render dashboard
2. Click on your service
3. Go to "Logs" tab
4. Look for email sending logs

## Troubleshooting

### Issue: Emails Not Sending

**Check 1: Render Environment Variables**
- Verify all variables are set correctly
- No typos in variable names
- Password is correct (n7_$l_w047)

**Check 2: GoDaddy SMTP Settings**
- Verify SMTP is enabled in GoDaddy
- Check if email account is active
- Try logging into webmail: https://email.secureserver.net

**Check 3: Render Logs**
```
Look for errors like:
- "SMTP connection failed"
- "Authentication failed"
- "Connection timeout"
```

### Issue: Emails Going to Spam

**Solution 1: SPF Record**
Add to your DNS (GoDaddy):
```
Type: TXT
Name: @
Value: v=spf1 include:secureserver.net ~all
TTL: 1 Hour
```

**Solution 2: DKIM (Optional)**
Contact GoDaddy support to enable DKIM for your domain

**Solution 3: Warm Up Email**
- Send a few test emails first
- Mark them as "Not Spam"
- Reply to them
- This improves sender reputation

### Issue: Authentication Failed

**Check Password:**
- Password: n7_$l_w047
- Make sure special characters are correct
- Try resetting password in GoDaddy if needed

**Check Email Account:**
- Login to webmail: https://email.secureserver.net
- Username: shiv@billbytekot.in
- Verify account is active

### Issue: Connection Timeout

**Check Port:**
- Port 587 (TLS/STARTTLS) - Recommended
- Alternative: Port 465 (SSL)
- Alternative: Port 25 (Plain)

**Try Alternative Port:**
If 587 doesn't work, try:
```
SMTP_PORT=465
```

## GoDaddy SMTP Limits

- **Hourly Limit:** 250 emails/hour
- **Daily Limit:** 500 emails/day
- **Monthly Limit:** 10,000 emails/month

For higher limits, consider upgrading or using SendGrid/Mailgun.

## Testing Checklist

- [ ] Environment variables added to Render
- [ ] Service redeployed successfully
- [ ] Test email sent via website
- [ ] Email received in inbox
- [ ] Reset link works correctly
- [ ] Email not in spam folder
- [ ] SPF record added to DNS

## Production Checklist

- [ ] Email provider configured (SMTP)
- [ ] Environment variables set in Render
- [ ] Test emails working
- [ ] SPF record configured
- [ ] Emails not going to spam
- [ ] Password reset flow tested end-to-end
- [ ] OTP emails working (if used)

## Alternative: Use SendGrid

If GoDaddy SMTP has issues, consider SendGrid:

1. **Sign up:** https://sendgrid.com (Free 100/day)
2. **Get API Key**
3. **Update Render variables:**
   ```
   EMAIL_PROVIDER=sendgrid
   SENDGRID_API_KEY=SG.your-key-here
   SMTP_FROM_EMAIL=shiv@billbytekot.in
   SMTP_FROM_NAME=BillByteKOT
   ```

SendGrid advantages:
- Better deliverability
- Detailed analytics
- No spam issues
- Higher limits

## Support

If you need help:
1. Check Render logs for errors
2. Test SMTP connection with test_email.py
3. Verify GoDaddy email account is active
4. Check DNS records (SPF)
5. Contact GoDaddy support if needed

---

**Status:** Ready to configure
**Next Step:** Add environment variables to Render
**Test Email:** shiv@billbytekot.in
