import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Contact | KeepPlay Engine",
  description:
    "Get in touch with the KeepPlay Engine team. We'd love to hear from you.",
};

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main
        className="grow pt-16 sm:pt-20 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            "url('https://res.cloudinary.com/destej60y/image/upload/v1770941675/background_4_whua18.png')",
        }}
      >
        {/* Hero */}
        <section className="py-20 sm:py-32 text-center">
          <div className="max-w-3xl mx-auto px-6">
            <h1 className="text-5xl sm:text-7xl font-black text-gray-900 tracking-tight mb-4">
              Get in touch.
            </h1>
            <p className="text-lg sm:text-xl font-bold text-gray-900">
              We&apos;d love to hear from you.
            </p>
          </div>
        </section>

        {/* Contact Card */}
        <section className="relative -mt-8 sm:-mt-12 pb-20 sm:pb-28 px-6">
          <div className="max-w-xl mx-auto rounded-2xl bg-gray-900 text-white shadow-2xl p-8 sm:p-12 text-center">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
              Contact Information
            </h2>

            {/* Accent bar */}
            <div className="mx-auto mt-3 mb-8 h-1 w-12 rounded-full bg-[#0FFF12]" />

            {/* Email */}
            <div className="mb-8">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
                Email
              </p>
              <a
                href="mailto:support@keepplayengine.com"
                className="inline-block rounded-full bg-white px-8 py-3 text-base font-semibold text-gray-900 shadow-sm transition hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
              >
                support@keepplayengine.com
              </a>
            </div>

            {/* Address */}
            <div className="mb-8">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
                Address
              </p>
              <address className="not-italic text-sm leading-relaxed text-gray-300">
                RAVADO TECH LTD
                <br />
                71–75 Shelton Street, Covent Garden
                <br />
                London, WC2H 9JQ
                <br />
                United Kingdom
              </address>
            </div>

            {/* Additional emails */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
                Other Enquiries
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <a
                  href="mailto:privacy@keepplayengine.com"
                  className="text-sm text-[#0FFF12] hover:underline"
                >
                  privacy@keepplayengine.com
                </a>
                <span className="hidden sm:inline text-gray-600">|</span>
                <a
                  href="mailto:legal@keepplayengine.com"
                  className="text-sm text-[#0FFF12] hover:underline"
                >
                  legal@keepplayengine.com
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
