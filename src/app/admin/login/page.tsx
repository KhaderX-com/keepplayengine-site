"use client";

import { signIn, useSession } from "next-auth/react";
import { useState, FormEvent, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { isWebAuthnSupported, isPlatformAuthenticatorAvailable } from "@/lib/webauthn-client";
import { startRegistration, startAuthentication } from "@simplewebauthn/browser";
import dynamic from "next/dynamic";

const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

const LOTTIE_URL =
  "https://res.cloudinary.com/destej60y/raw/upload/v1774195040/Sign_In_acr2rl.json";

const LOADING_LOTTIE_URL =
  "https://res.cloudinary.com/destej60y/raw/upload/v1774196263/loading_1_oz5vqq.json";

const FINGERPRINT_LOTTIE_URL =
  "https://res.cloudinary.com/destej60y/raw/upload/v1774196940/Fingerprint_Icon_Animation-black_thzacw.json";

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();

  // Get return URL from query params, sanitized to prevent open redirects (C-04)
  const returnUrl = (() => {
    const raw = searchParams.get('returnUrl');
    if (!raw) return '/admin';
    if (raw.startsWith('//')) return '/admin';
    if (raw.includes('://') || raw.includes(':')) return '/admin';
    if (!raw.startsWith('/admin')) return '/admin';
    if (raw.includes('%') || raw.includes('\\')) return '/admin';
    return raw;
  })();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [passwordVerified, setPasswordVerified] = useState(false);
  const [hasCredentials, setHasCredentials] = useState(false);
  const [biometricConfig, setBiometricConfig] = useState<{
    biometricEnabled: boolean;
    allowEnrollment: boolean;
    notes?: string;
  } | null>(null);
  const [configLoading, setConfigLoading] = useState(true);

  // 4th Security Layer: Vault PIN
  const [biometricVerified, setBiometricVerified] = useState(false);
  const [vaultPin, setVaultPin] = useState(["", "", "", "", "", ""]);
  const [pinLoading, setPinLoading] = useState(false);
  const [pinLocked, setPinLocked] = useState(false);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);
  const pinInputRefs = useRef<(HTMLInputElement | null)[]>([null, null, null, null, null, null]);

  // Lottie animation data
  const [animationData, setAnimationData] = useState<object | null>(null);
  const [loadingAnimationData, setLoadingAnimationData] = useState<object | null>(null);
  const [fingerprintAnimationData, setFingerprintAnimationData] = useState<object | null>(null);
  const [transitionLoading, setTransitionLoading] = useState(false);

  // Load Lottie animations
  useEffect(() => {
    fetch(LOTTIE_URL)
      .then((r) => r.json())
      .then((data) => setAnimationData(data))
      .catch(() => {});
    fetch(LOADING_LOTTIE_URL)
      .then((r) => r.json())
      .then((data) => setLoadingAnimationData(data))
      .catch(() => {});
    fetch(FINGERPRINT_LOTTIE_URL)
      .then((r) => r.json())
      .then((data) => setFingerprintAnimationData(data))
      .catch(() => {});
  }, []);

  // Redirect authenticated users away from login page
  useEffect(() => {
    if (status === "authenticated") {
      router.replace(returnUrl);
      const timeoutId = setTimeout(() => {
        window.location.href = returnUrl;
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [status, router, returnUrl]);

  // Check biometric availability and config on mount
  useEffect(() => {
    const checkBiometric = async () => {
      if (isWebAuthnSupported()) {
        const available = await isPlatformAuthenticatorAvailable();
        setBiometricAvailable(available);
      }
    };
    const loadConfig = async () => {
      try {
        const res = await fetch("/api/webauthn/config");
        if (res.ok) {
          const data = await res.json();
          setBiometricConfig(data);
        }
      } finally {
        setConfigLoading(false);
      }
    };
    checkBiometric();
    loadConfig();
  }, []);

  // Lockout countdown effect
  useEffect(() => {
    if (lockoutRemaining > 0) {
      const timer = setInterval(() => {
        setLockoutRemaining((prev) => {
          if (prev <= 1) {
            setPinLocked(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [lockoutRemaining]);

  // Focus first PIN input when PIN step becomes active
  useEffect(() => {
    if (biometricVerified && pinInputRefs.current[0]) {
      setTimeout(() => pinInputRefs.current[0]?.focus(), 100);
    }
  }, [biometricVerified]);

  // Handle PIN input change
  const handlePinChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    if (value && !/^\d$/.test(value)) return;

    const newPin = [...vaultPin];
    newPin[index] = value;
    setVaultPin(newPin);
    setError("");

    if (value && index < 5) {
      pinInputRefs.current[index + 1]?.focus();
    }

    if (value && index === 5 && newPin.every((d) => d !== "")) {
      handleVaultPinSubmit(newPin.join(""));
    }
  };

  // Handle PIN keydown for backspace navigation
  const handlePinKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !vaultPin[index] && index > 0) {
      pinInputRefs.current[index - 1]?.focus();
    }
  };

  // Handle vault PIN verification
  const handleVaultPinSubmit = async (pin: string) => {
    setPinLoading(true);
    setError("");

    try {
      const verifyRes = await fetch("/api/auth/verify-vault-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });

      const data = await verifyRes.json();

      if (data.locked) {
        setPinLocked(true);
        setLockoutRemaining(data.remainingSeconds || 300);
        setVaultPin(["", "", "", "", "", ""]);
        setError(data.error || "Too many attempts. Please wait.");
        setPinLoading(false);
        return;
      }

      if (!verifyRes.ok || !data.valid) {
        setVaultPin(["", "", "", "", "", ""]);
        setError(data.error || "Invalid vault PIN");
        setPinLoading(false);
        pinInputRefs.current[0]?.focus();
        return;
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.ok) {
        setTimeout(() => {
          router.push(returnUrl);
          router.refresh();
        }, 100);
      } else {
        throw new Error("Session creation failed");
      }
    } catch (err) {
      const error = err as Error;
      setError(error.message || "Verification failed");
      setVaultPin(["", "", "", "", "", ""]);
      setPinLoading(false);
    }
  };

  // Handle biometric enrollment for first-time users
  const handleBiometricEnroll = async () => {
    setBiometricLoading(true);
    setError("");

    try {
      const optionsRes = await fetch("/api/webauthn/register/options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!optionsRes.ok) {
        const data = await optionsRes.json();
        throw new Error(data.error || "Failed to get registration options");
      }

      const { options } = await optionsRes.json();
      const credential = await startRegistration({ optionsJSON: options });

      const verifyRes = await fetch("/api/webauthn/register/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          credential,
          deviceName: navigator.userAgent.includes("Mobile") ? "Mobile Device" : "Desktop Browser",
        }),
      });

      if (!verifyRes.ok) {
        const data = await verifyRes.json();
        throw new Error(data.error || "Enrollment verification failed");
      }

      setHasCredentials(true);
      setBiometricLoading(false);
      setTimeout(() => handleBiometricAuth(), 500);
    } catch (err) {
      const error = err as Error;
      setError(error.message || "Biometric enrollment failed");
      setBiometricLoading(false);
    }
  };

  const handleBiometricAuth = async () => {
    setBiometricLoading(true);
    setError("");

    try {
      const optionsRes = await fetch("/api/webauthn/authenticate/options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!optionsRes.ok) {
        const data = await optionsRes.json();
        if (data.error && (data.error.includes("No credentials") || data.error.includes("No biometric"))) {
          setHasCredentials(false);
          setError("You haven't set up biometric authentication yet. Please click 'Set Up Biometric' below to enroll your device.");
          setBiometricLoading(false);
          return;
        }
        throw new Error(data.error || "Failed to get authentication options");
      }

      const { options } = await optionsRes.json();
      const credential = await startAuthentication({ optionsJSON: options });

      const verifyRes = await fetch("/api/webauthn/authenticate/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential, email }),
      });

      if (!verifyRes.ok) {
        const data = await verifyRes.json();
        throw new Error(data.error || "Authentication failed");
      }

      setBiometricVerified(true);
      setBiometricLoading(false);
      setError("");
    } catch (err) {
      const error = err as Error;
      setError(error.message || "Biometric authentication failed");
      setBiometricLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setTransitionLoading(true);

    try {
      const verifyRes = await fetch("/api/auth/verify-credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!verifyRes.ok) {
        const data = await verifyRes.json();
        setTransitionLoading(false);
        setError(data.error || "Invalid credentials");
        setLoading(false);
        return;
      }

      const verifyData = await verifyRes.json();
      const { valid } = verifyData;

      if (!valid) {
        setTransitionLoading(false);
        setError("Invalid email or password");
        setLoading(false);
        return;
      }

      const checkRes = await fetch("/api/webauthn/check-enrollment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const checkText = await checkRes.text();

      let checkData;
      try {
        checkData = JSON.parse(checkText);
      } catch {
        setTransitionLoading(false);
        setError("Server error during biometric check");
        setLoading(false);
        return;
      }

      const { enrolled } = checkData;

      setHasCredentials(enrolled);
      setLoading(false);
      setError("");
      // Show transition loading animation before revealing the biometric step
      setTransitionLoading(true);
      setTimeout(() => {
        setTransitionLoading(false);
        setPasswordVerified(true);
      }, 1800);
    } catch {
      setTransitionLoading(false);
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  // ─── Shared style helpers ───────────────────────────────────────────────────
  const pillBtn =
    "w-full flex justify-center items-center gap-2 py-3.5 px-6 rounded-full bg-black text-white text-sm font-semibold hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-40 disabled:cursor-not-allowed transition-all";
  const pillBtnOutline =
    "w-full flex justify-center items-center gap-2 py-3.5 px-6 rounded-full border-2 border-black bg-white text-black text-sm font-semibold hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-40 disabled:cursor-not-allowed transition-all";
  const inputClass =
    "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all text-sm";

  // ─── Loading / redirect states ──────────────────────────────────────────────
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-7 h-7 border-2 border-black border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Checking authentication…</p>
        </div>
      </div>
    );
  }

  if (status === "authenticated") {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-sm text-gray-400">Redirecting…</p>
        </div>
      </div>
    );
  }

  // ─── Main render ─────────────────────────────────────────────────────────────

  // Full-screen loading overlay (shown immediately on Verify click)
  if (transitionLoading) {
    return (
      <div className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center gap-3">
        {loadingAnimationData ? (
          <Lottie
            animationData={loadingAnimationData}
            loop
            autoplay
            style={{ width: 260, height: 260 }}
          />
        ) : (
          <div className="w-12 h-12 border-3 border-black border-t-transparent rounded-full animate-spin" />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-gray-50 to-white flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">

        {/* ── Header ── */}
        <div className="text-center mb-8">
          <div className="flex justify-center">
            {animationData ? (
              <Lottie
                animationData={animationData}
                loop
                autoplay
                style={{ width: 180, height: 180 }}
              />
            ) : (
              <div className="w-20 h-20 bg-black rounded-3xl flex items-center justify-center mb-4">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
            )}
          </div>
          <h1 className="text-4xl text-gray-900 mb-1 -mt-2 font-(family-name:--font-lilita-one) font-normal">
            Admin Panel
          </h1>
          <p className="text-sm text-gray-400">Secure administrative access</p>
        </div>

        {/* ── Card ── */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-7">

          {/* Error banner */}
          {error && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 rounded-2xl px-4 py-3 mb-5">
              <svg className="w-4 h-4 text-red-500 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-xs text-red-600 leading-relaxed">{error}</p>
            </div>
          )}

          {/* ── Step 1: Credentials ── */}
          {!passwordVerified && (
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                  placeholder="••••••••"
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                  placeholder="••••••••"
                  disabled={loading}
                />
              </div>

              <button type="submit" disabled={loading} className={pillBtn}>
                {loading ? (
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : "Verify"}
              </button>
            </form>
          )}

          {/* ── Step 2: Biometric Verification ── */}
          {passwordVerified && !biometricVerified && biometricAvailable && biometricConfig?.biometricEnabled && (
            <div className="space-y-5">
              <div className="text-center pb-1">
                <div className="flex justify-center">
                  {fingerprintAnimationData ? (
                    <Lottie
                      animationData={fingerprintAnimationData}
                      loop
                      autoplay
                      style={{ width: 120, height: 120 }}
                    />
                  ) : (
                    <div className="inline-flex items-center justify-center w-14 h-14 bg-gray-100 rounded-2xl mb-3">
                      <svg className="w-7 h-7 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                          d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                      </svg>
                    </div>
                  )}
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-1">Biometric Verification</h3>
                <p className="text-xs text-gray-400">Use fingerprint, Face ID, or device PIN</p>
              </div>

              {/* Enroll first-time */}
              {!hasCredentials && biometricConfig?.allowEnrollment && (
                <>
                  <button type="button" onClick={handleBiometricEnroll} disabled={biometricLoading} className={pillBtn}>
                    {biometricLoading ? (
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    ) : "Set Up Biometric"}
                  </button>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-xs text-gray-400">Already enrolled?</span>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>
                </>
              )}

              {/* Authenticate */}
              <button
                type="button"
                onClick={handleBiometricAuth}
                disabled={biometricLoading}
                className={pillBtn}
              >
                {biometricLoading ? (
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : "Authenticate"}
              </button>

              {/* Add another device */}
              {hasCredentials && biometricConfig?.allowEnrollment && (
                <>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-xs text-gray-400">or</span>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>
                  <button type="button" onClick={handleBiometricEnroll} disabled={biometricLoading} className={pillBtnOutline}>
                    Add Another Device
                  </button>
                </>
              )}

            </div>
          )}

          {/* ── Step 3: Vault PIN ── */}
          {biometricVerified && (
            <div className="space-y-5">
              <div className="text-center pb-1">
                <h3 className="text-base font-semibold text-gray-900 mb-1">Vault Access</h3>
                <p className="text-xs text-gray-400">Enter your secure vault PIN to complete access</p>
              </div>

              {/* Progress indicator */}
              <div className="flex items-center justify-center gap-1">
                {(["CF", "Auth", "Bio", "PIN"] as const).map((label, i) => (
                  <div key={label} className="flex items-center">
                    <div className="flex flex-col items-center gap-0.5">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${i < 3 ? "bg-black" : "bg-black animate-pulse"}`}>
                        {i < 3 ? (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <span className="text-white text-[10px] font-bold">4</span>
                        )}
                      </div>
                      <span className={`text-[10px] ${i === 3 ? "text-black font-semibold" : "text-gray-400"}`}>{label}</span>
                    </div>
                    {i < 3 && <div className="w-4 h-px bg-gray-300 mx-1 mb-3" />}
                  </div>
                ))}
              </div>

              {/* PIN inputs */}
              <div className="flex justify-center gap-1.5 sm:gap-2 px-2 sm:px-0" role="group" aria-label="Vault PIN input">
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <input
                    key={index}
                    ref={(el) => { pinInputRefs.current[index] = el; }}
                    type="password"
                    inputMode="numeric"
                    maxLength={1}
                    value={vaultPin[index]}
                    onChange={(e) => handlePinChange(index, e.target.value)}
                    onKeyDown={(e) => handlePinKeyDown(index, e)}
                    disabled={pinLoading || pinLocked}
                    className="w-9 h-10 sm:w-11 sm:h-12 text-center text-lg sm:text-xl font-bold border-2 border-gray-200 rounded-xl sm:rounded-2xl bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-black disabled:opacity-40 transition-all"
                    autoComplete="off"
                    aria-label={`PIN digit ${index + 1}`}
                    title={`PIN digit ${index + 1}`}
                  />
                ))}
              </div>

              {/* Lockout */}
              {pinLocked && lockoutRemaining > 0 && (
                <div className="bg-red-50 border border-red-100 rounded-2xl p-3 text-center">
                  <span className="text-sm text-red-600 font-medium">
                    Locked: {Math.floor(lockoutRemaining / 60)}:{(lockoutRemaining % 60).toString().padStart(2, "0")}
                  </span>
                </div>
              )}

              {/* Loading */}
              {pinLoading && (
                <div className="flex justify-center">
                  <svg className="animate-spin h-6 w-6 text-black" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </div>
              )}

              <div className="flex items-center justify-center gap-2 pt-1">
                <svg className="w-3.5 h-3.5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-xs text-gray-400">Bank-grade vault protection · 3 attempts max</span>
              </div>
            </div>
          )}

          {/* ── Biometric layer disabled ── */}
          {passwordVerified && !biometricVerified && (!biometricConfig?.biometricEnabled || configLoading) && (
            <div className="space-y-5">
              <div className="text-center pb-1">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-yellow-50 rounded-2xl mb-3">
                  <svg className="w-7 h-7 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-1">Biometric Unavailable</h3>
                <p className="text-xs text-gray-400 mb-1">Biometric authentication is currently disabled by your administrator.</p>
                {biometricConfig?.notes && (
                  <p className="text-xs text-gray-400 italic">{biometricConfig.notes}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => { setPasswordVerified(false); setError(""); }}
                className={pillBtnOutline}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Go Back
              </button>
            </div>
          )}

          {/* ── Biometric required but device unsupported ── */}
          {passwordVerified && !biometricVerified && biometricConfig?.biometricEnabled && !biometricAvailable && (
            <div className="space-y-5">
              <div className="text-center pb-1">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-red-50 rounded-2xl mb-3">
                  <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-1">Biometric Required</h3>
                <p className="text-xs text-gray-400">
                  This device does not support biometric authentication. Please use a device with fingerprint, Face ID, or Windows Hello.
                </p>
              </div>
              <button
                type="button"
                onClick={() => { setPasswordVerified(false); setError(""); }}
                className={pillBtnOutline}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Go Back
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}


