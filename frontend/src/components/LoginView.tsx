import React, { useState } from 'react';
import {
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  User as UserIcon,
  Mail,
  UserPlus,
  LogIn,
} from 'lucide-react';
import { api } from '../api';
import { User } from '../types';

interface LoginViewProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Login form state
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const data = await api.login(loginUsername.trim(), loginPassword);
      onLoginSuccess(data.user);
    } catch (err: any) {
      setError(err.message || 'Gagal masuk. Periksa kembali username dan password Anda.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (regPassword !== regConfirmPassword) {
      setError('Konfirmasi password tidak cocok.');
      return;
    }

    if (regPassword.length < 6) {
      setError('Password minimal harus 6 karakter.');
      return;
    }

    setLoading(true);

    try {
      const data = await api.register({
        name: regName.trim(),
        username: regUsername.trim(),
        email: regEmail.trim(),
        password: regPassword,
      });
      onLoginSuccess(data.user);
    } catch (err: any) {
      setError(err.message || 'Gagal mendaftar akun baru.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFAF4] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Decorative background glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#FFE8E7] rounded-full blur-3xl opacity-70 pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#EBEBBF] rounded-full blur-3xl opacity-60 pointer-events-none" />
      <div className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 w-full max-w-2xl h-80 bg-[#C8DBE4]/30 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand header */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <img
              src="/logo-solana.png"
              alt="Solana Logo"
              className="h-24 w-auto object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Solana</h1>
          <p className="text-slate-500 text-xs mt-1">
            Personal workspace for courses, schedules, and focus.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-7 shadow-lg shadow-slate-200/50 border border-[#FFE8E7]">
          {/* Mode Switcher Tabs */}
          <div className="flex items-center p-1 bg-[#FFFAF4] rounded-2xl border border-[#FFE8E7] mb-6">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-xl transition-all ${
                mode === 'login'
                  ? 'bg-white text-[#9c4146] shadow-xs'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Masuk (Sign In)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError(null);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-xl transition-all ${
                mode === 'register'
                  ? 'bg-white text-[#9c4146] shadow-xs'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Daftar Akun</span>
            </button>
          </div>

          <div className="mb-5">
            <h2 className="text-base font-bold text-slate-800">
              {mode === 'login' ? 'Masuk ke Akun Anda' : 'Buat Akun Baru'}
            </h2>
            <p className="text-xs text-slate-400">
              {mode === 'login'
                ? 'Gunakan username dan password untuk mengakses workspace'
                : 'Daftar untuk mulai mengelola jadwal, tugas, dan sesi belajar'}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* LOGIN FORM */}
          {mode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    placeholder="Masukkan username..."
                    required
                    autoFocus
                    className="w-full pl-10 pr-4 py-2.5 text-xs bg-[#FFFAF4] border border-[#FFE8E7] focus:border-[#EFA0A3] focus:bg-white rounded-xl outline-none transition-all placeholder:text-slate-400 text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Masukkan password..."
                    required
                    className="w-full pl-10 pr-10 py-2.5 text-xs bg-[#FFFAF4] border border-[#FFE8E7] focus:border-[#EFA0A3] focus:bg-white rounded-xl outline-none transition-all placeholder:text-slate-400 text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#EFA0A3] hover:bg-[#e68d90] active:scale-[0.98] text-white text-xs font-semibold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <span>Memverifikasi...</span>
                ) : (
                  <>
                    <span>Masuk ke Solana</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <p className="text-xs text-slate-400">
                  Belum memiliki akun?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('register');
                      setError(null);
                    }}
                    className="text-[#9c4146] font-semibold hover:underline cursor-pointer"
                  >
                    Daftar sekarang
                  </button>
                </p>
              </div>
            </form>
          ) : (
            /* REGISTER FORM */
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Nama Lengkap
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Masukkan nama lengkap..."
                    required
                    className="w-full pl-10 pr-4 py-2 text-xs bg-[#FFFAF4] border border-[#FFE8E7] focus:border-[#EFA0A3] focus:bg-white rounded-xl outline-none transition-all placeholder:text-slate-400 text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <span className="text-xs font-bold text-slate-400">@</span>
                  </div>
                  <input
                    type="text"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                    placeholder="username (tanpa spasi)"
                    required
                    className="w-full pl-10 pr-4 py-2 text-xs bg-[#FFFAF4] border border-[#FFE8E7] focus:border-[#EFA0A3] focus:bg-white rounded-xl outline-none transition-all placeholder:text-slate-400 text-slate-800 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="nama@email.com"
                    required
                    className="w-full pl-10 pr-4 py-2 text-xs bg-[#FFFAF4] border border-[#FFE8E7] focus:border-[#EFA0A3] focus:bg-white rounded-xl outline-none transition-all placeholder:text-slate-400 text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Password (min. 6 karakter)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Buat password..."
                    required
                    minLength={6}
                    className="w-full pl-10 pr-10 py-2 text-xs bg-[#FFFAF4] border border-[#FFE8E7] focus:border-[#EFA0A3] focus:bg-white rounded-xl outline-none transition-all placeholder:text-slate-400 text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Konfirmasi Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="Ulangi password..."
                    required
                    className="w-full pl-10 pr-4 py-2 text-xs bg-[#FFFAF4] border border-[#FFE8E7] focus:border-[#EFA0A3] focus:bg-white rounded-xl outline-none transition-all placeholder:text-slate-400 text-slate-800"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#EFA0A3] hover:bg-[#e68d90] active:scale-[0.98] text-white text-xs font-semibold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <span>Mendaftarkan...</span>
                ) : (
                  <>
                    <span>Daftar Akun Baru</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <p className="text-xs text-slate-400">
                  Sudah memiliki akun?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setError(null);
                    }}
                    className="text-[#9c4146] font-semibold hover:underline"
                  >
                    Masuk di sini
                  </button>
                </p>
              </div>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Solana • Personal Workspace
        </p>
      </div>
    </div>
  );
};
