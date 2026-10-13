import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { BrandLogo } from '../../components/BrandLogo';
import { Button } from '../../components/ui/Button';
import { Mail, KeyRound, ArrowRight, ShieldCheck, AlertCircle, CheckCircle } from 'lucide-react';

export const Login: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();

  const redirectUrl = searchParams.get('redirect') || '/player';

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [countdown, setCountdown] = useState(0);

  // If already logged in, redirect
  useEffect(() => {
    if (user) {
      navigate(redirectUrl);
    }
  }, [user, navigate, redirectUrl]);

  // Resend countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await api.auth.sendOtp(email.trim().toLowerCase());
      setSuccessMsg(res.message);
      setStep('otp');
      setCountdown(60); // 60s cooldown for resending
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to dispatch verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await api.auth.verifyOtp(email.trim().toLowerCase(), otp.trim());
      setSuccessMsg('Session verified successfully! Redirecting...');
      await refreshUser();
      setTimeout(() => {
        navigate(redirectUrl);
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Verification failed. Please check your code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-deepteal/50 border border-aroraborder rounded-2xl p-8 shadow-card relative overflow-hidden">
        {/* Glow Accent */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-neongreen/15 rounded-full blur-2xl pointer-events-none" />

        <div className="text-center mb-8 space-y-2">
          <BrandLogo size="md" className="justify-center" />
          <h1 className="font-heading text-2xl font-bold uppercase tracking-wider text-icewhite pt-3">
            {step === 'email' ? 'Player Authentication' : 'Enter 6-Digit Code'}
          </h1>
          <p className="text-xs text-subtext">
            {step === 'email'
              ? 'Passwordless sign-in. Enter your email to receive a secure one-time verification code.'
              : `A one-time code was dispatched to ${email}. Valid for 5 minutes.`}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-3 bg-red-950/60 border border-red-500/50 rounded-lg text-xs text-red-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-3 bg-emerald-950/60 border border-neongreen/50 rounded-lg text-xs text-neongreen flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-neongreen flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {step === 'email' ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-icewhite">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="player@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-midnight border border-aroraborder rounded-lg pl-10 pr-4 py-3 text-sm text-icewhite placeholder-subtext focus:outline-none focus:border-neongreen/60"
                />
                <Mail className="w-4 h-4 text-subtext absolute left-3.5 top-3.5" />
              </div>
            </div>

            <Button type="submit" loading={loading} className="w-full py-3">
              Send Verification Code
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-icewhite">
                6-Digit Verification Code
              </label>
              <div className="relative">
                <input
                  type="text"
                  maxLength={6}
                  required
                  autoFocus
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-midnight border border-aroraborder rounded-lg px-4 py-3 text-center text-2xl font-mono tracking-[0.5em] text-neongreen placeholder-gray-700 focus:outline-none focus:border-neongreen"
                />
              </div>
            </div>

            <Button type="submit" loading={loading} className="w-full py-3">
              Verify &amp; Enter Platform
            </Button>

            <div className="flex items-center justify-between text-xs pt-2">
              <button
                type="button"
                onClick={() => {
                  setStep('email');
                  setOtp('');
                }}
                className="text-subtext hover:text-icewhite"
              >
                Change Email
              </button>

              <button
                type="button"
                disabled={countdown > 0 || loading}
                onClick={handleSendOtp}
                className="text-cyan hover:text-neongreen disabled:text-subtext disabled:cursor-not-allowed font-medium"
              >
                {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}
              </button>
            </div>
          </form>
        )}

        <div className="mt-8 pt-6 border-t border-aroraborder/60 text-center">
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-subtext font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-neongreen" />
            <span>End-to-end encrypted session cookie security</span>
          </div>
        </div>
      </div>
    </div>
  );
};
