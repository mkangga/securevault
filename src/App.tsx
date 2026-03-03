/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Unlock, ShieldCheck, AlertCircle, Loader2, Terminal, User, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [shake, setShake] = useState(0);
  const [currentUser, setCurrentUser] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;

    setIsLoading(true);
    setError('');
    setSuccessMsg('');

    const endpoint = isLoginMode ? '/api/login' : '/api/register';

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        if (isLoginMode) {
          setIsAuthenticated(true);
          setCurrentUser(data.username);
        } else {
          setSuccessMsg('Registration successful! Please login.');
          setIsLoginMode(true);
          setPassword('');
        }
      } else {
        setError(data.message || 'Operation failed');
        setShake(prev => prev + 1);
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans overflow-hidden relative selection:bg-emerald-500/30">
      {/* Background Atmosphere */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-emerald-900/20 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-900/20 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150" />
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <AnimatePresence mode="wait">
          {!isAuthenticated ? (
            <motion.div
              key="auth-card"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-md"
            >
              <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl relative overflow-hidden group">
                {/* Scanning line effect */}
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent -translate-x-full group-hover:animate-[scan_3s_ease-in-out_infinite]" />
                
                <div className="flex flex-col items-center mb-8">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 border border-white/10 shadow-[0_0_30px_-10px_rgba(16,185,129,0.3)]">
                    <Lock className="w-6 h-6 text-emerald-400" />
                  </div>
                  <h1 className="text-2xl font-medium tracking-tight text-white">Secure Vault</h1>
                  <p className="text-white/40 text-sm mt-2 font-mono">Restricted Access // Level 5</p>
                </div>

                {/* Tabs */}
                <div className="flex bg-white/5 rounded-lg p-1 mb-6">
                  <button
                    onClick={() => { setIsLoginMode(true); setError(''); setSuccessMsg(''); }}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${isLoginMode ? 'bg-white/10 text-white shadow-sm' : 'text-white/40 hover:text-white/60'}`}
                  >
                    LOGIN
                  </button>
                  <button
                    onClick={() => { setIsLoginMode(false); setError(''); setSuccessMsg(''); }}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${!isLoginMode ? 'bg-white/10 text-white shadow-sm' : 'text-white/40 hover:text-white/60'}`}
                  >
                    REGISTER
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <motion.div 
                    animate={{ x: shake % 2 === 0 ? 0 : [-10, 10, -10, 10, 0] }}
                    transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                    className="space-y-4"
                  >
                    <div className="relative group/input">
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pl-11 text-white placeholder-white/20 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all font-mono tracking-wide"
                        placeholder="USERNAME"
                      />
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within/input:text-emerald-400 transition-colors" />
                    </div>

                    <div className="relative group/input">
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pl-11 text-white placeholder-white/20 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all font-mono tracking-widest"
                        placeholder="PASSWORD"
                      />
                      <Terminal className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within/input:text-emerald-400 transition-colors" />
                    </div>
                  </motion.div>

                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center gap-2 text-red-400 text-sm font-mono bg-red-500/10 py-2 px-3 rounded-lg border border-red-500/20"
                      >
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        {error}
                      </motion.div>
                    )}
                    {successMsg && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center gap-2 text-emerald-400 text-sm font-mono bg-emerald-500/10 py-2 px-3 rounded-lg border border-emerald-500/20"
                      >
                        <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                        {successMsg}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="w-full bg-white text-black font-medium py-3 rounded-xl hover:bg-emerald-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 relative overflow-hidden group/btn"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <span>{isLoginMode ? 'AUTHENTICATE' : 'INITIALIZE ID'}</span>
                        <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full hover:animate-[shimmer_1s_infinite]" />
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-6 text-center">
                  <p className="text-[10px] text-white/20 font-mono uppercase tracking-widest">
                    Secured by Bcrypt Hashing
                    <br />
                    IP: {`192.168.X.X`}
                  </p>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, scale: 0.9, filter: 'blur(20px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-4xl"
            >
              <div className="bg-black/60 backdrop-blur-2xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                <div className="border-b border-white/10 p-6 flex items-center justify-between bg-white/5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center border border-emerald-500/30">
                      <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <h2 className="text-lg font-medium text-white">Access Granted</h2>
                      <p className="text-xs text-emerald-400 font-mono flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        SECURE CONNECTION ESTABLISHED
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-white/40 text-sm font-mono hidden sm:inline-block">USER: {currentUser.toUpperCase()}</span>
                    <button 
                      onClick={() => { setIsAuthenticated(false); setUsername(''); setPassword(''); }}
                      className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-mono border border-white/10 transition-colors"
                    >
                      DISCONNECT
                    </button>
                  </div>
                </div>

                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-6">
                    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-emerald-500/30 transition-colors group">
                      <h3 className="text-sm font-mono text-white/40 mb-2">PROJECT CODENAME</h3>
                      <p className="text-2xl font-light text-white group-hover:text-emerald-400 transition-colors">Project Chimera</p>
                    </div>
                    
                    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-emerald-500/30 transition-colors">
                      <h3 className="text-sm font-mono text-white/40 mb-4">SYSTEM STATUS</h3>
                      <div className="space-y-3">
                        {['Mainframe', 'Database', 'Proxy', 'Firewall'].map((item, i) => (
                          <div key={item} className="flex items-center justify-between text-sm">
                            <span className="text-white/70">{item}</span>
                            <span className="text-emerald-400 font-mono">ONLINE</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-900/20 to-black border border-white/10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-32 bg-emerald-500/10 blur-[80px] rounded-full pointer-events-none" />
                    <h3 className="text-sm font-mono text-emerald-400 mb-4">CLASSIFIED DATA</h3>
                    <p className="text-white/80 leading-relaxed font-light">
                      Welcome, Agent {currentUser}. Your credentials have been verified against our encrypted database using Bcrypt.
                    </p>
                    <div className="mt-8 p-4 bg-black/40 rounded-xl border border-white/5 font-mono text-xs text-white/50 overflow-x-auto">
                      <code>
                        $ initiating handshake...<br/>
                        $ verifying hash...<br/>
                        $ user: {currentUser}<br/>
                        $ access_token: generated<br/>
                        $ session_id: {Math.random().toString(36).substring(7)}
                      </code>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

