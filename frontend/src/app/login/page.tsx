'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

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
      {/* Decorative brand ambient glow */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#22bcb4]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#ffeacd]/10 rounded-full blur-3xl pointer-events-none" />

      <Card className="w-full max-w-md shadow-2xl border border-[#ffeacd]/20 bg-[#031d33] text-white relative z-10">
        <CardHeader className="space-y-2 text-center pb-6 border-b border-[#ffeacd]/10">
          <div className="inline-flex items-center justify-center mx-auto mb-1 px-3 py-1 rounded-full bg-[#ffeacd]/15 border border-[#ffeacd]/30 text-[#ffeacd] text-xs font-semibold tracking-wider uppercase">
            Puri Yuanna Living
          </div>
          <CardTitle className="text-3xl font-extrabold tracking-tight text-[#22bcb4]">
            GHTM Portal
          </CardTitle>
          <CardDescription className="text-slate-300 text-xs">
            Sistem Manajemen Task, Checklist & Approval Operasional
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4 pt-6">
            {error && (
              <div className="p-3 text-sm text-red-300 bg-red-950/60 border border-red-800/50 rounded-md">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-medium text-slate-200">
                Email
              </Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="nama@puriyuanna.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-[#011321] border-[#ffeacd]/20 text-white placeholder:text-slate-500 focus-visible:ring-[#22bcb4] focus-visible:border-[#22bcb4]"
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-medium text-slate-200">
                  Password
                </Label>
              </div>
              <Input 
                id="password" 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-[#011321] border-[#ffeacd]/20 text-white focus-visible:ring-[#22bcb4] focus-visible:border-[#22bcb4]"
                required
              />
            </div>
          </CardContent>
          <CardFooter className="pt-2 pb-6">
            <Button 
              className="w-full bg-[#22bcb4] hover:bg-[#1fa9a2] text-[#011321] font-bold text-sm shadow-md transition-all h-10" 
              type="submit" 
              disabled={loading}
            >
              {loading ? 'Memproses...' : 'Masuk ke Sistem'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
