import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Do Not Sell My Personal Information — KeepPlay Engine",
  description:
    "Exercise your right to opt out of the sale or sharing of your personal information under applicable privacy laws.",
};

export default function DoNotSellPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="grow pt-20 sm:pt-24 pb-16 bg-white">
        {/* Header */}
        <div className="bg-linear-to-br from-gray-900 to-gray-800 text-white py-14 sm:py-20 mb-12">
          <div className="max-w-4xl mx-auto px-6 sm:px-8 text-center">
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4">
              Do Not Sell My Personal Information
            </h1>
            <p className="text-gray-300 text-sm sm:text-base max-w-2xl mx-auto">
              Your privacy rights under applicable data protection laws.
            </p>
          </div>
        </div>

        <article className="max-w-4xl mx-auto px-6 sm:px-8">
          {/* Your Rights */}
          <section className="mb-12">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
              Your Rights
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Under certain privacy laws — including the California Consumer
              Privacy Act (CCPA), California Privacy Rights Act (CPRA), and
              similar regulations in other jurisdictions — you may have the
              right to opt out of the &quot;sale&quot; or &quot;sharing&quot; of
              your personal information for targeted advertising or other
              purposes.
            </p>
          </section>

          {/* Our Practice */}
          <section className="mb-12">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
              Our Practice
            </h2>
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-gray-700 leading-relaxed space-y-3">
              <p>
                RAVADO TECH LTD does not sell your personal information in the
                traditional sense (i.e., in exchange for monetary
                consideration).
              </p>
              <p>
                However, some privacy laws define &quot;sale&quot; or
                &quot;sharing&quot; broadly to include certain data disclosures
                to third-party analytics or advertising partners. To the extent
                our practices may fall within those definitions, we provide
                this page so you can exercise your opt-out rights.
              </p>
            </div>
          </section>

          {/* How to Opt Out */}
          <section className="mb-12">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
              How to Opt Out
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              You can exercise your opt-out right using any of the following
              methods:
            </p>
            <div className="space-y-4">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
                <h3 className="text-gray-900 font-semibold mb-1">
                  Cookie Preferences
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Visit our{" "}
                  <Link
                    href="/cookie-settings"
                    className="text-[#0BCC0E] hover:underline font-medium"
                  >
                    Cookie Settings
                  </Link>{" "}
                  page to manage which cookies and tracking technologies are
                  active on your device.
                </p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
                <h3 className="text-gray-900 font-semibold mb-1">
                  Email Request
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Send an email to{" "}
                  <a
                    href="mailto:privacy@keepplayengine.com"
                    className="text-[#0BCC0E] hover:underline font-medium"
                  >
                    privacy@keepplayengine.com
                  </a>{" "}
                  with the subject line{" "}
                  <strong>
                    &quot;Do Not Sell My Personal Information&quot;
                  </strong>
                  . Include your name and the email address associated with your
                  account.
                </p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
                <h3 className="text-gray-900 font-semibold mb-1">
                  Global Privacy Control (GPC)
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  We honour Global Privacy Control signals sent by your browser.
                  If your browser supports GPC and it is enabled, we will treat
                  that signal as a valid opt-out request.
                </p>
              </div>
            </div>
          </section>

          {/* What Happens */}
          <section className="mb-12">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
              What Happens After You Opt Out
            </h2>
            <ul className="list-disc pl-5 space-y-2 text-gray-700 leading-relaxed">
              <li>
                Third-party analytics and advertising cookies will be disabled
                for your session
              </li>
              <li>
                We will not share your personal data with third parties for
                targeted advertising
              </li>
              <li>
                Core functionality of the app and website will not be affected
              </li>
              <li>
                Your opt-out preference will be maintained unless you clear your
                cookies or submit a new request
              </li>
            </ul>
          </section>

          {/* Non-Discrimination */}
          <section className="mb-12">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
              Non-Discrimination
            </h2>
            <p className="text-gray-700 leading-relaxed">
              We will not discriminate against you for exercising your privacy
              rights. You will continue to receive the same quality of service
              and access to features regardless of your opt-out choices.
            </p>
          </section>

          {/* More Info */}
          <section className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-center">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
              More Information
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              For full details on how we collect, use, and protect your data,
              see our{" "}
              <Link
                href="/privacy-policy"
                className="text-[#0BCC0E] hover:underline font-medium"
              >
                Privacy Policy
              </Link>
              .
            </p>
            <a
              href="mailto:privacy@keepplayengine.com"
              className="text-[#0BCC0E] hover:underline font-medium"
            >
              privacy@keepplayengine.com
            </a>
          </section>
        </article>
      </main>

      <Footer />
    </div>
  );
}
