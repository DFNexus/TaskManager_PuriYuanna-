'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronRight } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const setAuth = useAuthStore((state) => state.setAuth);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // If password field is not visible yet, show it
    if (!showPassword && email) {
      setShowPassword(true);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/login', { email, password });
      setAuth(response.data.user, response.data.access_token);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal login. Periksa email dan password Anda.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setError('Login dengan Google akan segera tersedia.');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#011321] p-4 relative overflow-hidden">
      {/* Ambient glow effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[#22bcb4]/8 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[300px] h-[300px] bg-[#22bcb4]/5 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] bg-[#ffeacd]/5 rounded-full blur-[80px] pointer-events-none" />

      {/* Login Card */}
      <div className="w-full max-w-[400px] rounded-3xl bg-[#0a0a0a]/95 border border-white/10 shadow-2xl backdrop-blur-sm relative z-10 overflow-hidden">
        <div className="px-8 pt-10 pb-8">
          {/* Card Header */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Sign in to Yuliv</h2>
            <p className="text-sm text-gray-400">
              Welcome back! Please sign in to continue
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-5 p-3 text-sm text-red-300 bg-red-950/50 border border-red-800/40 rounded-xl text-center">
              {error}
            </div>
          )}

          {/* Google Sign-In Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 h-12 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 transition-all duration-200 text-white text-sm font-medium mb-2 relative group"
          >
            {/* Google Icon */}
            <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            <span>Continue with Google</span>

            {/* "Last used" badge */}
            <span className="absolute -top-2 right-4 px-2 py-0.5 text-[10px] font-semibold bg-[#1a1a1a] border border-white/20 text-white/80 rounded-md">
              Last used
            </span>
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4 my-7">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-sm text-gray-500">or</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleLogin}>
            <div className="space-y-5">
              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Email address
                </label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 rounded-xl bg-[#1a1a1a] border-white/10 text-white placeholder:text-gray-500 focus-visible:ring-[#22bcb4]/50 focus-visible:border-[#22bcb4]/50 text-sm"
                  required
                />
              </div>

              {/* Password Field - Shows after clicking Continue */}
              {showPassword && (
                <div className="animate-in slide-in-from-top-2 duration-300">
                  <label className="block text-sm font-medium text-white mb-2">
                    Password
                  </label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 rounded-xl bg-[#1a1a1a] border-white/10 text-white placeholder:text-gray-500 focus-visible:ring-[#22bcb4]/50 focus-visible:border-[#22bcb4]/50 text-sm"
                    required
                    autoFocus
                  />
                </div>
              )}

              {/* Continue / Sign In Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-xl bg-[#22bcb4] hover:bg-[#1eaaa3] active:bg-[#199e97] text-[#011321] font-bold text-sm shadow-lg shadow-[#22bcb4]/20 transition-all duration-200 flex items-center justify-center gap-2"
              >
                {loading ? 'Memproses...' : showPassword ? 'Sign In' : 'Continue'}
                {!loading && <ChevronRight className="h-4 w-4" />}
              </Button>
            </div>
          </form>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-white/10 px-8 py-5">
          <p className="text-center text-sm text-gray-500">
            Belum memiliki akun?{' '}
            <span className="text-[#22bcb4] font-medium cursor-default">
              Hubungi Administrator
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
