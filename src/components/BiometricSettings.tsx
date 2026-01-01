"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { isWebAuthnSupported, isPlatformAuthenticatorAvailable } from "@/lib/webauthn-client";

interface BiometricDevice {
    id: string;
    device_name: string;
    device_type: string;
    created_at: string;
    last_used_at: string;
}

interface BiometricConfig {
    biometricEnabled: boolean;
    allowEnrollment: boolean;
    notes?: string;
}

export default function BiometricSettings() {
    const { data: session } = useSession();
    const [devices, setDevices] = useState<BiometricDevice[]>([]);
    const [loading, setLoading] = useState(true);
    const [enrolling, setEnrolling] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [biometricAvailable, setBiometricAvailable] = useState(false);
    const [deviceName, setDeviceName] = useState("");
    const [config, setConfig] = useState<BiometricConfig>({
        biometricEnabled: false,
        allowEnrollment: false
    });
    const [configLoading, setConfigLoading] = useState(true);

    useEffect(() => {
        checkBiometricSupport();
        loadConfig();
        loadDevices();
    }, []);

    const checkBiometricSupport = async () => {
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
                setConfig(data);
            }
        } catch (err) {
            console.error("Failed to load config:", err);
        } finally {
            setConfigLoading(false);
        }
    };

    const loadDevices = async () => {
        try {
            const res = await fetch("/api/webauthn/devices");
            if (res.ok) {
                const data = await res.json();
                setDevices(data.devices || []);
            }
        } catch (err) {
            console.error("Failed to load devices:", err);
        } finally {
            setLoading(false);
        }
    };

    const enrollBiometric = async () => {
        setEnrolling(true);
        setError("");
        setSuccess("");

        try {
            // Get registration options
            const optionsRes = await fetch("/api/webauthn/register/options", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ deviceName }),
            });

            if (!optionsRes.ok) {
                const data = await optionsRes.json();
                throw new Error(data.error || "Failed to get registration options");
            }

            const { options } = await optionsRes.json();

            // Convert arrays to Uint8Arrays
            const publicKeyOptions = {
                ...options,
                challenge: new Uint8Array(options.challenge),
                user: {
                    ...options.user,
                    id: new Uint8Array(options.user.id),
                },
                excludeCredentials: options.excludeCredentials?.map((cred: { id: number[]; type: string; transports?: string[] }) => ({
                    ...cred,
                    id: new Uint8Array(cred.id),
                })),
            };

            // Create credential
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
                authenticatorAttachment: publicKeyCredential.authenticatorAttachment,
                response: {
                    clientDataJSON: Array.from(new Uint8Array(response.clientDataJSON)),
                    attestationObject: Array.from(new Uint8Array(response.attestationObject)),
                    getTransports: response.getTransports ? response.getTransports() : [],
                },
            };

            // Verify registration
            const verifyRes = await fetch("/api/webauthn/register/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    credential: credentialData,
                    deviceName: deviceName || "My Device",
                }),
            });

            if (!verifyRes.ok) {
                const data = await verifyRes.json();
                throw new Error(data.error || "Registration failed");
            }

            setSuccess("Biometric authentication enrolled successfully!");
            setDeviceName("");
            await loadDevices();
        } catch (err) {
            const error = err as Error;
            console.error("Enrollment error:", error);
            setError(error.message || "Failed to enroll biometric authentication");
        } finally {
            setEnrolling(false);
        }
    };

    const removeDevice = async (deviceId: string) => {
        if (!confirm("Are you sure you want to remove this device?")) {
            return;
        }

        try {
            const res = await fetch("/api/webauthn/devices", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ credentialId: deviceId }),
            });

            if (!res.ok) {
                throw new Error("Failed to remove device");
            }

            setSuccess("Device removed successfully");
            await loadDevices();
        } catch (err) {
            const error = err as Error;
            setError(error.message || "Failed to remove device");
        }
    };

    if (!session) {
        return null;
    }

    // If biometric layer is completely disabled, don't show anything
    if (!configLoading && !config.biometricEnabled) {
        return (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <div className="flex items-center space-x-3">
                    <svg className="h-8 w-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                        <h3 className="text-lg font-semibold text-yellow-900">Biometric Authentication Unavailable</h3>
                        <p className="text-sm text-yellow-700 mt-1">
                            Biometric authentication is currently disabled by your administrator.
                        </p>
                        {config.notes && (
                            <p className="text-xs text-yellow-600 mt-2 italic">Note: {config.notes}</p>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
                🔐 Biometric Authentication (3rd Security Layer)
            </h2>

            {/* Status Messages */}
            {error && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm text-red-700">{error}</p>
                </div>
            )}
            {success && (
                <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm text-green-700">{success}</p>
                </div>
            )}

            {/* Configuration Loading */}
            {configLoading && (
                <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-700">Loading biometric configuration...</p>
                </div>
            )}

            {/* Availability Check */}
            {!biometricAvailable && !configLoading && (
                <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-700">
                        Biometric authentication is not available on this device.
                        Please use a device with fingerprint, Face ID, or PIN support.
                    </p>
                </div>
            )}

            {/* Enrollment Disabled Notice */}
            {!config.allowEnrollment && !configLoading && biometricAvailable && (
                <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                        <svg className="h-5 w-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                            <p className="text-sm font-semibold text-blue-900">Enrollment Currently Restricted</p>
                            <p className="text-sm text-blue-700 mt-1">
                                New biometric device enrollment is temporarily disabled. You can still authenticate with existing devices.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Enrollment Section - Only show if allowed */}
            {biometricAvailable && config.allowEnrollment && !configLoading && (
                <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">
                        Enroll New Device
                    </h3>
                    <div className="flex gap-3">
                        <input
                            type="text"
                            placeholder="Device name (e.g., My iPhone)"
                            value={deviceName}
                            onChange={(e) => setDeviceName(e.target.value)}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                        <button
                            onClick={enrollBiometric}
                            disabled={enrolling}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center"
                        >
                            {enrolling ? (
                                <>
                                    <svg
                                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                                    Enrolling...
                                </>
                            ) : (
                                <>
                                    <svg
                                        className="w-4 h-4 mr-2"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                        />
                                    </svg>
                                    Enroll Device
                                </>
                            )}
                        </button>
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                        You&apos;ll be prompted to use your fingerprint, Face ID, or device PIN
                    </p>
                </div>
            )}

            {/* Registered Devices */}
            <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    Registered Devices
                </h3>

                {loading ? (
                    <div className="text-center py-8">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : devices.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                        <svg
                            className="mx-auto h-12 w-12 text-gray-400"
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
                        <p className="mt-2 text-sm text-gray-600">No devices enrolled yet</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {devices.map((device) => (
                            <div
                                key={device.id}
                                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                            >
                                <div className="flex items-center space-x-3">
                                    <div className="shrink-0">
                                        <svg
                                            className="h-8 w-8 text-blue-600"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                                            />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900">
                                            {device.device_name}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            Type: {device.device_type} •
                                            Added: {new Date(device.created_at).toLocaleDateString()} •
                                            Last used: {new Date(device.last_used_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => removeDevice(device.id)}
                                    className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    Remove
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Security Layers Info */}
            <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">
                    Your Security Layers:
                </h4>
                <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center">
                        <span className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center mr-2 text-xs font-bold">1</span>
                        Cloudflare Access Protection
                    </li>
                    <li className="flex items-center">
                        <span className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center mr-2 text-xs font-bold">2</span>
                        Password-Based Authentication
                    </li>
                    <li className="flex items-center">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 text-xs font-bold ${devices.length > 0 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                            }`}>3</span>
                        Biometric Authentication {devices.length > 0 ? '(Active)' : '(Not Active)'}
                    </li>
                </ul>
            </div>
        </div>
    );
}
