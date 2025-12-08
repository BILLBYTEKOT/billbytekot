"""
WhatsApp Cloud API Integration for BillByteKOT
Sends receipts and notifications directly via Meta's WhatsApp Business API
No user login required - fully automated
"""

import os
import httpx
import json
from typing import Optional, Dict, Any
from datetime import datetime


class WhatsAppCloudAPI:
    """WhatsApp Cloud API client for sending messages"""
    
    def __init__(self):
        self.phone_number_id = os.getenv("WHATSAPP_PHONE_NUMBER_ID")
        self.access_token = os.getenv("WHATSAPP_ACCESS_TOKEN")
        self.business_account_id = os.getenv("WHATSAPP_BUSINESS_ACCOUNT_ID")
        self.api_version = os.getenv("WHATSAPP_API_VERSION", "v18.0")
        self.base_url = f"https://graph.facebook.com/{self.api_version}"
        
    def is_configured(self) -> bool:
        """Check if WhatsApp Cloud API is properly configured"""
        return bool(self.phone_number_id and self.access_token)
    
    async def send_text_message(
        self, 
        to_phone: str, 
        message: str,
        preview_url: bool = True
    ) -> Dict[str, Any]:
        """
        Send a text message via WhatsApp Cloud API
        
        Args:
            to_phone: Recipient phone number (with country code, no + sign)
            message: Message text to send
            preview_url: Enable URL preview in message
            
        Returns:
            API response dict with message_id if successful
        """
        if not self.is_configured():
            raise ValueError("WhatsApp Cloud API not configured. Set WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN")
        
        # Clean phone number (remove spaces, dashes, plus signs)
        to_phone = to_phone.replace("+", "").replace(" ", "").replace("-", "")
        
        url = f"{self.base_url}/{self.phone_number_id}/messages"
        
        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": to_phone,
            "type": "text",
            "text": {
                "preview_url": preview_url,
                "body": message
            }
        }
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.post(url, headers=headers, json=payload)
                response.raise_for_status()
                return response.json()
            except httpx.HTTPStatusError as e:
                error_detail = e.response.json() if e.response.text else str(e)
                raise Exception(f"WhatsApp API error: {error_detail}")
            except Exception as e:
                raise Exception(f"Failed to send WhatsApp message: {str(e)}")
    
    async def send_template_message(
        self,
        to_phone: str,
        template_name: str,
        language_code: str = "en",
        components: Optional[list] = None
    ) -> Dict[str, Any]:
        """
        Send a pre-approved template message
        
        Args:
            to_phone: Recipient phone number
            template_name: Name of approved template
            language_code: Template language (en, hi, etc.)
            components: Template parameters
            
        Returns:
            API response dict
        """
        if not self.is_configured():
            raise ValueError("WhatsApp Cloud API not configured")
        
        to_phone = to_phone.replace("+", "").replace(" ", "").replace("-", "")
        
        url = f"{self.base_url}/{self.phone_number_id}/messages"
        
        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "messaging_product": "whatsapp",
            "to": to_phone,
            "type": "template",
            "template": {
                "name": template_name,
                "language": {
                    "code": language_code
                }
            }
        }
        
        if components:
            payload["template"]["components"] = components
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.post(url, headers=headers, json=payload)
                response.raise_for_status()
                return response.json()
            except httpx.HTTPStatusError as e:
                error_detail = e.response.json() if e.response.text else str(e)
                raise Exception(f"WhatsApp API error: {error_detail}")
            except Exception as e:
                raise Exception(f"Failed to send template: {str(e)}")
    
    async def send_receipt(
        self,
        to_phone: str,
        order_data: Dict[str, Any],
        business_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Send a formatted receipt via WhatsApp
        
        Args:
            to_phone: Customer phone number
            order_data: Order details dict
            business_data: Business settings dict
            
        Returns:
            API response dict
        """
        # Format receipt message
        restaurant_name = business_data.get("restaurant_name", "Restaurant")
        currency = business_data.get("currency", "INR")
        currency_symbol = {"INR": "₹", "USD": "$", "EUR": "€", "GBP": "£"}.get(currency, "₹")
        
        message = f"""🧾 *{restaurant_name}*
━━━━━━━━━━━━━━━━━━━━

📋 Order #{order_data['id'][:8].upper()}
📅 {datetime.now().strftime('%d %b %Y, %I:%M %p')}

"""
        
        # Add items
        if order_data.get('items'):
            message += "🍽️ *Items:*\n"
            for item in order_data['items']:
                qty = item['quantity']
                name = item['name']
                price = item['price'] * qty
                message += f"  {qty}× {name} - {currency_symbol}{price:.2f}\n"
            message += "\n"
        
        # Add totals
        subtotal = order_data.get('subtotal', 0)
        tax = order_data.get('tax', 0)
        discount = order_data.get('discount', 0)
        total = order_data.get('total', 0)
        
        message += f"💰 *Bill Summary:*\n"
        message += f"Subtotal: {currency_symbol}{subtotal:.2f}\n"
        if discount > 0:
            message += f"Discount: -{currency_symbol}{discount:.2f}\n"
        message += f"Tax: {currency_symbol}{tax:.2f}\n"
        message += f"━━━━━━━━━━━━━━━━━━━━\n"
        message += f"*Total: {currency_symbol}{total:.2f}*\n\n"
        
        # Add footer
        message += f"✨ Thank you for dining with us!\n"
        if business_data.get('website'):
            message += f"🌐 {business_data['website']}\n"
        if business_data.get('phone'):
            message += f"📞 {business_data['phone']}\n"
        
        message += f"\n_Powered by BillByteKOT_"
        
        return await self.send_text_message(to_phone, message, preview_url=True)
    
    async def send_order_status(
        self,
        to_phone: str,
        order_id: str,
        status: str,
        restaurant_name: str,
        tracking_url: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Send order status update notification
        
        Args:
            to_phone: Customer phone number
            order_id: Order ID
            status: Order status (pending, preparing, ready, completed)
            restaurant_name: Restaurant name
            tracking_url: Optional tracking URL
            
        Returns:
            API response dict
        """
        status_emojis = {
            "pending": "⏳",
            "preparing": "👨‍🍳",
            "ready": "✅",
            "completed": "🎉",
            "cancelled": "❌"
        }
        
        status_messages = {
            "pending": "Your order has been received!",
            "preparing": "Your order is being prepared!",
            "ready": "Your order is ready for pickup!",
            "completed": "Order completed. Thank you!",
            "cancelled": "Your order has been cancelled."
        }
        
        emoji = status_emojis.get(status, "📋")
        status_msg = status_messages.get(status, "Order status updated")
        
        message = f"""{emoji} *{restaurant_name}*

{status_msg}

📋 Order #{order_id[:8].upper()}
🕐 {datetime.now().strftime('%I:%M %p')}
"""
        
        if tracking_url:
            message += f"\n🔗 Track your order:\n{tracking_url}"
        
        message += f"\n\n_Powered by BillByteKOT_"
        
        return await self.send_text_message(to_phone, message, preview_url=True)
    
    async def send_otp(
        self,
        to_phone: str,
        otp: str,
        restaurant_name: str = "BillByteKOT"
    ) -> Dict[str, Any]:
        """
        Send OTP for login verification
        
        Args:
            to_phone: Phone number
            otp: OTP code
            restaurant_name: Restaurant name
            
        Returns:
            API response dict
        """
        message = f"""🔐 *{restaurant_name}*

Your verification code is:

*{otp}*

Valid for 5 minutes.
Do not share this code with anyone.

_Powered by BillByteKOT_"""
        
        return await self.send_text_message(to_phone, message, preview_url=False)


# Singleton instance
whatsapp_api = WhatsAppCloudAPI()


# Helper functions for easy use
async def send_whatsapp_receipt(
    phone: str,
    order: Dict[str, Any],
    business: Dict[str, Any]
) -> Dict[str, Any]:
    """Send receipt via WhatsApp Cloud API"""
    return await whatsapp_api.send_receipt(phone, order, business)


async def send_whatsapp_status(
    phone: str,
    order_id: str,
    status: str,
    restaurant_name: str,
    tracking_url: Optional[str] = None
) -> Dict[str, Any]:
    """Send order status update via WhatsApp"""
    return await whatsapp_api.send_order_status(
        phone, order_id, status, restaurant_name, tracking_url
    )


async def send_whatsapp_otp(
    phone: str,
    otp: str,
    restaurant_name: str = "BillByteKOT"
) -> Dict[str, Any]:
    """Send OTP via WhatsApp"""
    return await whatsapp_api.send_otp(phone, otp, restaurant_name)


async def test_whatsapp_connection() -> Dict[str, Any]:
    """Test WhatsApp Cloud API connection"""
    if not whatsapp_api.is_configured():
        return {
            "success": False,
            "error": "WhatsApp Cloud API not configured",
            "configured": False
        }
    
    try:
        # Try to send a test message to the business number itself
        test_phone = whatsapp_api.phone_number_id
        result = await whatsapp_api.send_text_message(
            test_phone,
            "✅ WhatsApp Cloud API connection test successful!"
        )
        return {
            "success": True,
            "configured": True,
            "message_id": result.get("messages", [{}])[0].get("id"),
            "phone_number_id": whatsapp_api.phone_number_id
        }
    except Exception as e:
        return {
            "success": False,
            "configured": True,
            "error": str(e)
        }
