# 📱 WhatsApp Cloud API - Quick Start (5 Minutes)

## 🎯 Goal
Send receipts directly to customer WhatsApp without any login!

---

## ⚡ Quick Setup

### 1. Create Meta App (2 min)
1. Go to https://developers.facebook.com/apps/
2. Click "Create App" → Select "Business"
3. Add WhatsApp product

### 2. Get Credentials (1 min)
Copy these from WhatsApp settings:
- Phone Number ID: `123456789012345`
- Access Token: `EAABsbCS1iHgBO...`
- Business Account ID: `987654321098765`

### 3. Configure Backend (1 min)
Add to `backend/.env`:
```env
WHATSAPP_PHONE_NUMBER_ID=123456789012345
WHATSAPP_ACCESS_TOKEN=EAABsbCS1iHgBO...
WHATSAPP_BUSINESS_ACCOUNT_ID=987654321098765
```

### 4. Deploy (1 min)
```bash
git add .
git commit -m "Add WhatsApp Cloud API"
git push origin main
```

---

## ✅ Test It

### Check Status:
```bash
curl https://your-backend.com/api/whatsapp/cloud/status
```

### Send Test Receipt:
```bash
curl -X POST https://your-backend.com/api/whatsapp/cloud/send-receipt/ORDER_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"phone_number": "+919876543210", "customer_name": "Test"}'
```

---

## 🎉 Done!

Customers now receive:
- ✅ Instant receipts on WhatsApp
- ✅ Order status updates
- ✅ Professional formatting
- ✅ No login required!

---

## 📚 Full Guide
See `WHATSAPP_CLOUD_API_SETUP.md` for detailed instructions.

---

## 💰 Cost
- First 1,000 messages/month: **FREE**
- After that: ~₹0.50 per conversation

---

## 🆘 Issues?

**"API not configured"**
→ Check .env file has all 3 credentials

**"Message not sent"**
→ Verify phone number format: +919876543210

**"Token expired"**
→ Generate permanent token (not temporary)

---

**That's it! Start sending! 🚀**
