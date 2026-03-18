import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Cookie Policy | KeepPlay Engine",
  description:
    "Learn how KeepPlay Engine uses cookies and similar tracking technologies. Read our full Cookie Policy.",
};

/* ------------------------------------------------------------------ */
/*  Section helper – keeps the JSX readable                           */
/* ------------------------------------------------------------------ */
function Section({
  id,
  title,
  children,
}: {
  id?: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mb-10">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
        {title}
      </h2>
      <div className="space-y-4 text-gray-700 leading-relaxed">{children}</div>
    </section>
  );
}

function SubSection({
  id,
  title,
  children,
}: {
  id?: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div id={id} className="mt-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">{title}</h3>
      <div className="space-y-3 text-gray-700 leading-relaxed">{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */
export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="grow pt-20 sm:pt-24 pb-16 bg-white">
        {/* Header */}
        <div className="bg-linear-to-br from-gray-900 to-gray-800 text-white py-14 sm:py-20 mb-12">
          <div className="max-w-4xl mx-auto px-6 sm:px-8 text-center">
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4">
              Cookie Policy
            </h1>
            <p className="text-gray-300 text-sm sm:text-base max-w-2xl mx-auto">
              This policy explains how KeepPlay Engine and RAVADO TECH LTD use
              cookies and similar tracking technologies when you visit or
              interact with our Service.
            </p>
            <p className="mt-4 text-xs text-gray-400">
              Last updated: March 18, 2026
            </p>
          </div>
        </div>

        {/* Body */}
        <article className="max-w-4xl mx-auto px-6 sm:px-8">
          {/* ---- Table of Contents ---- */}
          <nav className="mb-12 rounded-xl border border-gray-200 bg-gray-50 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-3">
              Table of Contents
            </h2>
            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
              <li><a href="#introduction" className="hover:text-[#0BCC0E]">Introduction</a></li>
              <li><a href="#what-are-cookies" className="hover:text-[#0BCC0E]">What Are Cookies</a></li>
              <li><a href="#how-we-use-cookies" className="hover:text-[#0BCC0E]">How We Use Cookies</a></li>
              <li><a href="#essential-cookies" className="hover:text-[#0BCC0E]">Essential Cookies</a></li>
              <li><a href="#functional-cookies" className="hover:text-[#0BCC0E]">Functional Cookies</a></li>
              <li><a href="#analytics-cookies" className="hover:text-[#0BCC0E]">Analytics Cookies</a></li>
              <li><a href="#advertising-cookies" className="hover:text-[#0BCC0E]">Advertising &amp; Marketing Cookies</a></li>
              <li><a href="#third-party-cookies" className="hover:text-[#0BCC0E]">Third-Party Cookies</a></li>
              <li><a href="#cookie-duration" className="hover:text-[#0BCC0E]">Cookie Duration</a></li>
              <li><a href="#managing-cookies" className="hover:text-[#0BCC0E]">Managing Your Cookie Preferences</a></li>
              <li><a href="#browser-controls" className="hover:text-[#0BCC0E]">Browser Cookie Controls</a></li>
              <li><a href="#mobile-app-tracking" className="hover:text-[#0BCC0E]">Mobile App &amp; SDK Tracking</a></li>
              <li><a href="#local-storage" className="hover:text-[#0BCC0E]">Local Storage &amp; Similar Technologies</a></li>
              <li><a href="#gdpr-compliance" className="hover:text-[#0BCC0E]">GDPR &amp; UK GDPR Compliance</a></li>
              <li><a href="#ccpa-compliance" className="hover:text-[#0BCC0E]">CCPA / CPRA Compliance</a></li>
              <li><a href="#do-not-track" className="hover:text-[#0BCC0E]">Do Not Track Signals</a></li>
              <li><a href="#children" className="hover:text-[#0BCC0E]">Children &amp; Cookies</a></li>
              <li><a href="#updates" className="hover:text-[#0BCC0E]">Updates to This Policy</a></li>
              <li><a href="#contact" className="hover:text-[#0BCC0E]">Contact Us</a></li>
            </ol>
          </nav>

          {/* -------------------------------------------------------- */}
          {/* 1. INTRODUCTION                                          */}
          {/* -------------------------------------------------------- */}
          <Section id="introduction" title="1. Introduction">
            <p>
              This Cookie Policy explains how <strong>RAVADO TECH LTD</strong>{" "}
              (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;), the
              operator of the <strong>KeepPlay Engine</strong> platform, website,
              and progressive web application (collectively the
              &ldquo;Service&rdquo;), uses cookies and similar tracking
              technologies when you visit or interact with our Service.
            </p>
            <p>
              By continuing to use our Service, you acknowledge this Cookie
              Policy. You can manage your cookie preferences at any time through
              our{" "}
              <Link
                href="/cookie-settings"
                className="text-[#0BCC0E] hover:underline font-medium"
              >
                Cookie Settings
              </Link>{" "}
              page or through our consent manager.
            </p>
          </Section>

          {/* -------------------------------------------------------- */}
          {/* 2. WHAT ARE COOKIES                                      */}
          {/* -------------------------------------------------------- */}
          <Section id="what-are-cookies" title="2. What Are Cookies">
            <p>
              Cookies are small text files that are placed on your device
              (computer, smartphone, or tablet) when you visit a website or use
              an application. They are widely used to make websites work
              efficiently, provide a better user experience, and supply
              information to the site operators.
            </p>
            <SubSection title="Types of Cookies">
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  <strong>First-party cookies</strong> — Set by the website you
                  are visiting (keepplayengine.com).
                </li>
                <li>
                  <strong>Third-party cookies</strong> — Set by a domain other
                  than the one you are visiting, typically by our service
                  providers or advertising partners.
                </li>
                <li>
                  <strong>Session cookies</strong> — Temporary cookies that are
                  erased when you close your browser.
                </li>
                <li>
                  <strong>Persistent cookies</strong> — Remain on your device for
                  a set period or until you delete them.
                </li>
              </ul>
            </SubSection>
          </Section>

          {/* -------------------------------------------------------- */}
          {/* 3. HOW WE USE COOKIES                                    */}
          {/* -------------------------------------------------------- */}
          <Section id="how-we-use-cookies" title="3. How We Use Cookies">
            <p>
              We use cookies and similar technologies for the following purposes:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Authentication &amp; Security</strong> — To verify your
                identity, maintain your session, and protect against fraud.
              </li>
              <li>
                <strong>Preferences &amp; Functionality</strong> — To remember
                your settings, language preferences, and personalise your
                experience.
              </li>
              <li>
                <strong>Analytics &amp; Performance</strong> — To understand how
                visitors use our Service, measure performance, and improve our
                platform.
              </li>
              <li>
                <strong>Advertising &amp; Marketing</strong> — To deliver
                relevant advertisements, measure ad effectiveness, and support
                our marketing efforts.
              </li>
              <li>
                <strong>Consent Management</strong> — To remember and honour your
                cookie consent choices.
              </li>
            </ul>
          </Section>

          {/* -------------------------------------------------------- */}
          {/* 4. ESSENTIAL COOKIES                                     */}
          {/* -------------------------------------------------------- */}
          <Section id="essential-cookies" title="4. Essential Cookies">
            <p>
              These cookies are strictly necessary for the Service to function
              and cannot be turned off. They are typically set in response to
              actions you take, such as signing in, setting your privacy
              preferences, or completing forms.
            </p>
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-3 text-gray-900 font-semibold">
                      Cookie / Storage Key
                    </th>
                    <th className="text-left p-3 text-gray-900 font-semibold">
                      Purpose
                    </th>
                    <th className="text-left p-3 text-gray-900 font-semibold">
                      Duration
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="p-3 font-mono text-[#0BCC0E] text-xs">
                      keepplay-session
                    </td>
                    <td className="p-3">Maintains your authenticated session</td>
                    <td className="p-3">Session</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono text-[#0BCC0E] text-xs">
                      keepplay-cookie-consent
                    </td>
                    <td className="p-3">
                      Stores your cookie consent preferences
                    </td>
                    <td className="p-3">365 days</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono text-[#0BCC0E] text-xs">
                      sb-*-auth-token
                    </td>
                    <td className="p-3">Authentication token (Supabase)</td>
                    <td className="p-3">Session / 7 days</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono text-[#0BCC0E] text-xs">
                      csrf-token
                    </td>
                    <td className="p-3">
                      Cross-site request forgery protection
                    </td>
                    <td className="p-3">Session</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Essential cookies are always active and do not require consent.
              Without them, the Service cannot function properly.
            </p>
          </Section>

          {/* -------------------------------------------------------- */}
          {/* 5. FUNCTIONAL COOKIES                                    */}
          {/* -------------------------------------------------------- */}
          <Section id="functional-cookies" title="5. Functional Cookies">
            <p>
              Functional cookies enable enhanced features and personalisation.
              They may be set by us or by third-party providers whose services we
              have added to our pages.
            </p>
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-3 text-gray-900 font-semibold">
                      Cookie / Storage Key
                    </th>
                    <th className="text-left p-3 text-gray-900 font-semibold">
                      Purpose
                    </th>
                    <th className="text-left p-3 text-gray-900 font-semibold">
                      Duration
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="p-3 font-mono text-[#0BCC0E] text-xs">
                      keepplay-theme
                    </td>
                    <td className="p-3">
                      Remembers your display theme preference
                    </td>
                    <td className="p-3">365 days</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono text-[#0BCC0E] text-xs">
                      keepplay-locale
                    </td>
                    <td className="p-3">Stores your language preference</td>
                    <td className="p-3">365 days</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono text-[#0BCC0E] text-xs">
                      keepplay-notification-pref
                    </td>
                    <td className="p-3">
                      Push notification preference settings
                    </td>
                    <td className="p-3">365 days</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              If you disable functional cookies, some features may not work as
              expected.
            </p>
          </Section>

          {/* -------------------------------------------------------- */}
          {/* 6. ANALYTICS COOKIES                                     */}
          {/* -------------------------------------------------------- */}
          <Section id="analytics-cookies" title="6. Analytics Cookies">
            <p>
              Analytics cookies help us understand how visitors interact with our
              Service by collecting and reporting information anonymously or in
              aggregate form.
            </p>
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-3 text-gray-900 font-semibold">
                      Provider
                    </th>
                    <th className="text-left p-3 text-gray-900 font-semibold">
                      Cookie(s)
                    </th>
                    <th className="text-left p-3 text-gray-900 font-semibold">
                      Purpose
                    </th>
                    <th className="text-left p-3 text-gray-900 font-semibold">
                      Duration
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="p-3">Google Analytics</td>
                    <td className="p-3 font-mono text-[#0BCC0E] text-xs">
                      _ga, _ga_*
                    </td>
                    <td className="p-3">
                      Distinguishes unique users, tracks page views and events
                    </td>
                    <td className="p-3">Up to 2 years</td>
                  </tr>
                  <tr>
                    <td className="p-3">Vercel Analytics</td>
                    <td className="p-3 font-mono text-[#0BCC0E] text-xs">
                      va_*
                    </td>
                    <td className="p-3">
                      Web performance metrics and visitor analytics
                    </td>
                    <td className="p-3">Session / 24 hours</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Analytics cookies are only set after you provide consent. You can
              opt out through our{" "}
              <Link
                href="/cookie-settings"
                className="text-[#0BCC0E] hover:underline font-medium"
              >
                Cookie Settings
              </Link>
              .
            </p>
          </Section>

          {/* -------------------------------------------------------- */}
          {/* 7. ADVERTISING & MARKETING COOKIES                       */}
          {/* -------------------------------------------------------- */}
          <Section id="advertising-cookies" title="7. Advertising &amp; Marketing Cookies">
            <p>
              These cookies are used to deliver advertisements that are more
              relevant to you and your interests. They also help us measure the
              effectiveness of advertising campaigns.
            </p>
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-3 text-gray-900 font-semibold">
                      Provider
                    </th>
                    <th className="text-left p-3 text-gray-900 font-semibold">
                      Cookie(s)
                    </th>
                    <th className="text-left p-3 text-gray-900 font-semibold">
                      Purpose
                    </th>
                    <th className="text-left p-3 text-gray-900 font-semibold">
                      Duration
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="p-3">Google Ads</td>
                    <td className="p-3 font-mono text-[#0BCC0E] text-xs">
                      _gcl_*, IDE, NID
                    </td>
                    <td className="p-3">
                      Conversion tracking, ad personalisation, remarketing
                    </td>
                    <td className="p-3">Up to 13 months</td>
                  </tr>
                  <tr>
                    <td className="p-3">Meta Pixel</td>
                    <td className="p-3 font-mono text-[#0BCC0E] text-xs">
                      _fbp, _fbc
                    </td>
                    <td className="p-3">
                      Ad performance measurement, audience targeting
                    </td>
                    <td className="p-3">Up to 90 days</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Advertising cookies are only set with your explicit consent. You
              can withdraw consent at any time.
            </p>
          </Section>

          {/* -------------------------------------------------------- */}
          {/* 8. THIRD-PARTY COOKIES                                   */}
          {/* -------------------------------------------------------- */}
          <Section id="third-party-cookies" title="8. Third-Party Cookies">
            <p>
              Some cookies on our Service are placed by third-party service
              providers. We do not control these cookies and recommend reviewing
              the privacy and cookie policies of these third parties:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Supabase</strong> — Authentication and database services
              </li>
              <li>
                <strong>Cloudflare</strong> — Security, performance, and CDN
                services
              </li>
              <li>
                <strong>Vercel</strong> — Hosting and web analytics
              </li>
              <li>
                <strong>Google</strong> — Analytics and advertising services
              </li>
              <li>
                <strong>Firebase (Google)</strong> — Push notification services
              </li>
            </ul>
            <p>
              Third-party providers may update their cookies independently.
              Please refer to their respective policies for the most up-to-date
              information.
            </p>
          </Section>

          {/* -------------------------------------------------------- */}
          {/* 9. COOKIE DURATION                                       */}
          {/* -------------------------------------------------------- */}
          <Section id="cookie-duration" title="9. Cookie Duration">
            <p>Cookies used on our Service have varying lifespans:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Session cookies</strong> — Deleted automatically when you
                close your browser.
              </li>
              <li>
                <strong>Short-term persistent cookies</strong> — Typically expire
                within 24 hours to 30 days.
              </li>
              <li>
                <strong>Long-term persistent cookies</strong> — May persist for
                up to 2 years (e.g., analytics identifiers).
              </li>
            </ul>
            <p>
              You can delete all cookies from your device at any time through
              your browser settings. Specific durations for each cookie are
              listed in the tables above.
            </p>
          </Section>

          {/* -------------------------------------------------------- */}
          {/* 10. MANAGING YOUR COOKIE PREFERENCES                     */}
          {/* -------------------------------------------------------- */}
          <Section id="managing-cookies" title="10. Managing Your Cookie Preferences">
            <p>
              You have full control over which non-essential cookies are placed
              on your device. You can manage your preferences in the following
              ways:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Cookie Consent Manager</strong> — When you first visit
                our Service, a cookie banner will appear allowing you to accept
                or reject non-essential cookies. You can update your choices at
                any time via our{" "}
                <Link
                  href="/cookie-settings"
                  className="text-[#0BCC0E] hover:underline font-medium"
                >
                  Cookie Settings
                </Link>{" "}
                page.
              </li>
              <li>
                <strong>Browser Settings</strong> — Most browsers allow you to
                block or delete cookies (see Section 11 below).
              </li>
              <li>
                <strong>Opt-Out Links</strong> — Many third-party providers offer
                direct opt-out mechanisms (e.g.,{" "}
                <a
                  href="https://tools.google.com/dlpage/gaoptout"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#0BCC0E] hover:underline font-medium"
                >
                  Google Analytics Opt-Out
                </a>
                ).
              </li>
            </ul>
          </Section>

          {/* -------------------------------------------------------- */}
          {/* 11. BROWSER COOKIE CONTROLS                              */}
          {/* -------------------------------------------------------- */}
          <Section id="browser-controls" title="11. Browser Cookie Controls">
            <p>
              You can configure your browser to block or delete cookies. Here are
              links to cookie management instructions for popular browsers:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <a
                  href="https://support.google.com/chrome/answer/95647"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#0BCC0E] hover:underline font-medium"
                >
                  Google Chrome
                </a>
              </li>
              <li>
                <a
                  href="https://support.mozilla.org/en-US/kb/enhanced-tracking-protection-firefox-desktop"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#0BCC0E] hover:underline font-medium"
                >
                  Mozilla Firefox
                </a>
              </li>
              <li>
                <a
                  href="https://support.apple.com/en-gb/guide/safari/sfri11471/mac"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#0BCC0E] hover:underline font-medium"
                >
                  Apple Safari
                </a>
              </li>
              <li>
                <a
                  href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#0BCC0E] hover:underline font-medium"
                >
                  Microsoft Edge
                </a>
              </li>
            </ul>
            <p className="text-sm text-gray-500">
              Note: Blocking all cookies may impair the functionality of our
              Service, particularly authentication and consent management
              features.
            </p>
          </Section>

          {/* -------------------------------------------------------- */}
          {/* 12. MOBILE APP & SDK TRACKING                            */}
          {/* -------------------------------------------------------- */}
          <Section id="mobile-app-tracking" title="12. Mobile App &amp; SDK Tracking">
            <p>
              When you use KeepPlay Engine as a progressive web application (PWA)
              installed on your mobile device, the following may apply:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Service Workers</strong> — We use service workers to
                cache content and enable offline functionality. Service workers
                may store data locally on your device.
              </li>
              <li>
                <strong>Firebase Cloud Messaging</strong> — If you opt in to push
                notifications, Firebase may use instance IDs and tokens to
                deliver notifications.
              </li>
              <li>
                <strong>Device Identifiers</strong> — We do not access hardware
                device identifiers. Any identification is session-based or
                user-account-based.
              </li>
            </ul>
            <p>
              You can control PWA data storage through your mobile
              device&apos;s app settings or by clearing site data in your
              browser.
            </p>
          </Section>

          {/* -------------------------------------------------------- */}
          {/* 13. LOCAL STORAGE & SIMILAR TECHNOLOGIES                  */}
          {/* -------------------------------------------------------- */}
          <Section id="local-storage" title="13. Local Storage &amp; Similar Technologies">
            <p>
              In addition to cookies, we may use other local storage
              technologies:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>localStorage</strong> — Used to store preferences,
                consent state, and non-sensitive application data. Data persists
                until explicitly cleared.
              </li>
              <li>
                <strong>sessionStorage</strong> — Used for temporary session data
                that is cleared when the browser tab is closed.
              </li>
              <li>
                <strong>IndexedDB</strong> — May be used for offline caching of
                application data within the PWA.
              </li>
              <li>
                <strong>Cache API</strong> — Used by our service worker to cache
                assets for improved performance and offline access.
              </li>
            </ul>
            <p>
              These technologies are governed by the same consent rules as
              cookies. Essential storage is always active; non-essential storage
              requires your consent.
            </p>
          </Section>

          {/* -------------------------------------------------------- */}
          {/* 14. GDPR & UK GDPR COMPLIANCE                            */}
          {/* -------------------------------------------------------- */}
          <Section id="gdpr-compliance" title="14. GDPR &amp; UK GDPR Compliance">
            <p>
              If you are located in the European Economic Area (EEA) or the
              United Kingdom, the following applies:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                We obtain your explicit, informed consent before placing
                non-essential cookies, in accordance with the ePrivacy Directive
                and GDPR.
              </li>
              <li>
                Essential cookies are placed under the legitimate interest or
                contractual necessity legal bases, as they are strictly necessary
                for the Service to function.
              </li>
              <li>
                You may withdraw consent at any time through our{" "}
                <Link
                  href="/cookie-settings"
                  className="text-[#0BCC0E] hover:underline font-medium"
                >
                  Cookie Settings
                </Link>{" "}
                without affecting the lawfulness of processing based on consent
                before its withdrawal.
              </li>
              <li>
                We maintain records of consent as required by applicable law.
              </li>
              <li>
                We conduct Data Protection Impact Assessments (DPIAs) where
                required for new tracking technologies.
              </li>
            </ul>
          </Section>

          {/* -------------------------------------------------------- */}
          {/* 15. CCPA / CPRA COMPLIANCE                               */}
          {/* -------------------------------------------------------- */}
          <Section id="ccpa-compliance" title="15. CCPA / CPRA Compliance">
            <p>
              If you are a California resident, the California Consumer Privacy
              Act (CCPA) and the California Privacy Rights Act (CPRA) grant you
              additional rights:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                You have the right to know what personal information is collected
                through cookies and tracking technologies.
              </li>
              <li>
                You have the right to opt out of the &ldquo;sale&rdquo; or
                &ldquo;sharing&rdquo; of personal information, including through
                advertising cookies. Visit our{" "}
                <Link
                  href="/do-not-sell"
                  className="text-[#0BCC0E] hover:underline font-medium"
                >
                  Do Not Sell My Personal Information
                </Link>{" "}
                page.
              </li>
              <li>
                We honour the Global Privacy Control (GPC) browser signal as a
                valid opt-out request.
              </li>
              <li>
                We do not use &ldquo;dark patterns&rdquo; or make it more
                difficult to opt out than to opt in.
              </li>
            </ul>
          </Section>

          {/* -------------------------------------------------------- */}
          {/* 16. DO NOT TRACK SIGNALS                                 */}
          {/* -------------------------------------------------------- */}
          <Section id="do-not-track" title="16. Do Not Track Signals">
            <p>
              Some browsers include a &ldquo;Do Not Track&rdquo; (DNT) feature
              that sends a signal to websites requesting that your browsing
              activity not be tracked. There is currently no uniform standard for
              interpreting DNT signals.
            </p>
            <p>
              While we do not currently respond to DNT browser signals, we do
              honour the <strong>Global Privacy Control (GPC)</strong> signal,
              which we treat as a valid opt-out of the sale or sharing of
              personal information under applicable law.
            </p>
          </Section>

          {/* -------------------------------------------------------- */}
          {/* 17. CHILDREN & COOKIES                                   */}
          {/* -------------------------------------------------------- */}
          <Section id="children" title="17. Children &amp; Cookies">
            <p>
              KeepPlay Engine is not directed at children under the age of 18. We
              do not knowingly place non-essential cookies or tracking
              technologies on the devices of individuals under 18.
            </p>
            <p>
              If we become aware that we have collected cookie-based data from a
              child under 18, we will take steps to delete such data promptly. If
              you believe a child has provided personal data through our Service,
              please contact us at{" "}
              <a
                href="mailto:privacy@keepplayengine.com"
                className="text-[#0BCC0E] hover:underline font-medium"
              >
                privacy@keepplayengine.com
              </a>
              .
            </p>
          </Section>

          {/* -------------------------------------------------------- */}
          {/* 18. UPDATES TO THIS POLICY                               */}
          {/* -------------------------------------------------------- */}
          <Section id="updates" title="18. Updates to This Policy">
            <p>
              We may update this Cookie Policy from time to time to reflect
              changes in technology, regulation, or our business practices. When
              we make material changes:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                We will update the &ldquo;Last Updated&rdquo; date at the top of
                this page.
              </li>
              <li>
                For significant changes, we may re-request your cookie consent.
              </li>
              <li>
                We will increment the consent version number in our consent
                manager, which may prompt a new consent dialogue.
              </li>
            </ul>
            <p>
              We encourage you to review this policy periodically to stay
              informed about how we use cookies.
            </p>
          </Section>

          {/* -------------------------------------------------------- */}
          {/* 19. CONTACT US                                           */}
          {/* -------------------------------------------------------- */}
          <Section id="contact" title="19. Contact Us">
            <p>
              If you have any questions about this Cookie Policy or our use of
              cookies and tracking technologies, please contact us:
            </p>
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 mt-4 space-y-2">
              <p>
                <strong>RAVADO TECH LTD</strong>
              </p>
              <p>71–75 Shelton Street, Covent Garden</p>
              <p>London, WC2H 9JQ, United Kingdom</p>
              <p className="pt-2">
                Email:{" "}
                <a
                  href="mailto:privacy@keepplayengine.com"
                  className="text-[#0BCC0E] hover:underline font-medium"
                >
                  privacy@keepplayengine.com
                </a>
              </p>
              <p>
                Cookie Settings:{" "}
                <Link
                  href="/cookie-settings"
                  className="text-[#0BCC0E] hover:underline font-medium"
                >
                  keepplayengine.com/cookie-settings
                </Link>
              </p>
            </div>
          </Section>
        </article>
      </main>

      <Footer />
    </div>
  );
}
