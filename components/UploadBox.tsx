
'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Upload, ImageIcon, AlertCircle, Clock, Loader2 } from 'lucide-react';
import { validateFile } from '@/lib/blob';
import { motion, AnimatePresence } from 'framer-motion';

interface UploadBoxProps {
  onFileSelect: (file: File, expiryMinutes: number) => void;
  isUploading: boolean;
  progress: number;
}

const EXPIRY_OPTIONS = [
  { label: '1 Menit', value: 1 },
  { label: '1 Jam', value: 60 },
  { label: '1 Hari', value: 1440 },
];

export default function UploadBox({ onFileSelect, isUploading, progress }: UploadBoxProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expiryMinutes, setExpiryMinutes] = useState(60);
  const [loadingText, setLoadingText] = useState('Mengunggah...');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (progress < 30) setLoadingText('Membaca file...');
    else if (progress < 80) setLoadingText('Mengunggah ke Cloud...');
    else if (progress < 99) setLoadingText('Menyiapkan link...');
    else setLoadingText('Selesai!');
  }, [progress]);

  const handleFile = (file: File) => {
    setError(null);
    const check = validateFile(file);
    if (!check.valid) {
      setError(check.message || 'Error');
      return;
    }
    onFileSelect(file, expiryMinutes);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <label className="text-sm font-bold text-slate-600 flex items-center gap-2 px-1">
          <Clock size={16} /> Durasi Simpan Link
        </label>
        <div className="grid grid-cols-3 gap-2">
          {EXPIRY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => !isUploading && setExpiryMinutes(opt.value)}
              disabled={isUploading}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                expiryMinutes === opt.value
                  ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200'
                  : 'bg-white/50 text-slate-500 border-slate-200 hover:border-blue-300'
              } ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); !isUploading && setIsDragActive(true); }}
        onDragLeave={() => setIsDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragActive(false);
          if (!isUploading && e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
        }}
        onClick={() => !isUploading && inputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-[32px] h-64 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 overflow-hidden
          ${isDragActive ? 'border-blue-500 bg-blue-50/50 scale-[1.01]' : 'border-slate-300 hover:border-blue-400 hover:bg-white/40'}
          ${isUploading ? 'border-blue-200 bg-blue-50/20 pointer-events-none' : ''}
        `}
      >
        <input 
          type="file" 
          ref={inputRef} 
          className="hidden" 
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          accept="image/*"
        />
        
        <AnimatePresence mode="wait">
          {isUploading ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center w-full px-10"
            >
              <div className="relative mb-6">
                <Loader2 size={48} className="text-blue-500 animate-spin" />
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-blue-700">
                  {Math.round(progress)}%
                </span>
              </div>
              <p className="text-sm font-bold text-slate-700 mb-4 tracking-tight">{loadingText}</p>
              
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden shadow-inner">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className="h-full bg-blue-600 rounded-full shadow-[0_0_10px_rgba(37,99,235,0.4)]"
                />
              </div>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center"
            >
              <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-600 mb-4 group-hover:scale-110 transition-transform">
                <Upload size={28} />
              </div>
              
              <div className="text-center px-4">
                <p className="text-lg font-semibold text-slate-800 tracking-tight">Klik atau seret gambar</p>
                <p className="text-xs text-slate-500 mt-1">PNG, JPG, atau WebP (Maks 5MB)</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100"
        >
          <AlertCircle size={16} />
          {error}
        </motion.div>
      )}
    </div>
  );
}
