
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  Upload, 
  Copy, 
  CheckCircle, 
  AlertCircle, 
  Image as ImageIcon, 
  Trash2, 
  ExternalLink,
  History,
  X,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Types ---
interface UploadedItem {
  id: string;
  name: string;
  url: string;
  timestamp: number;
  size: number;
  isSimulated?: boolean;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadUrl, setUploadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<UploadedItem[]>([]);
  const [isDragActive, setIsDragActive] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [isSimulatedMode, setIsSimulatedMode] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('lumina_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('lumina_history', JSON.stringify(history));
  }, [history]);

  const handleFileChange = (selectedFile: File) => {
    setError(null);
    setUploadUrl(null);
    setIsSimulatedMode(false);

    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(selectedFile.type)) {
      setError("Format file tidak didukung. Gunakan PNG, JPG, atau WebP.");
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setError("Ukuran file terlalu besar! Maksimal 5MB.");
      return;
    }

    setFile(selectedFile);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);
  };

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  }, []);

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Attempt real upload
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      }).catch(err => {
        // Catch network errors like "Failed to fetch"
        throw new Error('NETWORK_ERROR');
      });

      if (response instanceof Error || !response.ok) {
        throw new Error('API_UNAVAILABLE');
      }

      const result = await response.json();
      completeUpload(result.url, false);

    } catch (err: any) {
      console.warn("API fallback triggered:", err.message);
      
      // FALLBACK: Simulate success locally if backend is missing
      // This is helpful for previews/testing without a running Vercel environment
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate delay
      const localUrl = URL.createObjectURL(file);
      completeUpload(localUrl, true);
      setIsSimulatedMode(true);
    } finally {
      setIsUploading(false);
    }
  };

  const completeUpload = (url: string, isSimulated: boolean) => {
    setUploadUrl(url);
    const newItem: UploadedItem = {
      id: Math.random().toString(36).substring(7),
      name: file?.name || 'unnamed-image',
      url: url,
      timestamp: Date.now(),
      size: file?.size || 0,
      isSimulated
    };
    setHistory(prev => [newItem, ...prev]);
    setFile(null);
    setPreview(null);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const deleteFromHistory = (id: string) => {
    setHistory(prev => {
      const item = prev.find(i => i.id === id);
      if (item?.isSimulated && item.url.startsWith('blob:')) {
        URL.revokeObjectURL(item.url);
      }
      return prev.filter(i => i.id !== id);
    });
  };

  const resetUpload = () => {
    setFile(null);
    setPreview(null);
    setUploadUrl(null);
    setError(null);
    setIsSimulatedMode(false);
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center p-4 overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/20 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-400/20 blur-[120px] rounded-full"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl relative z-10"
      >
        <div className="glass rounded-[28px] p-8 shadow-2xl relative overflow-hidden">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 glow-text flex items-center gap-2">
                <ImageIcon className="text-blue-500" />
                LuminaLink
              </h1>
              <p className="text-slate-500 font-medium">Image to Link Generator</p>
            </div>
            <button 
              onClick={() => setShowHistory(true)}
              className="p-3 rounded-full glass hover:bg-white/20 transition-all text-slate-600 relative"
            >
              <History size={20} />
              {history.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold">
                  {history.length}
                </span>
              )}
            </button>
          </div>

          <AnimatePresence mode="wait">
            {!uploadUrl ? (
              <motion.div
                key="upload-zone"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-6"
              >
                <div
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  onDrop={onDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`
                    relative group cursor-pointer transition-all duration-500
                    border-2 border-dashed rounded-[24px] h-64 flex flex-col items-center justify-center gap-4
                    ${isDragActive ? 'border-blue-400 bg-blue-50/50 scale-[1.02]' : 'border-white/40 hover:border-blue-300 hover:bg-white/5'}
                  `}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                    accept="image/*"
                  />
                  
                  {preview ? (
                    <div className="absolute inset-0 p-2">
                      <img src={preview} alt="Preview" className="w-full h-full object-contain rounded-[18px] fade-in" />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-[18px] flex items-center justify-center">
                        <p className="text-white font-medium bg-black/40 px-4 py-2 rounded-full backdrop-blur-md">Ubah Gambar</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform shadow-[0_0_40px_rgba(59,130,246,0.2)]">
                        <Upload size={32} />
                      </div>
                      <div className="text-center px-4">
                        <p className="text-lg font-semibold text-slate-700">Drop your image here</p>
                        <p className="text-sm text-slate-500">or click to browse from device</p>
                      </div>
                      <p className="text-[11px] uppercase tracking-widest text-slate-400 font-bold">PNG, JPG, WEBP • MAX 5MB</p>
                    </>
                  )}
                </div>

                {error && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }} 
                    animate={{ height: 'auto', opacity: 1 }}
                    className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 text-red-600 text-sm border border-red-500/20"
                  >
                    <AlertCircle size={16} />
                    {error}
                  </motion.div>
                )}

                <button
                  disabled={!file || isUploading}
                  onClick={handleUpload}
                  className={`
                    w-full py-4 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-3
                    ${!file || isUploading 
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                      : 'bg-blue-600 text-white shadow-[0_8px_20px_rgba(37,99,235,0.3)] hover:shadow-[0_12px_24px_rgba(37,99,235,0.4)] hover:-translate-y-1 active:scale-95'}
                  `}
                >
                  {isUploading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Proses Mengunggah...
                    </>
                  ) : (
                    <>Generate Public Link</>
                  )}
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="result-zone"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center text-green-500">
                    <CheckCircle size={32} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800">Berhasil!</h2>
                    <p className="text-slate-500">Tautan Anda siap digunakan.</p>
                    {isSimulatedMode && (
                      <span className="inline-flex items-center gap-1 mt-2 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-[10px] font-bold uppercase tracking-wider">
                        <Zap size={10} /> Local Simulation
                      </span>
                    )}
                  </div>
                </div>

                <div className="glass-card p-4 rounded-2xl border border-white/40 space-y-4">
                  <div className="flex items-center justify-between gap-2 p-3 bg-white/40 rounded-xl border border-white/60">
                    <p className="text-xs font-mono text-slate-600 truncate flex-1">
                      {isSimulatedMode ? "Local Session Link (Testing Mode)" : uploadUrl}
                    </p>
                    <button 
                      onClick={() => copyToClipboard(uploadUrl, 'main')}
                      className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm shrink-0"
                    >
                      {copiedId === 'main' ? <CheckCircle size={14} /> : <Copy size={14} />}
                      {copiedId === 'main' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  
                  <div className="aspect-video w-full glass rounded-xl overflow-hidden relative group">
                    <img src={uploadUrl} alt="Final" className="w-full h-full object-contain" />
                    {isSimulatedMode && (
                      <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md text-white text-[10px] px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                        This is a temporary local link
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={resetUpload}
                    className="py-3 rounded-xl glass text-slate-700 font-semibold hover:bg-white/30 transition-all border border-white/50"
                  >
                    Upload Baru
                  </button>
                  <a
                    href={uploadUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="py-3 rounded-xl bg-slate-800 text-white font-semibold flex items-center justify-center gap-2 hover:bg-slate-900 transition-all"
                  >
                    <ExternalLink size={16} /> Buka Gambar
                  </a>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="text-center mt-6 text-slate-400 text-xs font-medium uppercase tracking-widest">
          Secured by Vercel Blob Storage • Powered by LuminaLink
        </p>
      </motion.div>

      <AnimatePresence>
        {showHistory && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHistory(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-md h-full glass shadow-2xl p-6 flex flex-col border-l border-white/20"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <History size={20} className="text-blue-500" />
                  Riwayat Unggahan
                </h3>
                <button 
                  onClick={() => setShowHistory(false)}
                  className="p-2 hover:bg-white/20 rounded-full text-slate-500 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
                {history.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-50 p-8">
                    <ImageIcon size={48} className="mb-4 text-slate-300" />
                    <p className="text-slate-600 font-medium">Belum ada history</p>
                    <p className="text-sm">Gambar Anda akan muncul di sini</p>
                  </div>
                ) : (
                  history.map((item) => (
                    <div key={item.id} className="glass-card rounded-2xl p-4 flex gap-4 group relative">
                      <div className="w-16 h-16 rounded-xl overflow-hidden glass shrink-0">
                        <img src={item.url} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-slate-700 truncate">{item.name}</p>
                          {item.isSimulated && (
                            <span className="bg-amber-100 text-amber-700 text-[8px] px-1.5 py-0.5 rounded font-bold">LOCAL</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">{(item.size / 1024).toFixed(1)} KB • {new Date(item.timestamp).toLocaleDateString()}</p>
                        <div className="flex gap-3 mt-2">
                          <button 
                            onClick={() => copyToClipboard(item.url, item.id)}
                            className="text-xs flex items-center gap-1 text-blue-600 font-bold hover:underline"
                          >
                            {copiedId === item.id ? <CheckCircle size={12} /> : <Copy size={12} />}
                            {copiedId === item.id ? 'Copied' : 'Copy Link'}
                          </button>
                          <a 
                            href={item.url} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="text-xs flex items-center gap-1 text-slate-500 hover:text-slate-800"
                          >
                            <ExternalLink size={12} /> Buka
                          </a>
                        </div>
                      </div>
                      <button 
                        onClick={() => deleteFromHistory(item.id)}
                        className="text-slate-300 hover:text-red-500 transition-colors self-start p-1"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
