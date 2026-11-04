'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LogIn } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((state) => state.setAuth);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#011321] p-4 relative overflow-hidden">
      {/* Ambient glow effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[#22bcb4]/8 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[300px] h-[300px] bg-[#22bcb4]/5 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] bg-[#ffeacd]/5 rounded-full blur-[80px] pointer-events-none" />

      {/* Login Card */}
      <div className="w-full max-w-[400px] rounded-3xl bg-[#0a0a0a]/95 border border-white/10 shadow-2xl backdrop-blur-sm relative z-10 overflow-hidden">
        <div className="px-5 sm:px-8 pt-8 sm:pt-10 pb-6 sm:pb-8">
          {/* Card Header */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Sign in to Yuliv Task Manager</h2>
            <p className="text-sm text-gray-400">
              Welcome back! Please sign in to continue
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-5 p-3 text-sm text-red-300 bg-red-950/50 border border-red-800/40 rounded-xl text-center">
              <div>{error}</div>
              {error.toLowerCase().includes('sign up') && (
                <div className="mt-2">
                  <Link href="/signup" className="text-[#22bcb4] hover:underline font-semibold text-xs">
                    Lakukan Sign Up & Aktivasi Akun Sekarang &rarr;
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Email/Password Form */}
          <form onSubmit={handleLogin}>
            <div className="space-y-4">
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

              {/* Password Field */}
              <div>
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
                />
              </div>

              {/* Sign In Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 mt-2 rounded-xl bg-[#22bcb4] hover:bg-[#1eaaa3] active:bg-[#199e97] text-[#011321] font-bold text-sm shadow-lg shadow-[#22bcb4]/20 transition-all duration-200 flex items-center justify-center gap-2"
              >
                {loading ? 'Memproses...' : 'Sign In'}
                {!loading && <LogIn className="h-4 w-4" />}
              </Button>
            </div>
          </form>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-white/10 px-8 py-5">
          <p className="text-center text-sm text-gray-500">
            Belum aktivasi akun atau buat password?{' '}
            <Link href="/signup" className="text-[#22bcb4] hover:text-[#1eaaa3] font-medium transition-colors">
              Sign Up di sini
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
