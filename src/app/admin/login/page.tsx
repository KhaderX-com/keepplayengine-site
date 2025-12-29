"use client";

import { signIn } from "next-auth/react";
import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { isWebAuthnSupported, isPlatformAuthenticatorAvailable } from "@/lib/webauthn-client";

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [passwordVerified, setPasswordVerified] = useState(false); // Track password step
  const [hasCredentials, setHasCredentials] = useState(false); // User has enrolled biometric
  const [biometricConfig, setBiometricConfig] = useState<{
    biometricEnabled: boolean;
    allowEnrollment: boolean;
    notes?: string;
  } | null>(null);
  const [configLoading, setConfigLoading] = useState(true);

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
      } catch (err) {
        console.error("Failed to load biometric config:", err);
      } finally {
        setConfigLoading(false);
      }
    };
    checkBiometric();
    loadConfig();
  }, []);

  // Handle biometric enrollment for first-time users
  const handleBiometricEnroll = async () => {
    setBiometricLoading(true);
    setError("");

    try {
      // Get registration options
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

      // Convert arrays back to Uint8Arrays
      const publicKeyOptions = {
        ...options,
        challenge: new Uint8Array(options.challenge),
        user: {
          ...options.user,
          id: new Uint8Array(options.user.id),
        },
        excludeCredentials: options.excludeCredentials?.map((cred: { id: number[]; type: string }) => ({
          ...cred,
          id: new Uint8Array(cred.id),
        })),
      };

      // Trigger biometric enrollment
      const credential = await navigator.credentials.create({
        publicKey: publicKeyOptions,
      });

      if (!credential) {
        throw new Error("Enrollment cancelled");
      }

      // Prepare credential for verification
      const publicKeyCredential = credential as PublicKeyCredential;
      const response = publicKeyCredential.response as AuthenticatorAttestationResponse;

      const credentialData = {
        id: publicKeyCredential.id,
        rawId: Array.from(new Uint8Array(publicKeyCredential.rawId)),
        type: publicKeyCredential.type,
        response: {
          clientDataJSON: Array.from(new Uint8Array(response.clientDataJSON)),
          attestationObject: Array.from(new Uint8Array(response.attestationObject)),
        },
      };

      // Verify and save the credential
      const verifyRes = await fetch("/api/webauthn/register/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          credential: credentialData,
          deviceName: navigator.userAgent.includes("Mobile") ? "Mobile Device" : "Desktop Browser"
        }),
      });

      if (!verifyRes.ok) {
        const data = await verifyRes.json();
        throw new Error(data.error || "Enrollment verification failed");
      }

      // Success - enrollment complete, now do biometric auth
      console.log("Biometric enrolled! Now verifying...");
      setHasCredentials(true);
      setBiometricLoading(false);

      // Automatically trigger biometric auth after enrollment
      setTimeout(() => handleBiometricAuth(), 500);
    } catch (err) {
      const error = err as Error;
      console.error("Biometric enrollment error:", error);
      setError(error.message || "Biometric enrollment failed");
      setBiometricLoading(false);
    }
  };

  const handleBiometricAuth = async () => {
    setBiometricLoading(true);
    setError("");

    try {
      // Get authentication options
      const optionsRes = await fetch("/api/webauthn/authenticate/options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!optionsRes.ok) {
        const data = await optionsRes.json();
        // If user has no credentials, update state and show enrollment option
        if (data.error && (data.error.includes("No credentials") || data.error.includes("No biometric"))) {
          setHasCredentials(false);
          setError("You haven't set up biometric authentication yet. Please click 'Set Up Biometric' below to enroll your device.");
          setBiometricLoading(false);
          return;
        }
        throw new Error(data.error || "Failed to get authentication options");
      }

      const { options } = await optionsRes.json();

      // Convert arrays back to Uint8Arrays
      const publicKeyOptions = {
        ...options,
        challenge: new Uint8Array(options.challenge),
        allowCredentials: options.allowCredentials?.map((cred: { id: number[]; type: string; transports?: string[] }) => ({
          ...cred,
          id: new Uint8Array(cred.id),
        })),
      };

      // Trigger biometric authentication
      const credential = await navigator.credentials.get({
        publicKey: publicKeyOptions,
      });

      if (!credential) {
        throw new Error("Authentication cancelled");
      }

      // Prepare credential for verification
      const publicKeyCredential = credential as PublicKeyCredential;
      const response = publicKeyCredential.response as AuthenticatorAssertionResponse;

      const credentialData = {
        id: publicKeyCredential.id,
        rawId: Array.from(new Uint8Array(publicKeyCredential.rawId)),
        type: publicKeyCredential.type,
        response: {
          clientDataJSON: Array.from(new Uint8Array(response.clientDataJSON)),
          authenticatorData: Array.from(new Uint8Array(response.authenticatorData)),
          signature: Array.from(new Uint8Array(response.signature)),
          userHandle: response.userHandle
            ? Array.from(new Uint8Array(response.userHandle))
            : null,
        },
      };

      // Verify authentication
      const verifyRes = await fetch("/api/webauthn/authenticate/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: credentialData }),
      });

      if (!verifyRes.ok) {
        const data = await verifyRes.json();
        throw new Error(data.error || "Authentication failed");
      }

      // Success - now complete the login by creating session
      console.log("Biometric verified! Creating session...");

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.ok) {
        setTimeout(() => {
          router.push("/admin");
          router.refresh();
        }, 100);
      } else {
        throw new Error("Session creation failed");
      }
    } catch (err) {
      const error = err as Error;
      console.error("Biometric auth error:", error);
      setError(error.message || "Biometric authentication failed");
      setBiometricLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      console.log("Step 1: Verifying credentials..."); // Debug log

      // First, just verify credentials without creating session
      const verifyRes = await fetch("/api/auth/verify-credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      console.log("Verify response status:", verifyRes.status); // Debug

      if (!verifyRes.ok) {
        const data = await verifyRes.json();
        console.error("Verify failed:", data); // Debug
        setError(data.error || "Invalid credentials");
        setLoading(false);
        return;
      }

      const verifyData = await verifyRes.json();
      console.log("Verify data:", verifyData); // Debug
      const { valid } = verifyData;

      if (!valid) {
        setError("Invalid email or password");
        setLoading(false);
        return;
      }

      console.log("Password verified!"); // Debug log

      // Check if user has biometric enrolled
      const checkRes = await fetch("/api/webauthn/check-enrollment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      console.log("Check enrollment status:", checkRes.status); // Debug

      // Get the response text first to debug
      const checkText = await checkRes.text();
      console.log("Check enrollment raw response:", checkText.substring(0, 200)); // Debug

      let checkData;
      try {
        checkData = JSON.parse(checkText);
        console.log("Enrollment data:", checkData); // Debug
      } catch (parseError) {
        console.error("Failed to parse enrollment response as JSON:", parseError);
        setError("Server error during biometric check");
        setLoading(false);
        return;
      }

      const { enrolled } = checkData;

      // ALWAYS require biometric after password verification
      console.log("Password verified. Moving to biometric step...");
      console.log("Has credentials enrolled:", enrolled);
      console.log("Biometric config:", biometricConfig);
      setPasswordVerified(true);
      setHasCredentials(enrolled);
      setLoading(false);
      setError("");
      // STOP HERE - don't create session until biometric is verified
    } catch (err) {
      const error = err as Error;
      console.error("Caught error in handleSubmit:", error); // Debug log
      console.error("Error stack:", error.stack); // Debug stack trace
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Admin Access</h2>
          <p className="mt-2 text-sm text-gray-600">
            KeepPlay Engine Administrative Panel
          </p>
          <div className="mt-4 flex items-center justify-center space-x-2">
            <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-700 border border-red-200">
              <svg
                className="w-3 h-3 mr-1.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                  clipRule="evenodd"
                />
              </svg>
              Restricted Area
            </span>
            <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-green-50 text-green-700 border border-green-200">
              <span className="w-2 h-2 bg-green-600 rounded-full mr-1.5 animate-pulse"></span>
              Secure Connection
            </span>
          </div>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex">
                <svg
                  className="w-5 h-5 text-red-600 mr-3 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Step 1: Password Authentication */}
          {!passwordVerified && (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
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
                  className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                  placeholder="admin@keepplayengine.com"
                  disabled={loading}
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
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
                  className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                  placeholder="••••••••"
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Verifying...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                      />
                    </svg>
                    Continue with Password
                  </>
                )}
              </button>
            </form>
          )}

          {/* Step 2: Biometric Verification (replaces password form) */}
          {passwordVerified && biometricAvailable && biometricConfig?.biometricEnabled && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Biometric Verification
                </h3>
                <p className="text-sm text-gray-600">
                  Complete authentication with your fingerprint, Face ID, or device PIN
                </p>
              </div>

              {/* DEBUG INFO - Remove in production */}
              <div className="text-xs text-gray-400 bg-gray-50 p-2 rounded">
                Debug: hasCredentials={String(hasCredentials)}, allowEnrollment={String(biometricConfig?.allowEnrollment)}
              </div>

              {/* Show enrollment button FIRST if user has no credentials and enrollment is allowed */}
              {!hasCredentials && biometricConfig?.allowEnrollment && (
                <>
                  <button
                    type="button"
                    onClick={handleBiometricEnroll}
                    disabled={biometricLoading}
                    className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {biometricLoading ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Setting up...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Set Up Biometric (First Time)
                      </>
                    )}
                  </button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">Already enrolled?</span>
                    </div>
                  </div>
                </>
              )}

              {/* Authenticate button */}
              <button
                type="button"
                onClick={handleBiometricAuth}
                disabled={biometricLoading}
                className={`w-full flex justify-center items-center py-3 px-4 border rounded-lg shadow-sm text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all ${hasCredentials
                    ? "border-transparent text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-600"
                    : "border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-blue-600"
                  }`}
              >
                {biometricLoading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Verifying...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"
                      />
                    </svg>
                    Authenticate with Biometric
                  </>
                )}
              </button>

              {/* Show message if no credentials and enrollment is not allowed */}
              {!hasCredentials && !biometricConfig?.allowEnrollment && (
                <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-xs text-yellow-700 text-center">
                    New biometric enrollment is currently restricted. Please contact your administrator.
                  </p>
                </div>
              )}

              <div className="flex items-center justify-center pt-4">
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  <span>Your biometric data never leaves this device</span>
                </div>
              </div>
            </div>
          )}

          {/* Biometric layer disabled */}
          {passwordVerified && (!biometricConfig?.biometricEnabled || configLoading) && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-4">
                  <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Biometric Authentication Unavailable
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  Biometric authentication is currently disabled by your administrator. Please contact support.
                </p>
                {biometricConfig?.notes && (
                  <p className="text-xs text-gray-500 italic mb-6">
                    Note: {biometricConfig.notes}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  setPasswordVerified(false);
                  setError("");
                }}
                className="w-full flex justify-center items-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition-all"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Go Back
              </button>
            </div>
          )}

          {/* No biometric available error */}
          {passwordVerified && biometricConfig?.biometricEnabled && !biometricAvailable && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Biometric Required
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  This device does not support biometric authentication. Please use a device with fingerprint, Face ID, or Windows Hello to complete login.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setPasswordVerified(false);
                  setError("");
                }}
                className="w-full flex justify-center items-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition-all"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Go Back
              </button>
            </div>
          )}
        </div>

        {/* Security Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6">
          <div className="text-xs text-gray-600 space-y-2.5">
            <p className="flex items-center">
              <svg
                className="w-4 h-4 text-green-600 mr-2 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Rate limiting active (5 attempts per 15 min)
            </p>
            <p className="flex items-center">
              <svg
                className="w-4 h-4 text-green-600 mr-2 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Session expires after 2 hours of activity
            </p>
            <p className="flex items-center">
              <svg
                className="w-4 h-4 text-green-600 mr-2 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              All access attempts are logged and monitored
            </p>
            {biometricAvailable && (
              <p className="flex items-center">
                <svg
                  className="w-4 h-4 text-green-600 mr-2 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Biometric authentication available
              </p>
            )}
          </div>
        </div>

        {/* Footer Warning */}
        <div className="text-center text-xs text-gray-600">
          <p className="flex items-center justify-center">
            <svg
              className="w-4 h-4 text-yellow-600 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            Unauthorized access attempts will be reported to authorities
          </p>
        </div>
      </div>
    </div>
  );
}
