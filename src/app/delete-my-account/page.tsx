import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Delete My Account — KeepPlay Engine",
  description:
    "Learn how to request the deletion of your KeepPlay Engine account and associated data.",
};

export default function DeleteMyAccountPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="grow pt-20 sm:pt-24 pb-16 bg-white">
        {/* Header */}
        <div className="bg-linear-to-br from-gray-900 to-gray-800 text-white py-14 sm:py-20 mb-12">
          <div className="max-w-4xl mx-auto px-6 sm:px-8 text-center">
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4">
              Delete My Account
            </h1>
            <p className="text-gray-300 text-sm sm:text-base max-w-2xl mx-auto">
              How to request the permanent deletion of your KeepPlay Engine
              account and personal data.
            </p>
          </div>
        </div>

        <article className="max-w-4xl mx-auto px-6 sm:px-8">
          {/* What Happens */}
          <section className="mb-12">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
              What Happens When You Delete Your Account
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              When you request account deletion, the following actions are taken:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-gray-700 leading-relaxed">
              <li>
                Your account and profile information are permanently removed
              </li>
              <li>
                Your loyalty coin balance and transaction history are deleted
              </li>
              <li>Any pending rewards are forfeited and cannot be recovered</li>
              <li>
                Your personal data is erased in accordance with our{" "}
                <Link
                  href="/privacy-policy"
                  className="text-[#0BCC0E] hover:underline font-medium"
                >
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </section>

          {/* Important Notice */}
          <section className="mb-12">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
              Important Notice
            </h2>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-gray-700 leading-relaxed space-y-3">
              <p>
                Account deletion is <strong>permanent and irreversible</strong>.
                Once your account is deleted, we cannot restore your data,
                loyalty coins, reward history, or any associated information.
              </p>
              <p>
                We may retain certain data where required by law, regulation, or
                legitimate business purposes such as fraud prevention, as
                described in our Privacy Policy.
              </p>
            </div>
          </section>

          {/* How to Request */}
          <section className="mb-12">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
              How to Request Account Deletion
            </h2>
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
                <strong>&quot;Account Deletion Request&quot;</strong>. Include
                the email address associated with your account so we can
                verify your identity.
              </p>
            </div>
          </section>

          {/* Processing Time */}
          <section className="mb-12">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
              Processing Time
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Account deletion requests are typically processed within 30 days.
              You will receive a confirmation email once the deletion is
              complete. If we need additional information to verify your
              identity, we will contact you.
            </p>
          </section>

          {/* Contact */}
          <section className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-center">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
              Questions?
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              If you have questions about account deletion or data handling,
              contact our privacy team.
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
