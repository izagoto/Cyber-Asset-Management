import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { Mail, Lock, AlertTriangle, ArrowRight, Eye, EyeOff } from 'lucide-react';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Strict Sanitization & Frontend Validation
    const cleanEmail = email.trim();
    const cleanPassword = password;

    if (!cleanEmail) {
      setError('Please enter your email address to continue.');
      return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(cleanEmail)) {
      setError("This email format looks a bit off. Please double-check it.");
      return;
    }

    if (!cleanPassword) {
      setError("Don't forget to enter your password!");
      return;
    } 
    
    if (cleanPassword.length < 6) {
      setError('Your password should be at least 6 characters long.');
      return;
    }

    // Basic heuristic to block obvious SQLi payload characters
    const sqlInjectionPattern = /('|;|--|\b(SELECT|UNION|DROP|DELETE|UPDATE|INSERT)\b)/i;
    if (sqlInjectionPattern.test(cleanEmail)) {
      setError("We noticed some unusual characters in your email. Please use standard text.");
      return;
    }

    setIsLoading(true);

    try {
      const formData = new URLSearchParams();
      formData.append('username', cleanEmail);
      formData.append('password', cleanPassword);

      const res = await api.post('/auth/login', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      await login(res.data.data.access_token);
      navigate('/');
    } catch (err: any) {
      setError(err?.response?.data?.detail || "We couldn't sign you in. Please check if your email and password are correct.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#F4F4F5] animate-in fade-in duration-700" style={{ fontFamily: "'Inter', sans-serif" }}>
      
      {/* Container */}
      <div className="w-full max-w-[1000px] min-h-[550px] flex flex-col md:flex-row rounded-2xl overflow-hidden shadow-xl bg-[#FFFFFF] border border-[#E4E4E7] z-10 relative">

        {/* Left Panel - Branding */}
        <div className="md:w-5/12 p-10 md:p-14 bg-linear-to-br from-[#18181B] to-[#27272A] flex flex-col justify-center border-r border-[#E4E4E7]/50 relative overflow-hidden">
          {/* Decorative dots pattern */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
          <div className="absolute -top-32 -left-32 w-64 h-64 bg-[#DC2626]/10 blur-[100px] rounded-full pointer-events-none" />
          <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-[#DC2626]/10 blur-[100px] rounded-full pointer-events-none" />

          <div className="flex flex-col relative z-10">
            <h1 className="text-3xl md:text-4xl font-extrabold mb-3 tracking-tight whitespace-nowrap">
              <span className="text-[#DC2626]">Inventaris</span> <span className="text-white">Siber</span>
            </h1>
            <p className="text-[#A1A1AA] text-[10px] font-medium tracking-[0.2em] uppercase mt-1 whitespace-nowrap">Cyber Asset Management Platform</p>
            
            <div className="h-[3px] w-16 bg-linear-to-r from-[#DC2626] to-[#B91C1C] mt-10 rounded-full shadow-[0_0_10px_rgba(220,38,38,0.5)]" />
          </div>
        </div>

        {/* Right Panel - Login Form */}
        <div className="md:w-7/12 p-10 md:p-14 flex flex-col justify-center bg-[#FFFFFF] relative">
          <h2 className="text-2xl font-bold text-[#18181B] mb-8 tracking-tight">Sign In Staff</h2>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5 relative z-10">
            {error && (
              <div className="flex items-start gap-3 p-3.5 bg-red-50 border border-red-200 rounded-lg animate-in shake">
                <AlertTriangle size={15} className="text-red-700 mt-0.5 shrink-0" />
                <p className="text-sm font-medium text-red-700 leading-relaxed">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              {/* Email Input */}
              <div>
                <label className="text-sm font-medium text-[#52525B] block mb-2">Email</label>
                <div className="relative group">
                  <Mail size={14} className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${emailFocused ? 'text-[#DC2626]' : 'text-[#71717A]'}`} />
                  <input
                    type="email"
                    required
                    maxLength={100}
                    pattern="[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                    placeholder="Enter Email"
                    autoComplete="off"
                    className="w-full bg-[#FFFFFF] border border-[#E4E4E7] rounded-lg pl-10 pr-4 py-3 text-sm font-medium text-[#18181B] placeholder-[#A1A1AA] focus:outline-none focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/10 transition-all"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-[#52525B]">Password</label>
                </div>
                <div className="relative group">
                  <Lock size={14} className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${passwordFocused ? 'text-[#DC2626]' : 'text-[#71717A]'}`} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    maxLength={64}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className="w-full bg-[#FFFFFF] border border-[#E4E4E7] rounded-lg pl-10 pr-10 py-3 text-sm font-medium text-[#18181B] placeholder-[#A1A1AA] focus:outline-none focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/10 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#71717A] hover:text-[#DC2626] transition-colors"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3.5 mt-4 bg-linear-to-r from-[#DC2626] to-[#B91C1C] hover:from-[#B91C1C] hover:to-[#991B1B] text-white text-sm font-semibold rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Sign In <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
