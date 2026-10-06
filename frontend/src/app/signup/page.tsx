'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserPlus, ShieldAlert, CheckCircle2, ArrowRight } from 'lucide-react';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [error, setError] = useState('');
  const [errorCode, setErrorCode] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((state) => state.setAuth);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setErrorCode(null);

    if (password.length < 6) {
      setError('Password harus memiliki minimal 6 karakter.');
      return;
    }

    if (password !== passwordConfirmation) {
      setError('Konfirmasi password tidak cocok dengan password yang dimasukkan.');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/register', {
        name,
        email: email.trim().toLowerCase(),
        password,
        password_confirmation: passwordConfirmation,
      });

      // Save token and user into auth store and cookies
      setAuth(response.data.user, response.data.access_token);
      router.push('/dashboard');
    } catch (err: any) {
      const status = err.response?.status;
      setErrorCode(status || 500);
      const msg = err.response?.data?.message;

      if (status === 403) {
        setError(msg || 'Email Anda belum didaftarkan atau belum diberikan izin oleh Administrator.');
      } else if (status === 409) {
        setError(msg || 'Akun dengan email ini sudah terdaftar. Silakan login.');
      } else if (status === 422 && err.response?.data?.errors) {
        const firstErrorKey = Object.keys(err.response.data.errors)[0];
        setError(err.response.data.errors[firstErrorKey][0]);
      } else {
        setError(msg || 'Gagal melakukan pendaftaran. Silakan coba lagi.');
      }
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

      {/* Signup Card */}
      <div className="w-full max-w-[440px] rounded-3xl bg-[#0a0a0a]/95 border border-white/10 shadow-2xl backdrop-blur-sm relative z-10 overflow-hidden">
        <div className="px-8 pt-9 pb-8">
          {/* Card Header */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">Aktivasi Akun Staff</h2>
            <p className="text-sm text-gray-400">
              Khusus staf yang telah didaftarkan oleh Administrator
            </p>
          </div>

          {/* Info Badge */}
          <div className="mb-5 p-3 rounded-xl bg-[#22bcb4]/10 border border-[#22bcb4]/20 text-xs text-[#22bcb4] leading-relaxed flex items-start gap-2.5">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              Masukkan email yang telah didaftarkan Admin untuk membuat nama dan password akun Anda.
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className={`mb-5 p-3 text-sm rounded-xl border text-left flex items-start gap-2.5 ${
              errorCode === 403
                ? 'bg-amber-950/40 border-amber-600/40 text-amber-200'
                : errorCode === 409
                ? 'bg-sky-950/40 border-sky-600/40 text-sky-200'
                : 'bg-red-950/50 border-red-800/40 text-red-300'
            }`}>
              <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
              <div className="flex-1 text-xs leading-relaxed">
                <p className="font-semibold mb-0.5">
                  {errorCode === 403 ? 'Akses Ditolak' : errorCode === 409 ? 'Akun Sudah Terdaftar' : 'Pendaftaran Gagal'}
                </p>
                <p>{error}</p>
                {errorCode === 409 && (
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-1 text-sky-300 underline font-semibold mt-1.5 hover:text-white transition-colors"
                  >
                    Menuju halaman Sign In <ArrowRight className="h-3 w-3" />
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSignup}>
            <div className="space-y-4">
              {/* Whitelisted Email Field */}
              <div>
                <label className="block text-sm font-medium text-white mb-1.5">
                  Email Terdaftar
                </label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="nama@puriyuanna.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 rounded-xl bg-[#1a1a1a] border-white/10 text-white placeholder:text-gray-500 focus-visible:ring-[#22bcb4]/50 focus-visible:border-[#22bcb4]/50 text-sm"
                  required
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  Harus sesuai dengan email yang didaftarkan Admin.
                </p>
              </div>

              {/* Name Field */}
              <div>
                <label className="block text-sm font-medium text-white mb-1.5">
                  Nama Lengkap
                </label>
                <Input
                  id="signup-name"
                  type="text"
                  placeholder="Masukkan nama lengkap Anda"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-11 rounded-xl bg-[#1a1a1a] border-white/10 text-white placeholder:text-gray-500 focus-visible:ring-[#22bcb4]/50 focus-visible:border-[#22bcb4]/50 text-sm"
                  required
                />
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm font-medium text-white mb-1.5">
                  Buat Password
                </label>
                <Input
                  id="signup-password"
                  type="password"
                  placeholder="Minimal 6 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 rounded-xl bg-[#1a1a1a] border-white/10 text-white placeholder:text-gray-500 focus-visible:ring-[#22bcb4]/50 focus-visible:border-[#22bcb4]/50 text-sm"
                  required
                />
              </div>

              {/* Password Confirmation Field */}
              <div>
                <label className="block text-sm font-medium text-white mb-1.5">
                  Konfirmasi Password
                </label>
                <Input
                  id="signup-password-confirmation"
                  type="password"
                  placeholder="Ulangi password di atas"
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  className="h-11 rounded-xl bg-[#1a1a1a] border-white/10 text-white placeholder:text-gray-500 focus-visible:ring-[#22bcb4]/50 focus-visible:border-[#22bcb4]/50 text-sm"
                  required
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 mt-2 rounded-xl bg-[#22bcb4] hover:bg-[#1eaaa3] active:bg-[#199e97] text-[#011321] font-bold text-sm shadow-lg shadow-[#22bcb4]/20 transition-all duration-200 flex items-center justify-center gap-2"
              >
                {loading ? 'Memproses Aktivasi...' : 'Aktivasi & Buat Akun'}
                {!loading && <UserPlus className="h-4 w-4" />}
              </Button>
            </div>
          </form>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-white/10 px-8 py-4 bg-white/[0.02]">
          <p className="text-center text-sm text-gray-500">
            Sudah memiliki akun aktif?{' '}
            <Link href="/login" className="text-[#22bcb4] hover:text-[#1eaaa3] font-medium transition-colors">
              Sign In di sini
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
