import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "About Us — KeepPlay Engine",
  description:
    "Learn about KeepPlay Engine and the team behind the loyalty-based rewards experience for gamers.",
};

export default function AboutUsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="grow pt-20 sm:pt-24 pb-16 bg-white">
        {/* Header */}
        <div className="bg-linear-to-br from-gray-900 to-gray-800 text-white py-14 sm:py-20 mb-12">
          <div className="max-w-4xl mx-auto px-6 sm:px-8 text-center">
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4">
              About Us
            </h1>
            <p className="text-gray-300 text-sm sm:text-base max-w-2xl mx-auto">
              The team and vision behind KeepPlay Engine.
            </p>
          </div>
        </div>

        <article className="max-w-4xl mx-auto px-6 sm:px-8">
          {/* Who We Are */}
          <section className="mb-12">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
              Who We Are
            </h2>
            <p className="text-gray-700 leading-relaxed">
              KeepPlay Engine is a product of{" "}
              <span className="font-semibold text-gray-900">
                RAVADO TECH LTD
              </span>
              , a technology company registered in England &amp; Wales
              (Company No. 17051903). We are based at 71–75 Shelton Street,
              Covent Garden, London, WC2H 9JQ, United Kingdom.
            </p>
          </section>

          {/* Our Mission */}
          <section className="mb-12">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
              Our Mission
            </h2>
            <p className="text-gray-700 leading-relaxed">
              We are building a loyalty-based rewards experience that makes
              mobile gameplay more engaging and rewarding. KeepPlay connects
              players with participating games and gives them a simple way to
              earn loyalty coins, complete challenges, track progress, and
              access rewards — all in one app.
            </p>
          </section>

          {/* What We Do */}
          <section className="mb-12">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
              What We Do
            </h2>
            <ul className="list-disc pl-5 space-y-2 text-gray-700 leading-relaxed">
              <li>
                Develop and maintain the KeepPlay loyalty platform
              </li>
              <li>
                Partner with game developers to bring titles into the loyalty
                program
              </li>
              <li>
                Provide players with a transparent, progress-based rewards
                experience
              </li>
              <li>
                Continuously improve the app based on user feedback and
                engagement insights
              </li>
            </ul>
          </section>

          {/* Get in Touch */}
          <section className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-center">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
              Get in Touch
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Have questions or want to work with us?
            </p>
            <a
              href="mailto:support@keepplayengine.com"
              className="text-[#0BCC0E] hover:underline font-medium"
            >
              support@keepplayengine.com
            </a>
          </section>
        </article>
      </main>

      <Footer />
    </div>
  );
}
