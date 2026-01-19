
interface RateLimitEntry {
  timestamps: number[];
}

const storage = new Map<string, RateLimitEntry>();

/**
 * Mengecek apakah IP tertentu diperbolehkan melakukan request dalam window waktu tertentu.
 * @param ip Alamat IP pengguna
 * @param windowMs Durasi window dalam milidetik
 * @returns Object berisi status allowed dan waktu tunggu jika diblok
 */
export function checkRateLimit(ip: string, windowMs: number): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  const limit = 10; // Maksimal 10 request per window

  // Ambil data IP dari storage
  let entry = storage.get(ip);
  if (!entry) {
    entry = { timestamps: [] };
  }

  // Filter timestamp yang masih dalam rentang window realtime
  const validTimestamps = entry.timestamps.filter((timestamp) => now - timestamp < windowMs);

  // Jika jumlah request sudah mencapai limit
  if (validTimestamps.length >= limit) {
    // Hitung retry_after dari timestamp tertua yang masih valid
    const oldestTimestamp = validTimestamps[0];
    const retryAfter = Math.max(0, oldestTimestamp + windowMs - now);
    
    return { allowed: false, retryAfter };
  }

  // Tambahkan timestamp baru
  validTimestamps.push(now);
  
  // Simpan kembali ke storage
  storage.set(ip, { timestamps: validTimestamps });

  return { allowed: true, retryAfter: 0 };
}
