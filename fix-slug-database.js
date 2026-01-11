// MongoDB update script to fix restaurant slug
// Run this in MongoDB shell or MongoDB Compass

// Find the restaurant and update the slug
db.users.updateOne(
  {
    "business_settings.restaurant_name": { $regex: /billbyte/i }
  },
  {
    $set: {
      "business_settings.restaurant_slug": "billbytekot",
      "business_settings.menu_display_enabled": true,
      "business_settings.qr_menu_enabled": true,
      "business_settings.customer_self_order_enabled": true
    }
  }
);

// Verify the update
db.users.findOne(
  { "business_settings.restaurant_slug": "billbytekot" },
  { "business_settings.restaurant_name": 1, "business_settings.restaurant_slug": 1 }
);