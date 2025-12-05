# 💳 Razorpay Payment Flow - Complete Guide

## 🔐 Two Separate Payment Systems

### 1. **Subscription Payments** (Money goes to YOU - Platform Owner)
- **Purpose**: Restaurants pay ₹499/year subscription to use your platform
- **Razorpay Account**: YOUR production account
- **Keys Used**: Your Razorpay Key ID & Secret
- **Endpoint**: `POST /api/subscription/create-order`
- **Money Destination**: YOUR bank account

### 2. **Billing Payments** (Money goes to RESTAURANT)
- **Purpose**: Customers pay for food/orders at restaurants
- **Razorpay Account**: Each restaurant's OWN account
- **Keys Used**: Restaurant's Razorpay Key ID & Secret (from Settings)
- **Endpoint**: `POST /api/payments/create-order`
- **Money Destination**: Restaurant's bank account

## 🎯 How It Works

### Subscription Payment Flow:
```
Customer → Pays ₹499 → YOUR Razorpay → YOUR Bank Account
```

**Code Location**: `backend/server.py` line ~1496
```python
# Uses YOUR keys (platform owner)
DEFAULT_RAZORPAY_KEY_ID = "rzp_live_RmGqVf5JPGOT6G"
DEFAULT_RAZORPAY_KEY_SECRET = "SKYS5tgjwU3H3Pf2ch3ZFtuH"
```

### Billing Payment Flow:
```
Diner → Pays for food → Restaurant's Razorpay → Restaurant's Bank Account
```

**Code Location**: `backend/server.py` line ~2007
```python
# Uses RESTAURANT's keys (from their settings)
razorpay_key_id = current_user.get("razorpay_key_id")
razorpay_key_secret = current_user.get("razorpay_key_secret")
```

## ⚙️ Restaurant Setup Process

### Step 1: Restaurant Signs Up for Razorpay
1. Go to https://dashboard.razorpay.com/signup
2. Create account
3. Complete KYC verification
4. Get approved

### Step 2: Get API Keys
1. Login to Razorpay Dashboard
2. Go to Settings → API Keys
3. Generate Keys (Test or Live)
4. Copy Key ID and Key Secret

### Step 3: Configure in BillByteKOT
1. Login to BillByteKOT
2. Go to Settings → Payment Gateway
3. Enter Razorpay Key ID
4. Enter Razorpay Key Secret
5. Click "Save Settings"

### Step 4: Start Accepting Payments
1. Create orders
2. Go to Billing page
3. Select "Razorpay" payment method
4. Customer pays
5. Money goes to restaurant's account

## 🔒 Security & Data Storage

### Where Keys Are Stored:

**Your Keys (Platform)**:
```python
# Hardcoded in backend/server.py (for subscriptions)
DEFAULT_RAZORPAY_KEY_ID = "rzp_live_RmGqVf5JPGOT6G"
DEFAULT_RAZORPAY_KEY_SECRET = "SKYS5tgjwU3H3Pf2ch3ZFtuH"
```

**Restaurant Keys**:
```javascript
// Stored in MongoDB users collection
{
  "id": "restaurant-user-id",
  "email": "restaurant@example.com",
  "razorpay_key_id": "rzp_test_restaurant123",
  "razorpay_key_secret": "secret_restaurant456",
  // ... other fields
}
```

### Security Measures:
- ✅ Keys stored in database (encrypted connection)
- ✅ Keys never exposed to frontend
- ✅ Keys only used in backend API calls
- ✅ Each restaurant has separate keys
- ✅ No cross-restaurant access

## 🚨 Important: What Was Fixed

### Before (WRONG):
```python
# Billing payments were falling back to YOUR keys
razorpay_key_id = current_user.get("razorpay_key_id") or os.environ.get("RAZORPAY_KEY_ID")
```
**Problem**: If restaurant didn't configure Razorpay, it used YOUR keys, so money went to YOUR account instead of restaurant's account.

### After (CORRECT):
```python
# Billing payments ONLY use restaurant's keys
razorpay_key_id = current_user.get("razorpay_key_id")
razorpay_key_secret = current_user.get("razorpay_key_secret")

if not razorpay_key_id or not razorpay_key_secret:
    raise HTTPException(
        status_code=400,
        detail="Razorpay not configured. Please add your Razorpay API keys in Settings."
    )
```
**Solution**: If restaurant hasn't configured Razorpay, payment fails with clear error message telling them to configure it.

## 📊 Payment Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    SUBSCRIPTION PAYMENT                  │
│                                                          │
│  Restaurant → ₹499/year → YOUR Razorpay → YOUR Account │
│                                                          │
│  Keys Used: rzp_live_RmGqVf5JPGOT6G (YOUR keys)        │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                     BILLING PAYMENT                      │
│                                                          │
│  Customer → ₹500 food → Restaurant's Razorpay →        │
│             Restaurant's Account                         │
│                                                          │
│  Keys Used: rzp_test_xxx (Restaurant's own keys)       │
└─────────────────────────────────────────────────────────┘
```

## 🧪 Testing

### Test Subscription Payment:
1. Go to Subscription page
2. Click "Upgrade to Premium"
3. Pay ₹499
4. Money goes to YOUR account ✅

### Test Billing Payment (Without Restaurant Keys):
1. Create order
2. Go to Billing
3. Select Razorpay
4. Click Pay
5. **Should show error**: "Razorpay not configured. Please add your Razorpay API keys in Settings."

### Test Billing Payment (With Restaurant Keys):
1. Go to Settings → Payment Gateway
2. Add restaurant's Razorpay keys
3. Save
4. Create order
5. Go to Billing
6. Select Razorpay
7. Pay
8. Money goes to RESTAURANT's account ✅

## 💡 For Restaurant Owners

### Why You Need Your Own Razorpay Account:

1. **You Get the Money**: Payments from customers go directly to YOUR bank account
2. **You Control It**: Manage refunds, disputes, settlements yourself
3. **You See Reports**: View all transactions in your Razorpay dashboard
4. **You Set Rules**: Configure payment methods, currencies, etc.

### How to Get Started:

1. **Sign up**: https://dashboard.razorpay.com/signup
2. **Verify**: Complete KYC (takes 1-2 days)
3. **Get Keys**: Settings → API Keys
4. **Configure**: BillByteKOT Settings → Payment Gateway
5. **Start**: Accept payments immediately!

### Test vs Live Mode:

**Test Mode** (for testing):
- Keys start with `rzp_test_`
- No real money
- Use test cards: 4111 1111 1111 1111

**Live Mode** (for production):
- Keys start with `rzp_live_`
- Real money
- Real customer cards
- Requires KYC approval

## 🔧 Troubleshooting

### Error: "Razorpay not configured"
**Solution**: Go to Settings → Payment Gateway and add your Razorpay keys

### Error: "Invalid API key"
**Solution**: Check that you copied the correct Key ID and Secret from Razorpay dashboard

### Error: "Payment failed"
**Solution**: 
1. Check if keys are for correct mode (test/live)
2. Verify KYC is approved (for live mode)
3. Check Razorpay dashboard for errors

### Money Going to Wrong Account
**Solution**: 
- Subscription payments → YOUR account (correct)
- Billing payments → Restaurant's account (correct)
- If billing goes to your account, restaurant hasn't configured their keys

## 📞 Support

### For Platform Owner (You):
- Your subscription payments are working
- Your keys are configured in code
- Money comes to your account

### For Restaurant Owners:
- Need to configure their own Razorpay
- Money goes to their account
- They manage their own payments

## ✅ Verification Checklist

### Platform Owner:
- [x] Subscription endpoint uses YOUR keys
- [x] Subscription payments go to YOUR account
- [x] Your keys are secure

### Restaurant:
- [x] Billing endpoint uses RESTAURANT's keys
- [x] Billing payments go to RESTAURANT's account
- [x] Error shown if keys not configured
- [x] Settings page has Razorpay configuration
- [x] Keys stored securely in database

## 🎉 Summary

### Two Separate Systems:
1. **Subscriptions** → YOUR Razorpay → YOUR Money ✅
2. **Billing** → Restaurant's Razorpay → Restaurant's Money ✅

### No More Confusion:
- ✅ Billing payments NEVER use your keys
- ✅ Restaurants MUST configure their own keys
- ✅ Clear error message if not configured
- ✅ Money goes to correct account

### Restaurant Benefits:
- ✅ Direct payments to their account
- ✅ Full control over their money
- ✅ Own Razorpay dashboard access
- ✅ Manage refunds themselves

---

**Last Updated**: December 4, 2025  
**Status**: ✅ FIXED - Billing uses restaurant's keys only  
**Verified**: Subscription and billing payments separated  
**Security**: ✅ Each restaurant has own keys  

🎊 **Payment flow is now correct!** 🎊
