"use client";

import { useEffect, useCallback } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function CookieSettingsPage() {
  const openKlaroManager = useCallback(() => {
    if (
      typeof window !== "undefined" &&
      window.klaro &&
      typeof window.klaro.show === "function"
    ) {
      window.klaro.show(undefined, true);
    }
  }, []);

  useEffect(() => {
    // Klaro loads asynchronously — poll until it's ready, then auto-open
    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 20; // ~4 s max

    const interval = setInterval(() => {
      attempts++;
      if (
        !cancelled &&
        typeof window !== "undefined" &&
        window.klaro &&
        typeof window.klaro.show === "function"
      ) {
        window.klaro.show(undefined, true);
        clearInterval(interval);
      } else if (attempts >= maxAttempts) {
        clearInterval(interval);
      }
    }, 200);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="grow pt-20 sm:pt-24 pb-16 bg-white">
        {/* Header */}
        <div className="bg-linear-to-br from-gray-900 to-gray-800 text-white py-14 sm:py-20 mb-12">
          <div className="max-w-4xl mx-auto px-6 sm:px-8 text-center">
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4">
              Cookie Settings
            </h1>
            <p className="text-gray-300 text-sm sm:text-base max-w-2xl mx-auto">
              Manage your cookie preferences and control how we use tracking
              technologies on our platform.
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="max-w-3xl mx-auto px-6 sm:px-8">
          {/* Main Settings Card */}
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-8 mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Your Cookie Preferences
            </h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Click the button below to open the cookie consent manager where
              you can review and update your preferences for each cookie
              category. Your choices will be saved and applied immediately.
            </p>
            <button
              onClick={openKlaroManager}
              className="inline-flex items-center gap-2 bg-[#0BCC0E] hover:bg-[#0aa80c] text-white font-semibold px-6 py-3 rounded-xl transition-colors cursor-pointer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
                  clipRule="evenodd"
                />
              </svg>
              Manage Cookie Preferences
            </button>
          </div>

          {/* Cookie Categories Overview */}
          <div className="mb-10">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
              Cookie Categories
            </h2>
            <div className="space-y-4">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-gray-900 font-semibold mb-1">
                      Essential Cookies
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Required for the Service to function. These cannot be
                      disabled. They handle authentication, session management,
                      and consent storage.
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-semibold bg-[#0BCC0E]/10 text-[#0BCC0E] px-3 py-1 rounded-full">
                    Always Active
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
                <h3 className="text-gray-900 font-semibold mb-1">
                  Functional Cookies
                </h3>
                <p className="text-gray-600 text-sm">
                  Enable personalised features like theme preferences, language
                  settings, and notification preferences.
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
                <h3 className="text-gray-900 font-semibold mb-1">
                  Analytics Cookies
                </h3>
                <p className="text-gray-600 text-sm">
                  Help us understand how visitors interact with our platform so
                  we can measure and improve performance.
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
                <h3 className="text-gray-900 font-semibold mb-1">
                  Advertising &amp; Marketing Cookies
                </h3>
                <p className="text-gray-600 text-sm">
                  Used to deliver relevant ads and measure campaign
                  effectiveness. These may share data with third parties.
                </p>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-8 space-y-4">
            <h2 className="text-xl font-bold text-gray-900">
              Need More Information?
            </h2>
            <p className="text-gray-700 leading-relaxed">
              For a detailed explanation of the specific cookies we use, their
              purposes, and durations, please review our{" "}
              <Link
                href="/cookie-policy"
                className="text-[#0BCC0E] hover:underline font-medium"
              >
                Cookie Policy
              </Link>
              .
            </p>
            <p className="text-gray-700 leading-relaxed">
              To learn more about how we collect, use, and protect your personal
              data, see our{" "}
              <Link
                href="/privacy-policy"
                className="text-[#0BCC0E] hover:underline font-medium"
              >
                Privacy Policy
              </Link>
              .
            </p>
            <p className="text-gray-700 leading-relaxed">
              If you have questions about cookies or your privacy, contact us
              at{" "}
              <a
                href="mailto:privacy@keepplayengine.com"
                className="text-[#0BCC0E] hover:underline font-medium"
              >
                privacy@keepplayengine.com
              </a>
              .
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
