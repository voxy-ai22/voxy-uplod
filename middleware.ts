
import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from './lib/rate-limit';

export function middleware(request: NextRequest) {
  // Hanya berlaku untuk API upload
  if (!request.nextUrl.pathname.startsWith('/api/upload')) {
    return NextResponse.next();
  }

  // Identifikasi IP (Vercel menyediakan 'x-forwarded-for')
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : (request.ip || '127.0.0.1');

  // Ambil window dari query
  const windowParam = request.nextUrl.searchParams.get('window');
  
  let windowMs = 60000;
  let label = '1 Menit';

  if (windowParam === '1h') {
    windowMs = 3600000;
    label = '1 Jam';
  } else if (windowParam === '1d') {
    windowMs = 86400000;
    label = '1 Hari';
  }

  const { allowed, retryAfter } = checkRateLimit(ip, windowMs);

  if (!allowed) {
    const seconds = Math.ceil(retryAfter / 1000);
    return new NextResponse(
      JSON.stringify({
        error: "Rate limit exceeded",
        retry_after: retryAfter,
        message: `Batas 10 unggahan per ${label} tercapai. Tunggu ${seconds} detik lagi.`
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': seconds.toString(),
          'X-RateLimit-Limit': '10',
          'X-RateLimit-Remaining': '0',
        },
      }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
