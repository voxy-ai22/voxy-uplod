
import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from './lib/rate-limit';

export function middleware(request: NextRequest) {
  // Hanya jalankan rate limit pada API routes (misal: /api/upload)
  if (!request.nextUrl.pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // Ambil IP Address (mendukung proxy Vercel)
  const ip = request.ip || request.headers.get('x-forwarded-for') || '127.0.0.1';

  // Ambil parameter window dari query string
  const windowParam = request.nextUrl.searchParams.get('window');

  // Konversi window ke milidetik
  let windowMs = 60000; // Default: 1 menit (60.000 ms)

  if (windowParam) {
    switch (windowParam) {
      case '1m':
        windowMs = 60 * 1000;
        break;
      case '1h':
        windowMs = 60 * 60 * 1000;
        break;
      case '1d':
        windowMs = 24 * 60 * 60 * 1000;
        break;
      default:
        // Jika parameter tidak valid, tetap gunakan default atau kembalikan error
        windowMs = 60000;
    }
  }

  // Cek Rate Limit
  const { allowed, retryAfter } = checkRateLimit(ip, windowMs);

  if (!allowed) {
    return new NextResponse(
      JSON.stringify({
        error: "Rate limit exceeded",
        retry_after: retryAfter,
        message: `Batas 10 request per ${windowParam || '1m'} tercapai. Silakan coba lagi nanti.`
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': (retryAfter / 1000).toString(),
        },
      }
    );
  }

  return NextResponse.next();
}

// Konfigurasi middleware untuk hanya berjalan pada endpoint API
export const config = {
  matcher: '/api/:path*',
};
