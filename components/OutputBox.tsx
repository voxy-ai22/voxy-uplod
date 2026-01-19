
'use client';

import React, { useState } from 'react';
import { Copy, Check, ExternalLink, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

interface OutputBoxProps {
  url: string;
  onReset: () => void;
}

export default function OutputBox({ url, onReset }: OutputBoxProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-6"
    >
      <div className="glass-dark p-6 rounded-[24px] space-y-4">
        <div className="flex items-center justify-between gap-3 p-3 bg-white/50 rounded-xl border border-white/60">
          <p className="text-xs font-mono text-slate-600 truncate flex-1">{url}</p>
          <button 
            onClick={copyToClipboard}
            className={`p-2.5 rounded-lg transition-all flex items-center gap-2 text-xs font-bold ${copied ? 'bg-green-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Tersalin' : 'Salin'}
          </button>
        </div>

        <div className="aspect-video w-full rounded-2xl overflow-hidden border border-white/40 shadow-inner bg-slate-50">
          <img src={url} alt="Uploaded Result" className="w-full h-full object-contain" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={onReset}
          className="flex items-center justify-center gap-2 py-3.5 rounded-2xl glass font-semibold text-slate-700 hover:bg-white/40 transition-all"
        >
          <RefreshCw size={18} /> Upload Lagi
        </button>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-slate-900 text-white font-semibold hover:bg-black transition-all"
        >
          <ExternalLink size={18} /> Lihat Gambar
        </a>
      </div>
    </motion.div>
  );
}
