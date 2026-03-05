/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Gift, Loader2, KeyRound, Sparkles, ExternalLink, Settings, Eye, EyeOff, Trash2, Edit2, Check, X } from 'lucide-react';

// Components
const Typewriter = ({ text, speed = 50, className }: { text: string; speed?: number; className?: string }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (index < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText((prev) => prev + text.charAt(index));
        setIndex((prev) => prev + 1);
      }, speed);
      return () => clearTimeout(timeout);
    }
  }, [index, text, speed]);

  return <p className={className}>{displayedText}</p>;
};

// Types & Themes
interface Theme {
  id: string;
  name: string;
  bgClass: string;
  accentColor: string;
  particleColor: string;
}

const THEMES: Theme[] = [
  { id: 'default', name: 'Default Purple', bgClass: 'bg-[#1a0b2e]', accentColor: 'text-purple-400', particleColor: 'bg-yellow-200' },
  { id: 'pink', name: 'Romantic Pink', bgClass: 'bg-pink-900', accentColor: 'text-pink-400', particleColor: 'bg-pink-200' },
  { id: 'blue', name: 'Elegant Blue', bgClass: 'bg-blue-950', accentColor: 'text-blue-400', particleColor: 'bg-blue-200' },
  { id: 'dark', name: 'Mysterious Dark', bgClass: 'bg-black', accentColor: 'text-gray-400', particleColor: 'bg-white' },
];

interface User {
  username: string;
  password: string;
  giftLink: string;
  message?: string;
  themeId?: string;
}

export default function App() {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Login Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Gift State
  const [isBoxOpen, setIsBoxOpen] = useState(false);

  // Admin State
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [adminPin, setAdminPin] = useState('');
  const [showAdminPin, setShowAdminPin] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminMsg, setAdminMsg] = useState('');
  
  // Admin: Create/Edit User State
  const [editMode, setEditMode] = useState(false);
  const [editingUsername, setEditingUsername] = useState<string | null>(null);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newGiftLink, setNewGiftLink] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('default');

  // Data Persistence
  const [users, setUsers] = useState<User[]>([]);

  // Fetch users when admin is authenticated
  useEffect(() => {
    if (isAdminAuthenticated) {
      fetchUsers();
    }
  }, [isAdminAuthenticated]);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_secret: adminPin }),
      });
      const data = await res.json();
      if (data.success) {
        // Map API response to User interface
        const mappedUsers = data.users.map((u: any) => ({
          username: u.username,
          password: u.password, // This is plain_password from DB
          giftLink: u.gift_link,
          message: u.message,
          themeId: u.theme_id
        }));
        setUsers(mappedUsers);
      }
    } catch (err) {
      console.error('Failed to fetch users');
    }
  };

  // Derived State
  const currentTheme = currentUser ? THEMES.find(t => t.id === currentUser.themeId) || THEMES[0] : THEMES[0];

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
        setCurrentUser({
          username: data.username,
          password: '', // Don't need password here
          giftLink: data.gift_link,
          message: data.message,
          themeId: data.theme_id
        });
        setIsAuthenticated(true);
      } else {
        setError(data.message || 'Username atau password salah');
      }
    } catch (err) {
      setError('Koneksi error. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPin) return;
    
    try {
      const res = await fetch('/api/verify-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_secret: adminPin }),
      });
      
      if (res.ok) {
        setIsAdminAuthenticated(true);
        setAdminMsg('');
      } else {
        setAdminMsg('PIN Admin Salah!');
        setAdminPin('');
      }
    } catch (err) {
      setAdminMsg('Gagal verifikasi admin');
    }
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminMsg('');
    
    if (editMode && editingUsername) {
      // Edit existing user
      try {
        const res = await fetch('/api/admin/update-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            admin_secret: adminPin,
            original_username: editingUsername,
            username: newUsername,
            password: newPassword,
            gift_link: newGiftLink,
            message: newMessage,
            theme_id: selectedTheme
          }),
        });
        
        if (res.ok) {
          setAdminMsg(`User ${newUsername} berhasil diupdate!`);
          setEditMode(false);
          setEditingUsername(null);
          // Reset form
          setNewUsername('');
          setNewPassword('');
          setNewGiftLink('');
          setNewMessage('');
          setSelectedTheme('default');
          fetchUsers(); // Refresh list
        } else {
          setAdminMsg('Gagal update user');
        }
      } catch (err) {
        setAdminMsg('Error koneksi');
      }
    } else {
      // Create new user
      try {
        const res = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            username: newUsername, 
            password: newPassword, 
            gift_link: newGiftLink,
            admin_secret: adminPin,
            message: newMessage,
            theme_id: selectedTheme
          }),
        });
        const data = await res.json();
        if (res.ok) {
          setAdminMsg(`User ${newUsername} berhasil dibuat!`);
          // Reset form
          setNewUsername('');
          setNewPassword('');
          setNewGiftLink('');
          setNewMessage('');
          setSelectedTheme('default');
          fetchUsers(); // Refresh list
        } else {
          setAdminMsg('Error: ' + data.message);
        }
      } catch (err) {
        setAdminMsg('Gagal membuat user');
      }
    }
  };

  const handleDeleteUser = async (usernameToDelete: string) => {
    if (window.confirm(`Yakin ingin menghapus user ${usernameToDelete}?`)) {
      try {
        const res = await fetch('/api/admin/delete-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            admin_secret: adminPin,
            username: usernameToDelete
          }),
        });
        
        if (res.ok) {
          fetchUsers(); // Refresh list
        } else {
          alert('Gagal menghapus user');
        }
      } catch (err) {
        alert('Error koneksi');
      }
    }
  };

  const startEditUser = (user: User) => {
    setEditMode(true);
    setEditingUsername(user.username);
    setNewUsername(user.username);
    setNewPassword(user.password);
    setNewGiftLink(user.giftLink);
    setNewMessage(user.message || '');
    setSelectedTheme(user.themeId || 'default');
  };

  return (
    <div className={`min-h-screen ${currentTheme.bgClass} text-white font-sans overflow-hidden relative selection:bg-purple-500/30 transition-colors duration-500`}>
      {/* Magical Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_70%)]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 brightness-100 contrast-150" />
        {/* Floating particles */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className={`absolute w-1 h-1 ${currentTheme.particleColor} rounded-full`}
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
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-11 pr-10 text-white placeholder-white/30 focus:outline-none focus:border-purple-400 focus:bg-black/30 transition-all font-medium"
                          placeholder="Password Rahasia"
                        />
                        <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 group-focus-within:text-purple-400 transition-colors" />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors focus:outline-none"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
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
                         <div className="relative">
                           <input
                            type={showAdminPin ? "text" : "password"}
                            value={adminPin}
                            onChange={(e) => setAdminPin(e.target.value)}
                            className="w-full bg-black/40 border border-yellow-500/50 rounded-lg py-2 pl-3 pr-10 text-sm text-center tracking-widest focus:outline-none focus:border-yellow-400 transition-all"
                            placeholder="PIN"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => setShowAdminPin(!showAdminPin)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors focus:outline-none"
                          >
                            {showAdminPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                         </div>
                        <button type="submit" className="w-full bg-yellow-600/50 hover:bg-yellow-600 text-white font-bold py-2 rounded-lg text-sm transition-colors">
                          MASUK
                        </button>
                        {adminMsg && <div className="text-xs text-center text-red-300 bg-red-500/20 p-2 rounded">{adminMsg}</div>}
                      </form>
                    ) : (
                      /* 2. Admin Dashboard */
                      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
                        {/* Create/Edit Form */}
                        <form onSubmit={handleSaveUser} className="space-y-3 bg-black/20 p-3 rounded-lg border border-white/10">
                           <div className="flex justify-between items-center">
                             <p className="text-[10px] text-yellow-200/70 font-bold">{editMode ? 'EDIT USER' : 'BUAT USER BARU'}</p>
                             {editMode && (
                               <button type="button" onClick={() => { setEditMode(false); setEditingUsername(null); setNewUsername(''); setNewPassword(''); setNewGiftLink(''); setNewMessage(''); setSelectedTheme('default'); }} className="text-[10px] text-red-400 hover:text-red-300">Batal</button>
                             )}
                           </div>
                           
                           <input
                            type="text"
                            value={newUsername}
                            onChange={(e) => setNewUsername(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm"
                            placeholder="Username"
                            required
                          />
                          
                          <div className="relative">
                            <input
                              type={showPassword ? "text" : "password"}
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              className="w-full bg-black/40 border border-white/10 rounded-lg py-2 pl-3 pr-10 text-sm focus:outline-none focus:border-purple-400 transition-all"
                              placeholder="Password"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors focus:outline-none"
                            >
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>

                          <input
                            type="text"
                            value={newGiftLink}
                            onChange={(e) => setNewGiftLink(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm"
                            placeholder="Link Hadiah (URL)"
                            required
                          />

                          <textarea
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm h-20 resize-none"
                            placeholder="Pesan Spesial (Opsional)"
                          />

                          <select
                            value={selectedTheme}
                            onChange={(e) => setSelectedTheme(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/70"
                          >
                            {THEMES.map(theme => (
                              <option key={theme.id} value={theme.id}>{theme.name}</option>
                            ))}
                          </select>
                        
                          <button type="submit" className="w-full bg-yellow-600 text-black font-bold py-2 rounded-lg text-sm hover:bg-yellow-500 transition-colors">
                            {editMode ? 'SIMPAN PERUBAHAN' : 'BUAT HADIAH'}
                          </button>
                        </form>

                        {/* User List */}
                        <div className="space-y-2">
                          <p className="text-[10px] text-white/50 uppercase tracking-wider">Daftar User ({users.length})</p>
                          {users.map(user => (
                            <div key={user.username} className="flex items-center justify-between bg-white/5 p-2 rounded-lg border border-white/5 hover:bg-white/10 transition-colors">
                              <div className="flex flex-col">
                                <span className="text-sm font-medium text-white">{user.username}</span>
                                <span className="text-[10px] text-white/40">{user.giftLink.substring(0, 20)}...</span>
                              </div>
                              <div className="flex gap-2">
                                <button onClick={() => startEditUser(user)} className="p-1.5 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/40 transition-colors">
                                  <Edit2 className="w-3 h-3" />
                                </button>
                                <button onClick={() => handleDeleteUser(user.username)} className="p-1.5 bg-red-500/20 text-red-400 rounded hover:bg-red-500/40 transition-colors">
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                          {users.length === 0 && <p className="text-xs text-center text-white/30 py-2">Belum ada user.</p>}
                        </div>

                        {adminMsg && <div className="text-xs text-center text-white bg-green-500/20 p-2 rounded">{adminMsg}</div>}
                        
                        <div className="mt-4 pt-4 border-t border-white/10">
                          <button 
                            type="button"
                            onClick={async () => {
                              if(window.confirm('Jalankan perbaikan database? Ini akan menambahkan kolom yang hilang.')) {
                                try {
                                  const res = await fetch('/api/admin/migrate', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ admin_secret: adminPin }),
                                  });
                                  const data = await res.json();
                                  setAdminMsg(data.message + (data.columns ? ` (Cols: ${data.columns.join(', ')})` : ''));
                                } catch(e) {
                                  setAdminMsg('Gagal menjalankan migrasi');
                                }
                              }
                            }}
                            className="w-full text-[10px] text-yellow-500/50 hover:text-yellow-500 transition-colors flex items-center justify-center gap-1"
                          >
                            <Settings className="w-3 h-3" />
                            Fix Database Structure
                          </button>
                        </div>
                      </div>
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
              className="text-center w-full max-w-md relative z-20"
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
                  
                  {currentUser?.message && (
                    <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/10 text-left">
                      <Typewriter text={currentUser.message} speed={50} className="text-purple-200 font-mono text-sm leading-relaxed" />
                    </div>
                  )}
                  
                  <p className="text-white/60 text-sm mb-8">Kamu telah membuka hadiah spesial dari Admin.</p>
                  
                  <motion.a
                    href={currentUser?.giftLink.startsWith('http') ? currentUser.giftLink : `https://${currentUser?.giftLink}`}
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
                      setCurrentUser(null);
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

