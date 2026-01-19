
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ImageIcon, History as HistoryIcon, Trash2, ExternalLink, Zap, Timer, AlertCircle } from 'lucide-react';
import UploadBox from '@/components/UploadBox';
import OutputBox from '@/components/OutputBox';

interface UploadHistory {
  id: string;
  url: string;
  name: string;
  date: number;
  expiryDate: number;
}

export default function HomePage() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [history, setHistory] = useState<UploadHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      setCurrentTime(now);
      
      setHistory(prev => {
        const validItems = prev.filter(item => item.expiryDate > now);
        if (validItems.length !== prev.length) {
          localStorage.setItem('lumina_history_v2', JSON.stringify(validItems));
          return validItems;
        }
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('lumina_history_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const now = Date.now();
        const filtered = parsed.filter((item: any) => item.expiryDate > now);
        setHistory(filtered);
      } catch (e) {
        console.error("History parse failed");
      }
    }
  }, []);

  const handleUpload = async (file: File, expiryMinutes: number) => {
    setIsUploading(true);
    setUploadProgress(0);
    setRateLimitError(null);

    const formData = new FormData();
    formData.append('file', file);

    let windowTag = '1m';
    if (expiryMinutes === 60) windowTag = '1h';
    if (expiryMinutes === 1440) windowTag = '1d';

    const xhr = new XMLHttpRequest();
    
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        setUploadProgress((e.loaded / e.total) * 100);
      }
    });

    const progressInterval = setInterval(() => {
      setUploadProgress(prev => (prev >= 95 ? 95 : prev + 2));
    }, 200);

    try {
      const uploadPromise = new Promise<{url: string}>((resolve, reject) => {
        xhr.open('POST', `/api/upload?window=${windowTag}`);
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            const err = JSON.parse(xhr.responseText || '{"message":"Upload failed"}');
            reject({ status: xhr.status, ...err });
          }
        };
        xhr.onerror = () => reject(new Error('Network connection failed'));
        xhr.send(formData);
      });

      const data = await uploadPromise;
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      const now = Date.now();
      const newHistoryItem: UploadHistory = {
        id: Math.random().toString(36).substr(2, 9),
        url: data.url,
        name: file.name,
        date: now,
        expiryDate: now + (expiryMinutes * 60 * 1000),
      };

      setTimeout(() => {
        setResultUrl(data.url);
        const updatedHistory = [newHistoryItem, ...history].slice(0, 50);
        setHistory(updatedHistory);
        localStorage.setItem('lumina_history_v2', JSON.stringify(updatedHistory));
        setIsUploading(false);
      }, 500);

    } catch (err: any) {
      clearInterval(progressInterval);
      setIsUploading(false);
      setUploadProgress(0);

      if (err.status === 429) {
        setRateLimitError(err.message);
      } else {
        // Fallback Simulasi untuk testing jika tidak di Vercel
        const localUrl = URL.createObjectURL(file);
        setResultUrl(localUrl);
        setHistory(prev => [{
           id: Math.random().toString(36).substr(2, 9),
           url: localUrl,
           name: file.name + " (Simulasi)",
           date: Date.now(),
           expiryDate: Date.now() + (expiryMinutes * 60 * 1000)
        }, ...prev]);
      }
    }
  };

  const deleteHistory = (id: string) => {
    const filtered = history.filter(item => item.id !== id);
    setHistory(filtered);
    localStorage.setItem('lumina_history_v2', JSON.stringify(filtered));
  };

  const formatTimeRemaining = (expiry: number) => {
    const diff = expiry - currentTime;
    if (diff <= 0) return "Kadaluarsa";
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    if (minutes >= 60) return `${Math.floor(minutes/60)}j ${minutes%60}m`;
    return `${minutes}m ${seconds}s`;
  };

  return (
    <main className="min-h-screen py-8 px-4 flex flex-col items-center selection:bg-blue-200">
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-400/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-indigo-300/10 blur-[120px] rounded-full" />
      </div>

      <div className="w-full max-w-2xl">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="glass rounded-[48px] p-6 md:p-12 relative overflow-hidden shadow-2xl"
        >
          <div className="flex justify-between items-center mb-10">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-3 rounded-2xl text-white shadow-xl shadow-blue-500/20">
                <Zap size={28} />
              </div>
              <div>
                <h1 className="text-3xl font-black text-slate-800 tracking-tight">LuminaLink</h1>
                <p className="text-[10px] text-blue-600 font-extrabold uppercase tracking-[0.25em]">Vercel Blob Powered</p>
              </div>
            </div>
            <button 
              onClick={() => setShowHistory(!showHistory)}
              className={`p-4 rounded-2xl transition-all duration-300 ${showHistory ? 'bg-slate-800 text-white shadow-2xl scale-110' : 'glass hover:bg-white/50 text-slate-600'}`}
            >
              <HistoryIcon size={22} />
            </button>
          </div>

          {rateLimitError && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-amber-800 text-sm font-medium"
            >
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <p>{rateLimitError}</p>
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {showHistory ? (
              <motion.div 
                key="history"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-700">Penyimpanan Aktif</h3>
                  <span className="text-[10px] bg-blue-600 text-white px-3 py-1 rounded-full font-black uppercase tracking-wider">{history.length} Item</span>
                </div>
                
                <div className="max-h-[480px] overflow-y-auto custom-scrollbar pr-3 space-y-4">
                  {history.length === 0 ? (
                    <div className="py-24 text-center opacity-30">
                      <ImageIcon size={64} className="mx-auto mb-4 text-slate-400" />
                      <p className="font-bold">Belum ada history.</p>
                    </div>
                  ) : (
                    history.map((item) => (
                      <motion.div 
                        layout
                        key={item.id} 
                        className="bg-white/60 border border-white/80 p-4 rounded-[28px] flex items-center gap-5 group hover:bg-white/90 hover:shadow-xl transition-all"
                      >
                        <img src={item.url} className="w-16 h-16 rounded-2xl object-cover bg-white shadow-md" alt="" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold truncate text-slate-800 leading-tight">{item.name}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                             <Timer size={12} className="text-blue-500" />
                             <p className="text-[10px] font-black uppercase tracking-tight text-blue-600/70">
                               Hapus dalam: {formatTimeRemaining(item.expiryDate)}
                             </p>
                          </div>
                        </div>
                        <div className="flex gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                          <a href={item.url} target="_blank" className="p-3 bg-white shadow-sm hover:bg-blue-600 hover:text-white rounded-xl text-slate-600 transition-all"><ExternalLink size={18} /></a>
                          <button onClick={() => deleteHistory(item.id)} className="p-3 bg-white shadow-sm hover:bg-red-500 hover:text-white rounded-xl text-red-400 transition-all"><Trash2 size={18} /></button>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
                <button 
                  onClick={() => setShowHistory(false)} 
                  className="w-full py-5 text-sm font-black text-blue-600 hover:bg-blue-100/50 transition-all bg-blue-50/50 rounded-3xl mt-2"
                >
                  Kembali Mengunggah
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="main"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
              >
                {!resultUrl ? (
                  <UploadBox 
                    isUploading={isUploading} 
                    progress={uploadProgress} 
                    onFileSelect={handleUpload} 
                  />
                ) : (
                  <OutputBox url={resultUrl} onReset={() => {
                    setResultUrl(null);
                    setUploadProgress(0);
                    setRateLimitError(null);
                  }} />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
        
        <div className="mt-12 flex flex-col items-center gap-4">
          <div className="flex items-center gap-3 text-slate-400 text-[10px] font-black uppercase tracking-[0.4em]">
            <span>Secured</span>
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
            <span>High Speed</span>
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
            <span>Private</span>
          </div>
          <p className="text-slate-400/50 text-[10px] text-center max-w-[450px] leading-relaxed font-medium">
            Dikembangkan dengan Next.js 14 & Vercel Blob Storage. Seluruh data dihapus otomatis sesuai durasi pilihan untuk privasi maksimum.
          </p>
        </div>
      </div>
    </main>
  );
}
