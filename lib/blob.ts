
export const validateFile = (file: File) => {
  const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!validTypes.includes(file.type)) {
    return { valid: false, message: 'Format file tidak didukung (Gunakan PNG/JPG/WebP)' };
  }
  if (file.size > maxSize) {
    return { valid: false, message: 'Ukuran file terlalu besar (Maks 5MB)' };
  }
  return { valid: true };
};
