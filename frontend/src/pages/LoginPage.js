import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { API, setAuthToken } from '../App';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { ChefHat, MessageCircle, Mail, ArrowLeft, Loader2, Smartphone } from 'lucide-react';

const LoginPage = ({ setUser }) => {
  const [loginMethod, setLoginMethod] = useState('whatsapp');
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'admin'
  });
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) {
        const response = await axios.post(`${API}/auth/login`, {
          username: formData.username,
          password: formData.password
        });
        setAuthToken(response.data.token);
        setUser(response.data.user);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        toast.success('Welcome back!');
        if (response.data.user.role === 'admin' && !response.data.user.setup_completed) {
          navigate('/setup');
        } else {
          navigate('/dashboard');
        }
      } else {
        await axios.post(`${API}/auth/register`, formData);
        toast.success('Account created! Please login.');
        setIsLogin(true);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'An error occurred');
    }
  };


  const handleSendOTP = async () => {
    if (!phone || phone.length < 10) {
      toast.error('Please enter a valid phone number');
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post(`${API}/auth/whatsapp/send-otp`, {
        phone: phone.replace(/\D/g, ''),
        country_code: countryCode
      });
      setOtpSent(true);
      setCountdown(60);
      toast.success('OTP sent to your WhatsApp!');
      if (response.data.debug_otp) {
        console.log('Debug OTP:', response.data.debug_otp);
        toast.info(`Test OTP: ${response.data.debug_otp}`, { duration: 10000 });
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      toast.error('Please enter 6-digit OTP');
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post(`${API}/auth/whatsapp/verify-otp`, {
        phone: phone.replace(/\D/g, ''),
        otp,
        country_code: countryCode
      });
      setAuthToken(response.data.token);
      setUser(response.data.user);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      if (response.data.is_new_user) {
        toast.success("Welcome to RestoBill! Let's set up your business.");
        navigate('/setup');
      } else {
        toast.success('Welcome back!');
        navigate(response.data.user.setup_completed ? '/dashboard' : '/setup');
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const countryCodes = [
    { code: '+91', country: '🇮🇳 India' },
    { code: '+1', country: '🇺🇸 USA' },
    { code: '+44', country: '🇬🇧 UK' },
    { code: '+971', country: '🇦🇪 UAE' },
    { code: '+65', country: '🇸🇬 Singapore' },
  ];


  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center transform rotate-3 hover:rotate-6 transition-all">
              <ChefHat className="w-12 h-12 text-white" />
            </div>
          </div>
          <div>
            <CardTitle className="text-3xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>RestoBill AI</CardTitle>
            <CardDescription className="text-base mt-2">Smart Restaurant Billing System</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Login Method Toggle */}
          <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
            <button
              type="button"
              onClick={() => { setLoginMethod('whatsapp'); setOtpSent(false); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md transition-all ${loginMethod === 'whatsapp' ? 'bg-green-500 text-white shadow-md' : 'text-gray-600 hover:bg-gray-200'}`}
            >
              <MessageCircle className="w-4 h-4" /> WhatsApp
            </button>
            <button
              type="button"
              onClick={() => setLoginMethod('password')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md transition-all ${loginMethod === 'password' ? 'bg-violet-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-200'}`}
            >
              <Mail className="w-4 h-4" /> Email
            </button>
          </div>


          {/* WhatsApp Login */}
          {loginMethod === 'whatsapp' && (
            <div className="space-y-4">
              {!otpSent ? (
                <>
                  <div className="text-center mb-4">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <MessageCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <p className="text-sm text-gray-600">Login instantly with WhatsApp. No password needed!</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Phone Number</Label>
                    <div className="flex gap-2">
                      <select value={countryCode} onChange={(e) => setCountryCode(e.target.value)} className="w-28 px-2 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm">
                        {countryCodes.map(c => <option key={c.code} value={c.code}>{c.country}</option>)}
                      </select>
                      <Input type="tel" placeholder="9876543210" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} className="flex-1" maxLength={10} />
                    </div>
                  </div>
                  <Button onClick={handleSendOTP} disabled={loading || phone.length < 10} className="w-full bg-green-600 hover:bg-green-700">
                    {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...</> : <><MessageCircle className="w-4 h-4 mr-2" /> Send OTP via WhatsApp</>}
                  </Button>
                </>
              ) : (
                <>
                  <button type="button" onClick={() => setOtpSent(false)} className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900">
                    <ArrowLeft className="w-4 h-4" /> Change number
                  </button>
                  <div className="text-center mb-4">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Smartphone className="w-8 h-8 text-green-600" />
                    </div>
                    <p className="text-sm text-gray-600">Enter 6-digit OTP sent to<br /><span className="font-semibold">{countryCode} {phone}</span></p>
                  </div>
                  <form onSubmit={handleVerifyOTP} className="space-y-4">
                    <Input type="text" placeholder="000000" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} className="text-center text-2xl tracking-widest font-mono" maxLength={6} autoFocus />
                    <Button type="submit" disabled={loading || otp.length !== 6} className="w-full bg-green-600 hover:bg-green-700">
                      {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying...</> : 'Verify & Login'}
                    </Button>
                    <div className="text-center">
                      {countdown > 0 ? <p className="text-sm text-gray-500">Resend OTP in {countdown}s</p> : <button type="button" onClick={handleSendOTP} className="text-sm text-green-600 hover:underline">Resend OTP</button>}
                    </div>
                  </form>
                </>
              )}
            </div>
          )}


          {/* Password Login */}
          {loginMethod === 'password' && (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input id="username" placeholder="Enter username" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} required />
              </div>
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="Enter email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="Enter password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required />
              </div>
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <select id="role" className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500" value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}>
                    <option value="admin">Admin</option>
                    <option value="waiter">Waiter</option>
                    <option value="cashier">Cashier</option>
                    <option value="kitchen">Kitchen</option>
                  </select>
                </div>
              )}
              <Button type="submit" className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700">
                {isLogin ? 'Login' : 'Register'}
              </Button>
              <div className="text-center">
                <button type="button" className="text-sm text-violet-600 hover:underline" onClick={() => setIsLogin(!isLogin)}>
                  {isLogin ? "Don't have an account? Register" : 'Already have an account? Login'}
                </button>
              </div>
            </form>
          )}

          <div className="text-center text-xs text-gray-500 pt-4 border-t">
            {loginMethod === 'whatsapp' ? '✓ No password ✓ Instant notifications ✓ Secure OTP' : '✓ Full control ✓ Staff accounts ✓ Role-based access'}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
