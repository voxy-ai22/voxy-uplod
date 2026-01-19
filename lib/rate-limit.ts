
interface RateLimitEntry {
  timestamps: number[];
}

// Memory-based storage (Catatan: Pada serverless, ini bersifat ephemeris per instance)
const storage = new Map<string, RateLimitEntry>();

/**
 * Mengecek apakah IP tertentu diperbolehkan melakukan request.
 * Implementasi "Sliding Window Log" sederhana.
 */
export function checkRateLimit(ip: string, windowMs: number): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  const limit = 10; // Maksimal 10 request per window

  let entry = storage.get(ip);
  if (!entry) {
    entry = { timestamps: [] };
  }

  // Bersihkan timestamp yang sudah kadaluarsa (di luar window)
  const validTimestamps = entry.timestamps.filter((ts) => now - ts < windowMs);

  if (validTimestamps.length >= limit) {
    const oldestTimestamp = validTimestamps[0];
    const retryAfter = Math.max(0, oldestTimestamp + windowMs - now);
    
    return { allowed: false, retryAfter };
  }

  // Tambahkan hit baru
  validTimestamps.push(now);
  storage.set(ip, { timestamps: validTimestamps });

  // Cleanup: Hapus entri IP yang sudah tidak memiliki timestamp aktif untuk menghemat RAM
  if (storage.size > 1000) {
    for (const [key, val] of storage.entries()) {
      if (val.timestamps.length === 0 || (now - val.timestamps[val.timestamps.length - 1] > 86400000)) {
        storage.delete(key);
      }
    }
  }

  return { allowed: true, retryAfter: 0 };
}
