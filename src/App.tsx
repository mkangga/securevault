/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Gift, Loader2, KeyRound, Sparkles, ExternalLink, Settings } from 'lucide-react';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [giftLink, setGiftLink] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isBoxOpen, setIsBoxOpen] = useState(false);
  
  // Admin Mode State (Hidden)
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [adminPin, setAdminPin] = useState('');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminLink, setAdminLink] = useState('');
  const [adminMsg, setAdminMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setIsAuthenticated(true);
        setGiftLink(data.gift_link);
      } else {
        setError(data.message || 'Kode atau password salah');
      }
    } catch (err) {
      setError('Koneksi error. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminAuth = (e: React.FormEvent) => {
    e.preventDefault();
    // We don't validate client-side for security, we just store it to send to server
    // But for UX, we can check if it's not empty
    if (adminPin) {
      setIsAdminAuthenticated(true);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAdminMsg('');
    
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username, 
          password, 
          gift_link: adminLink,
          admin_secret: adminPin // Send the PIN as secret
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setAdminMsg('Hadiah dibuat! Username: ' + username);
        setUsername('');
        setPassword('');
        setAdminLink('');
      } else {
        setAdminMsg('Error: ' + data.message);
        if (res.status === 401) {
             setIsAdminAuthenticated(false); // Reset if wrong password
             setAdminPin('');
        }
      }
    } catch (err) {
      setAdminMsg('Gagal membuat hadiah');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1a0b2e] text-white font-sans overflow-hidden relative selection:bg-purple-500/30">
      {/* Magical Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(120,50,255,0.15),transparent_70%)]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 brightness-100 contrast-150" />
        {/* Floating particles */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-yellow-200 rounded-full"
            initial={{ 
              x: Math.random() * window.innerWidth, 
              y: Math.random() * window.innerHeight,
              opacity: 0 
            }}
            animate={{ 
              y: [null, Math.random() * -100],
              opacity: [0, 1, 0],
            }}
            transition={{ 
              duration: 3 + Math.random() * 5, 
              repeat: Infinity,
              delay: Math.random() * 5
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <AnimatePresence mode="wait">
          {!isAuthenticated ? (
            <motion.div
              key="login"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
              className="w-full max-w-sm"
            >
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-[0_0_50px_-10px_rgba(139,92,246,0.3)] relative overflow-hidden">
                
                {/* Header */}
                <div className="text-center mb-8">
                  <motion.div 
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                    className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg transform rotate-3"
                  >
                    <Gift className="w-10 h-10 text-white" />
                  </motion.div>
                  <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Hadiah Misterius</h1>
                  <p className="text-purple-200 text-sm">Masukkan kode rahasia untuk membuka hadiahmu</p>
                </div>

                {/* Login Form */}
                {!isAdminMode ? (
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-4">
                      <div className="relative group">
                        <input
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 pl-11 text-white placeholder-white/30 focus:outline-none focus:border-purple-400 focus:bg-black/30 transition-all font-medium"
                          placeholder="Username / Kode"
                        />
                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 group-focus-within:text-purple-400 transition-colors" />
                      </div>

                      <div className="relative group">
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 pl-11 text-white placeholder-white/30 focus:outline-none focus:border-purple-400 focus:bg-black/30 transition-all font-medium"
                          placeholder="Password Rahasia"
                        />
                        <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 group-focus-within:text-purple-400 transition-colors" />
                      </div>
                    </div>

                    <AnimatePresence>
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="text-red-300 text-sm text-center bg-red-500/20 py-2 rounded-lg"
                        >
                          {error}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3.5 rounded-xl hover:shadow-[0_0_20px_rgba(168,85,247,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                      {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'BUKA HADIAH'}
                    </button>
                  </form>
                ) : (
                  /* Admin Mode Container */
                  <div className="space-y-4">
                    <div className="text-center text-xs text-yellow-300 font-mono mb-2">MODE ADMIN</div>
                    
                    {!isAdminAuthenticated ? (
                      /* 1. Admin PIN Entry */
                      <form onSubmit={handleAdminAuth} className="space-y-3">
                         <p className="text-xs text-center text-white/60">Masukkan Rahasia Admin untuk lanjut</p>
                         <input
                          type="password"
                          value={adminPin}
                          onChange={(e) => setAdminPin(e.target.value)}
                          className="w-full bg-black/40 border border-yellow-500/50 rounded-lg px-3 py-2 text-sm text-center tracking-widest"
                          placeholder="RAHASIA ADMIN"
                          autoFocus
                        />
                        <button type="submit" className="w-full bg-yellow-600/50 hover:bg-yellow-600 text-white font-bold py-2 rounded-lg text-sm transition-colors">
                          BUKA KUNCI
                        </button>
                      </form>
                    ) : (
                      /* 2. Create Gift Form (Only shown if PIN entered) */
                      <form onSubmit={handleRegister} className="space-y-3">
                        <div className="p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20 mb-2">
                           <p className="text-[10px] text-yellow-200/70 text-center mb-2">BUAT HADIAH BARU</p>
                           <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm mb-2"
                            placeholder="Username Baru"
                          />
                          <input
                            type="text"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm mb-2"
                            placeholder="Password Baru"
                          />
                          <input
                            type="text"
                            value={adminLink}
                            onChange={(e) => setAdminLink(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm"
                            placeholder="Link Hadiah"
                          />
                        </div>
                        
                        <button type="submit" className="w-full bg-yellow-600 text-black font-bold py-2 rounded-lg text-sm hover:bg-yellow-500 transition-colors">
                          BUAT HADIAH
                        </button>
                        {adminMsg && <div className="text-xs text-center text-white bg-black/20 p-2 rounded">{adminMsg}</div>}
                      </form>
                    )}

                    <button 
                      type="button" 
                      onClick={() => {
                        setIsAdminMode(false);
                        setIsAdminAuthenticated(false);
                        setAdminPin('');
                        setAdminMsg('');
                      }} 
                      className="w-full text-xs text-white/30 hover:text-white transition-colors mt-2"
                    >
                      Keluar Mode Admin
                    </button>
                  </div>
                )}

                {/* Secret Admin Trigger */}
                {!isAdminMode && (
                  <div className="mt-6 flex justify-center">
                    <button 
                      onClick={() => setIsAdminMode(true)} 
                      className="w-8 h-1 bg-white/5 rounded-full hover:bg-white/20 transition-colors"
                    />
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="gift-reveal"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center w-full max-w-md"
            >
              {!isBoxOpen ? (
                <motion.div
                  className="cursor-pointer"
                  onClick={() => setIsBoxOpen(true)}
                  whileHover={{ scale: 1.05, rotate: [0, -2, 2, 0] }}
                  whileTap={{ scale: 0.95 }}
                >
                  <motion.div 
                    className="w-64 h-64 mx-auto bg-gradient-to-br from-purple-600 to-pink-600 rounded-3xl shadow-[0_0_80px_rgba(168,85,247,0.6)] flex items-center justify-center relative z-10"
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Gift className="w-32 h-32 text-white" />
                    <div className="absolute inset-0 border-4 border-yellow-400/30 rounded-3xl" />
                    <div className="absolute top-1/2 left-0 w-full h-8 bg-yellow-400/20 -translate-y-1/2" />
                    <div className="absolute top-0 left-1/2 w-8 h-full bg-yellow-400/20 -translate-x-1/2" />
                  </motion.div>
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-8 text-2xl font-bold text-white animate-pulse"
                  >
                    KETUK UNTUK BUKA!
                  </motion.p>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", bounce: 0.5 }}
                  className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl"
                >
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                    className="w-20 h-20 bg-green-500 rounded-full mx-auto mb-6 flex items-center justify-center shadow-lg"
                  >
                    <span className="text-4xl">🎉</span>
                  </motion.div>
                  
                  <h2 className="text-3xl font-bold text-white mb-2">SELAMAT!</h2>
                  <p className="text-purple-200 mb-8">Kamu telah membuka hadiah spesial dari {username}.</p>
                  
                  <motion.a
                    href={giftLink.startsWith('http') ? giftLink : `https://${giftLink}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="block w-full bg-[#118EEA] text-white font-bold py-4 rounded-xl shadow-lg hover:bg-[#0c7bc0] transition-colors flex items-center justify-center gap-2"
                  >
                    <ExternalLink className="w-5 h-5" />
                    Klaim Hadiah
                  </motion.a>

                  <button 
                    onClick={() => {
                      setIsAuthenticated(false);
                      setIsBoxOpen(false);
                      setUsername('');
                      setPassword('');
                    }}
                    className="mt-6 text-sm text-white/40 hover:text-white transition-colors"
                  >
                    Tutup & Keluar
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Footer */}
      <div className="absolute bottom-4 left-0 w-full text-center z-20">
        <p className="text-white/20 text-xs font-mono">by MKA</p>
      </div>
    </div>
  );
}

