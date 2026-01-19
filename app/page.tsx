
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ImageIcon, History as HistoryIcon, Trash2, ExternalLink, Zap, Timer } from 'lucide-react';
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

  // Timer untuk update UI countdown dan auto-cleanup
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
        console.error("Failed to parse history");
      }
    }
  }, []);

  const handleUpload = async (file: File, expiryMinutes: number) => {
    setIsUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', file);

    // Tentukan window parameter untuk rate limit berdasarkan pilihan user
    let windowTag = '1m';
    if (expiryMinutes === 60) windowTag = '1h';
    if (expiryMinutes === 1440) windowTag = '1d';

    // Menggunakan XMLHttpRequest untuk progress real-time
    const xhr = new XMLHttpRequest();
    
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percentComplete = (e.loaded / e.total) * 100;
        setUploadProgress(percentComplete);
      }
    });

    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 95) {
          clearInterval(progressInterval);
          return 95;
        }
        return prev + Math.random() * 5;
      });
    }, 150);

    try {
      const uploadPromise = new Promise<{url: string}>((resolve, reject) => {
        // Menambahkan parameter window ke query URL untuk Middleware
        xhr.open('POST', `/api/upload?window=${windowTag}`);
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else if (xhr.status === 429) {
            const errData = JSON.parse(xhr.responseText);
            reject(new Error(errData.message || 'Rate limit exceeded'));
          } else {
            reject(new Error('Upload failed'));
          }
        };
        xhr.onerror = () => reject(new Error('Network error'));
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
      alert("Pesan Sistem: " + err.message);
      
      // Jika error bukan rate limit, lakukan fallback simulasi (hanya untuk testing UI)
      if (!err.message.includes('Rate limit')) {
        const localUrl = URL.createObjectURL(file);
        const now = Date.now();
        const newHistoryItem: UploadHistory = {
          id: Math.random().toString(36).substr(2, 9),
          url: localUrl,
          name: file.name + " (Simulasi)",
          date: now,
          expiryDate: now + (expiryMinutes * 60 * 1000),
        };
        setResultUrl(localUrl);
        setHistory(prev => [newHistoryItem, ...prev]);
      }
      
      setIsUploading(false);
      setUploadProgress(0);
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
    
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}j ${mins}m`;
    }
    return `${minutes}m ${seconds}s`;
  };

  return (
    <main className="min-h-screen py-8 px-4 flex flex-col items-center">
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-300/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-200/10 blur-[120px] rounded-full" />
      </div>

      <div className="w-full max-w-2xl">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-[40px] p-6 md:p-10 relative overflow-hidden"
        >
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2.5 rounded-2xl text-white glow-blue">
                <Zap size={24} />
              </div>
              <div>
                <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">LuminaLink</h1>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Unlimited Cloud Storage</p>
              </div>
            </div>
            <button 
              onClick={() => setShowHistory(!showHistory)}
              className={`p-3.5 rounded-2xl transition-all ${showHistory ? 'bg-slate-800 text-white shadow-lg' : 'glass hover:bg-white/40 text-slate-600'}`}
            >
              <HistoryIcon size={20} />
            </button>
          </div>

          <AnimatePresence mode="wait">
            {showHistory ? (
              <motion.div 
                key="history"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-slate-700">Riwayat Berkas</h3>
                  <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-extrabold">{history.length} AKTIF</span>
                </div>
                
                <div className="max-h-[450px] overflow-y-auto custom-scrollbar pr-2 space-y-3">
                  {history.length === 0 ? (
                    <div className="py-20 text-center flex flex-col items-center opacity-40">
                      <ImageIcon size={48} className="mb-2 text-slate-400" />
                      <p className="text-sm font-medium">Belum ada history unggahan.</p>
                    </div>
                  ) : (
                    history.map((item) => (
                      <div key={item.id} className="bg-white/40 border border-white/60 p-3 rounded-2xl flex items-center gap-4 group hover:bg-white/60 transition-all border-l-4 border-l-blue-500">
                        <div className="relative">
                          <img src={item.url} className="w-14 h-14 rounded-xl object-cover bg-white shadow-sm" alt="" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold truncate text-slate-700 leading-tight">{item.name}</p>
                          <div className="flex items-center gap-1.5 mt-1 text-slate-500">
                             <Timer size={10} />
                             <p className="text-[10px] font-bold uppercase tracking-tight text-blue-600">
                               Kadaluarsa: {formatTimeRemaining(item.expiryDate)}
                             </p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <a href={item.url} target="_blank" className="p-2.5 hover:bg-blue-600 hover:text-white rounded-xl text-slate-400 transition-all"><ExternalLink size={16} /></a>
                          <button onClick={() => deleteHistory(item.id)} className="p-2.5 hover:bg-red-500 hover:text-white rounded-xl text-red-300 transition-all"><Trash2 size={16} /></button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <button 
                  onClick={() => setShowHistory(false)} 
                  className="w-full py-4 text-sm font-bold text-blue-600 hover:bg-blue-100/50 transition-all bg-blue-50/50 rounded-2xl mt-4"
                >
                  Kembali ke Menu Utama
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="main"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
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
                  }} />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
        
        <div className="mt-8 flex flex-col items-center gap-2">
          <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-[0.3em]">
            <span>Rate Limited</span>
            <span className="w-1 h-1 bg-slate-300 rounded-full" />
            <span>High Fidelity</span>
            <span className="w-1 h-1 bg-slate-300 rounded-full" />
            <span>Encrypted</span>
          </div>
          <p className="text-slate-400/50 text-[9px] text-center max-w-[400px] leading-relaxed">
            Sistem Rate Limit aktif: Maksimal 10 unggahan per window waktu yang dipilih (1m/1h/1d).
          </p>
        </div>
      </div>
    </main>
  );
}
