'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="id">
      <body className="flex min-h-screen flex-col items-center justify-center bg-[#011321] text-white p-4">
        <div className="max-w-md text-center">
          <h2 className="text-2xl font-bold text-[#22bcb4] mb-4">Terjadi Kesalahan Sistem</h2>
          <p className="text-sm text-gray-300 mb-6">
            Aplikasi mengalami kendala yang tidak terduga. Silakan coba memuat ulang halaman.
          </p>
          <button
            onClick={() => reset()}
            className="px-4 py-2 rounded-lg bg-[#22bcb4] text-[#011321] font-semibold hover:bg-[#22bcb4]/90 transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      </body>
    </html>
  );
}
