# 🛡️ Super Admin Panel - Setup Guide

## What Is This?

A **secret admin panel** for you (site owner) to:
- Monitor all users and subscriptions
- Manage support tickets
- View system analytics
- Manually activate/deactivate subscriptions
- Delete users and their data
- View system health

**This is NOT visible to regular users!**

---

## Setup (5 Minutes)

### Step 1: Set Super Admin Credentials in Render

1. Go to: https://dashboard.render.com
2. Click your backend service
3. Go to "Environment" tab
4. Add these variables:

```
SUPER_ADMIN_USERNAME
your-secret-username

SUPER_ADMIN_PASSWORD
your-super-secure-password-123
```

**IMPORTANT:** Use strong credentials! This has full access to everything.

### Step 2: Save and Deploy

1. Click "Save Changes"
2. Wait 2-3 minutes for redeploy

### Step 3: Access Your Admin Panel

1. Go to: **https://billbytekot.in/super-admin-panel-secret**
2. Enter your super admin username and password
3. You're in!

---

## Features

### Dashboard Tab
- Total users count
- Active subscriptions
- Open tickets
- Orders (last 30 days)
- Total revenue

### Users Tab
- View all users
- See subscription status
- Manually activate/deactivate subscriptions
- Delete users (removes all their data)
- View user details (orders, menu items, payments)

### Tickets Tab
- View all support tickets
- Update ticket status (open/pending/resolved/closed)
- Add admin notes
- Filter by status

### Analytics Tab
- New users (last 30 days)
- New orders
- Active users
- New tickets
- System health status

---

## API Endpoints

All endpoints require super admin credentials as query parameters:

### Get Dashboard
```
GET /super-admin/dashboard?username=xxx&password=xxx
```

### Get All Users
```
GET /super-admin/users?username=xxx&password=xxx&skip=0&limit=100
```

### Get User Details
```
GET /super-admin/users/{user_id}?username=xxx&password=xxx
```

### Update Subscription
```
PUT /super-admin/users/{user_id}/subscription?username=xxx&password=xxx
Body: {
  "subscription_active": true,
  "subscription_expires_at": "2025-12-31T23:59:59Z"
}
```

### Delete User
```
DELETE /super-admin/users/{user_id}?username=xxx&password=xxx
```

### Get All Tickets
```
GET /super-admin/tickets?username=xxx&password=xxx&status=open
```

### Update Ticket
```
PUT /super-admin/tickets/{ticket_id}?username=xxx&password=xxx
Body: {
  "status": "resolved",
  "admin_notes": "Issue fixed"
}
```

### Get System Health
```
GET /super-admin/system/health?username=xxx&password=xxx
```

### Get Analytics
```
GET /super-admin/analytics?username=xxx&password=xxx&days=30
```

---

## Security

### How It's Protected:

1. **Secret URL:** `/super-admin-panel-secret` (not linked anywhere)
2. **Authentication Required:** Username + password on every request
3. **No Token Storage:** Credentials sent with each request
4. **Backend Validation:** Every endpoint checks credentials
5. **Not Visible to Users:** No links, no menu items

### Best Practices:

1. **Use Strong Password:** At least 20 characters
2. **Don't Share:** Keep credentials secret
3. **Change Regularly:** Update password every 3 months
4. **Use HTTPS:** Always access via https://
5. **Clear Browser:** Logout when done

---

## Usage Examples

### Manually Activate Subscription

1. Go to Users tab
2. Find the user
3. Click "Activate" button
4. Subscription activated instantly

### Resolve Support Ticket

1. Go to Tickets tab
2. Find the ticket
3. Change status dropdown to "Resolved"
4. Ticket updated

### Delete Spam User

1. Go to Users tab
2. Find the user
3. Click "Delete" button
4. Confirm deletion
5. User and all data removed

### View User Activity

1. Go to Users tab
2. Click on username
3. See all orders, menu items, payments
4. View statistics

---

## Troubleshooting

### Can't Login

**Check:**
1. Credentials are correct
2. Environment variables set in Render
3. Backend deployed (wait 3 min after setting vars)
4. Using correct URL: `/super-admin-panel-secret`

### 403 Error

**Fix:**
- Credentials are wrong
- Check Render environment variables
- Make sure no typos

### Data Not Loading

**Fix:**
- Refresh page
- Check browser console for errors
- Verify backend is running
- Check Render logs

---

## Default Credentials (CHANGE THESE!)

**Username:** `superadmin`
**Password:** `change-this-password-123`

**⚠️ IMPORTANT:** Change these immediately in Render environment variables!

---

## Access URL

**Production:** https://billbytekot.in/super-admin-panel-secret

**Local:** http://localhost:3000/super-admin-panel-secret

---

## What Users Can't See

Users have NO access to:
- Super admin panel
- Other users' data
- System analytics
- Subscription management
- Ticket management
- System health

They can only see their own:
- Dashboard
- Orders
- Menu items
- Settings
- Reports

---

## Monitoring Checklist

### Daily:
- [ ] Check open tickets
- [ ] Review new users
- [ ] Monitor system health

### Weekly:
- [ ] Review analytics
- [ ] Check subscription renewals
- [ ] Resolve pending tickets

### Monthly:
- [ ] Analyze user growth
- [ ] Review revenue
- [ ] Clean up inactive users

---

## Quick Actions

### Activate Trial User:
1. Users tab → Find user → Click "Activate"

### Extend Subscription:
1. Users tab → Find user → Click "Activate"
2. Or use API to set custom expiry date

### Delete Spam Account:
1. Users tab → Find user → Click "Delete" → Confirm

### Close Ticket:
1. Tickets tab → Find ticket → Change status to "Closed"

---

## Summary

**URL:** https://billbytekot.in/super-admin-panel-secret

**Setup:**
1. Add SUPER_ADMIN_USERNAME to Render
2. Add SUPER_ADMIN_PASSWORD to Render
3. Wait 3 minutes
4. Access panel

**Features:**
- Monitor everything
- Manage subscriptions
- Handle tickets
- View analytics
- System health

**Security:**
- Secret URL
- Password protected
- Not visible to users

---

**Status:** ✅ Ready to use
**Priority:** HIGH - For site owner only
**Access:** Secret URL with authentication
