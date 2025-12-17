# 🔍 Debug 403 Issue - Step by Step

## Current Status
- ✅ Code pushed to GitHub
- ⏳ Vercel deploying (1-2 minutes)
- ⏳ Render deploying (2-3 minutes)

## Wait 3 Minutes Then Test

### Step 1: Clear Everything
```
1. Open browser
2. Press Ctrl + Shift + Delete
3. Select "All time"
4. Check: Cookies, Cache, Site data
5. Click "Clear data"
6. Close browser
7. Open browser again
```

### Step 2: Login Fresh
```
1. Go to: https://billbytekot.in/login
2. Enter username and password
3. Click "Login"
4. Should redirect to dashboard
```

### Step 3: Check Token in Console
```
1. Press F12 (open DevTools)
2. Go to Console tab
3. Type: localStorage.getItem('token')
4. Press Enter
5. Should see a long string starting with "eyJ..."
```

### Step 4: Check User Data
```
1. In console, type: localStorage.getItem('user')
2. Press Enter
3. Should see user object with "role": "admin"
```

### Step 5: Test Settings API
```
1. In console, type:
fetch('https://restro-ai.onrender.com/api/business/settings', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  }
}).then(r => r.json()).then(console.log)

2. Press Enter
3. Should see settings data, NOT 403 error
```

---

## If Still Getting 403

### Check 1: Token Format
```javascript
// In console
const token = localStorage.getItem('token');
console.log('Token length:', token.length);
console.log('Token starts with:', token.substring(0, 20));
// Should be 200+ characters, start with "eyJ"
```

### Check 2: Decode Token
```javascript
// In console
const token = localStorage.getItem('token');
const parts = token.split('.');
const payload = JSON.parse(atob(parts[1]));
console.log('Token payload:', payload);
// Should have: user_id, role, exp
```

### Check 3: Token Expiry
```javascript
// In console
const token = localStorage.getItem('token');
const payload = JSON.parse(atob(token.split('.')[1]));
const expiry = new Date(payload.exp * 1000);
const now = new Date();
console.log('Token expires:', expiry);
console.log('Current time:', now);
console.log('Is expired:', expiry < now);
// Should be NOT expired
```

### Check 4: Network Request
```
1. Open DevTools (F12)
2. Go to Network tab
3. Refresh page
4. Look for "business/settings" request
5. Click on it
6. Go to "Headers" tab
7. Look for "Authorization" header
8. Should see: "Bearer eyJ..."
```

---

## Common Issues

### Issue 1: Old Token Cached
**Symptom:** Token is expired
**Fix:**
```javascript
localStorage.clear();
window.location.href = '/login';
```

### Issue 2: Vercel Not Deployed
**Symptom:** Old code still running
**Fix:**
- Wait 2-3 minutes
- Check: https://vercel.com/dashboard
- Look for latest deployment

### Issue 3: Token Not Sent
**Symptom:** No Authorization header in Network tab
**Fix:**
- Clear cache
- Login again
- Check axios defaults

### Issue 4: Backend Not Deployed
**Symptom:** 403 from backend
**Fix:**
- Check Render logs
- Wait for deployment
- Look for "✅ Database connected"

---

## Manual API Test

### Test with curl:
```bash
# Replace YOUR_TOKEN with actual token from localStorage
curl https://restro-ai.onrender.com/api/business/settings \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected:** Settings JSON
**If 403:** Token is invalid or expired

---

## Check Render Logs

1. Go to: https://dashboard.render.com
2. Click your backend service
3. Go to "Logs" tab
4. Look for errors:

**Good:**
```
✅ Database connected: restrobill
✅ Database indexes created successfully
```

**Bad:**
```
❌ Invalid token: no user_id in payload
❌ User not found: xxx
❌ Token expired
```

---

## Force New Token

### Option 1: Logout and Login
```
1. Click logout
2. Login again
3. New token generated
```

### Option 2: Clear and Login
```javascript
// In console
localStorage.clear();
window.location.href = '/login';
```

### Option 3: Register New Account
```
1. Go to /login
2. Click "Register"
3. Create new account
4. Test with new account
```

---

## Timeline

**0-2 min:** Vercel deploying frontend
**2-3 min:** Render deploying backend
**3-5 min:** Test everything

**After 5 minutes:**
1. Clear browser cache
2. Login fresh
3. Should work

---

## If STILL Not Working After 5 Minutes

### Check Deployment Status:

**Vercel:**
- Go to: https://vercel.com/dashboard
- Check latest deployment
- Should be "Ready"

**Render:**
- Go to: https://dashboard.render.com
- Check service status
- Should be "Live"

### Check Logs:

**Render Logs:**
```
Look for:
✅ Database connected
✅ Database indexes created
❌ Any errors
```

**Browser Console:**
```
Look for:
- Token value
- User data
- Network errors
- 403 responses
```

---

## Expected Timeline

| Time | Status |
|------|--------|
| 0 min | Code pushed |
| 1 min | Vercel building |
| 2 min | Vercel deployed ✅ |
| 3 min | Render deployed ✅ |
| 4 min | Clear cache |
| 5 min | Login and test |
| 6 min | Should work ✅ |

---

## Contact Info

If still not working after 10 minutes:
1. Check Render logs for specific error
2. Check browser console for token
3. Try registering new account
4. Share error message from logs

---

**Current Time:** Wait 3 minutes then test
**Status:** Deploying...
**ETA:** 3 minutes
