import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';
import { MessageCircle, Send, Users, Zap } from 'lucide-react';

const WhatsAppDesktop = ({ isElectron = false }) => {
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [businessNumber, setBusinessNumber] = useState('');
  const [bulkContacts, setBulkContacts] = useState('');
  const [bulkMessage, setBulkMessage] = useState('');

  const sendSingleMessage = () => {
    if (!phone || !message) {
      toast.error('Please enter phone number and message');
      return;
    }

    if (isElectron && window.electronAPI?.sendWhatsApp) {
      window.electronAPI.sendWhatsApp(phone, message);
      toast.success('Opening WhatsApp...');
    } else {
      // Fallback for web
      const whatsappUrl = `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
      toast.success('Opening WhatsApp in browser...');
    }
    
    setPhone('');
    setMessage('');
  };

  const sendBusinessMessage = () => {
    if (!phone || !message) {
      toast.error('Please enter phone number and message');
      return;
    }

    if (isElectron && window.electronAPI?.sendWhatsAppBusiness) {
      window.electronAPI.sendWhatsAppBusiness(phone, message, businessNumber);
      toast.success('Opening WhatsApp Business...');
    } else {
      sendSingleMessage(); // Fallback to regular WhatsApp
    }
  };

  const sendBulkMessages = () => {
    if (!bulkContacts || !bulkMessage) {
      toast.error('Please enter contacts and message');
      return;
    }

    try {
      // Parse contacts (format: name:phone, one per line)
      const contacts = bulkContacts.split('\n')
        .filter(line => line.trim())
        .map(line => {
          const [name, phone] = line.split(':').map(s => s.trim());
          return { name: name || 'Customer', phone };
        })
        .filter(contact => contact.phone);

      if (contacts.length === 0) {
        toast.error('No valid contacts found. Use format: Name:Phone');
        return;
      }

      if (isElectron && window.electronAPI?.sendBulkWhatsApp) {
        window.electronAPI.sendBulkWhatsApp(contacts, bulkMessage);
        toast.success(`Sending ${contacts.length} WhatsApp messages...`);
      } else {
        // Fallback for web - send one by one with delay
        contacts.forEach((contact, index) => {
          setTimeout(() => {
            const whatsappUrl = `https://wa.me/${contact.phone.replace(/\D/g, '')}?text=${encodeURIComponent(bulkMessage.replace('{name}', contact.name))}`;
            window.open(whatsappUrl, '_blank');
          }, index * 2000);
        });
        toast.success(`Opening ${contacts.length} WhatsApp chats...`);
      }

      setBulkContacts('');
      setBulkMessage('');
    } catch (error) {
      toast.error('Error parsing contacts. Use format: Name:Phone');
    }
  };

  const quickMessages = [
    {
      title: 'Order Ready',
      message: 'Hi {name}! Your order is ready for pickup. Thank you for choosing us! 🍽️'
    },
    {
      title: 'Order Confirmation',
      message: 'Thank you for your order! We have received it and will prepare it shortly. Order ID: {orderId}'
    },
    {
      title: 'Delivery Update',
      message: 'Your order is out for delivery and will reach you in 15-20 minutes. Track: {trackingLink}'
    },
    {
      title: 'Feedback Request',
      message: 'Hi {name}! How was your dining experience? We would love to hear your feedback! ⭐'
    }
  ];

  if (!isElectron) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6 text-center">
          <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="font-semibold mb-2">WhatsApp Integration</h3>
          <p className="text-sm text-gray-500">
            Enhanced WhatsApp features are available in the desktop app
          </p>
          <Button 
            onClick={() => window.open('/download', '_blank')} 
            className="mt-4 bg-green-600 hover:bg-green-700"
          >
            Download Desktop App
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Single Message */}
      <Card className="border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-green-600" />
            Send WhatsApp Message
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Phone Number</Label>
              <Input
                placeholder="+91 9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div>
              <Label>Business Number (Optional)</Label>
              <Input
                placeholder="Your WhatsApp Business number"
                value={businessNumber}
                onChange={(e) => setBusinessNumber(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label>Message</Label>
            <textarea
              className="w-full px-3 py-2 border rounded-md resize-none"
              rows={3}
              placeholder="Type your message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={sendSingleMessage} className="flex-1 bg-green-600 hover:bg-green-700">
              <Send className="w-4 h-4 mr-2" />
              Send WhatsApp
            </Button>
            {businessNumber && (
              <Button onClick={sendBusinessMessage} variant="outline" className="flex-1">
                <Zap className="w-4 h-4 mr-2" />
                Send Business
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Messages */}
      <Card className="border-0 shadow-xl">
        <CardHeader>
          <CardTitle>Quick Message Templates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {quickMessages.map((template, index) => (
              <button
                key={index}
                onClick={() => setMessage(template.message)}
                className="p-3 text-left border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <p className="font-medium text-sm">{template.title}</p>
                <p className="text-xs text-gray-500 line-clamp-2">{template.message}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Bulk Messages */}
      <Card className="border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Bulk WhatsApp Messages
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Contacts (Name:Phone, one per line)</Label>
            <textarea
              className="w-full px-3 py-2 border rounded-md resize-none"
              rows={4}
              placeholder="John Doe:+91 9876543210&#10;Jane Smith:+91 9876543211&#10;..."
              value={bulkContacts}
              onChange={(e) => setBulkContacts(e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">
              Format: Name:Phone (one contact per line). Use {'{name}'} in message for personalization.
            </p>
          </div>
          <div>
            <Label>Bulk Message</Label>
            <textarea
              className="w-full px-3 py-2 border rounded-md resize-none"
              rows={3}
              placeholder="Hi {name}! We have a special offer for you..."
              value={bulkMessage}
              onChange={(e) => setBulkMessage(e.target.value)}
            />
          </div>
          <Button onClick={sendBulkMessages} className="w-full bg-blue-600 hover:bg-blue-700">
            <Users className="w-4 h-4 mr-2" />
            Send Bulk Messages
          </Button>
          <p className="text-xs text-gray-500 text-center">
            Messages will be sent with 2-second intervals to avoid spam detection
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default WhatsAppDesktop;