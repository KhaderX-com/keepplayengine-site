import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Loyalty Program | KeepPlay Engine",
  description:
    "Play participating games, complete challenges, earn loyalty coins, and redeem rewards inside KeepPlay.",
};

export default function LoyaltyProgramPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="grow pt-20 sm:pt-24 pb-16 bg-white">
        {/* ── Hero ── */}
        <div className="bg-linear-to-br from-gray-900 to-gray-800 text-white py-14 sm:py-20 mb-12">
          <div className="max-w-4xl mx-auto px-6 sm:px-8 text-center">
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4">
              KeepPlay Loyalty Program
            </h1>
            <p className="text-gray-200 text-base sm:text-lg max-w-2xl mx-auto mb-2">
              Play participating games, complete challenges, earn loyalty coins,
              and redeem rewards inside KeepPlay.
            </p>
            <p className="text-gray-400 text-sm max-w-2xl mx-auto mb-8">
              KeepPlay is a loyalty-based rewards experience designed to make
              gameplay more engaging. Users can discover participating games,
              track their progress, collect loyalty coins, and access available
              reward options directly in the app.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="https://play.google.com/store/apps/details?id=com.keepplayengine.loyaltyapp"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-[#0BCC0E] hover:bg-[#0aa80c] text-white font-semibold px-6 py-3 rounded-xl transition-colors"
              >
                Get the App
              </a>
              <a
                href="#how-it-works"
                className="inline-block border border-white/30 hover:border-white/60 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
              >
                Learn How It Works
              </a>
            </div>
          </div>
        </div>

        <article className="max-w-4xl mx-auto px-6 sm:px-8">
          {/* ── How It Works ── */}
          <section id="how-it-works" className="mb-14">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">
              How It Works
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                {
                  step: "1",
                  title: "Play participating games",
                  text: "Explore games included in the KeepPlay loyalty program and start playing.",
                },
                {
                  step: "2",
                  title: "Earn loyalty coins",
                  text: "Complete eligible in-app activities, game progress goals, and daily challenges to collect loyalty coins.",
                },
                {
                  step: "3",
                  title: "Track your progress",
                  text: "Monitor your balance, activity, transaction history, and reward history directly in the app.",
                },
                {
                  step: "4",
                  title: "Redeem rewards",
                  text: "When eligible, redeem your loyalty coins using the reward methods available in your app experience.",
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className="rounded-xl border border-gray-200 bg-gray-50 p-6"
                >
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#0BCC0E] text-white text-sm font-bold mb-3">
                    {item.step}
                  </span>
                  <h3 className="text-gray-900 font-semibold mb-1">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* ── What You Can Do ── */}
          <section className="mb-14">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
              What You Can Do in KeepPlay
            </h2>
            <ul className="list-disc pl-5 space-y-2 text-gray-700 leading-relaxed">
              <li>Discover loyalty program games</li>
              <li>Earn loyalty coins through eligible activity</li>
              <li>Complete daily challenges</li>
              <li>Track game earnings and transactions</li>
              <li>View reward history</li>
              <li>Access available reward methods</li>
              <li>Manage profile and settings</li>
            </ul>
          </section>

          {/* ── Why KeepPlay ── */}
          <section className="mb-14">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
              Why KeepPlay
            </h2>
            <p className="text-gray-700 leading-relaxed">
              KeepPlay combines gameplay, progress, and rewards in one simple
              experience. The loyalty program is designed to encourage
              engagement, consistency, and a better player journey across
              participating games.
            </p>
          </section>

          {/* ── Rewards & Eligibility ── */}
          <section className="mb-14">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
              Rewards &amp; Eligibility
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Reward options, redemption thresholds, eligibility, and
              availability may vary depending on user status, location, app
              rules, fraud-prevention checks, and supported payout methods.
              Values shown across the app or website may be illustrative and
              should not be interpreted as guaranteed results.
            </p>
          </section>

          {/* ── Final CTA ── */}
          <section
            id="download"
            className="rounded-xl border border-gray-200 bg-gray-50 p-8 text-center"
          >
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
              Ready to Join the KeepPlay Loyalty Program?
            </h2>
            <p className="text-gray-700 leading-relaxed mb-6 max-w-xl mx-auto">
              Download KeepPlay, explore participating games, complete
              challenges, and start progressing through the loyalty rewards
              experience.
            </p>
            <a
              href="https://play.google.com/store/apps/details?id=com.keepplayengine.loyaltyapp"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-[#0BCC0E] hover:bg-[#0aa80c] text-white font-semibold px-8 py-3 rounded-xl transition-colors"
            >
              Download KeepPlay
            </a>
          </section>
        </article>
      </main>

      <Footer />
    </div>
  );
}
