import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Data & account deletion | KeepPlay Engine",
  description:
    "Request deletion of your KeepPlay Engine game data or account without reinstalling a game.",
};
export default function DeleteMyAccountPage() {
  return (
    <>
      <Navbar />
      <main className="bg-white">
        <article className="kpe-legal">
          <p className="kpe-eyebrow mb-5">YOUR DATA, YOUR CHOICE</p>
          <h1>Data &amp; account deletion</h1>
          <p className="mt-6">
            Request deletion of personal information associated with a KeepPlay
            Engine game, app, or account. You do not need to create an account
            or reinstall a game to send a request.
          </p>
          <div className="kpe-legal-summary">
            <h2>Send a deletion request</h2>
            <p>
              Email{" "}
              <a href="mailto:privacy@keepplayengine.com?subject=Data%20and%20account%20deletion%20request">
                privacy@keepplayengine.com
              </a>{" "}
              with the subject{" "}
              <strong>Data and account deletion request</strong>.
            </p>
            <ul>
              <li>
                Include the game or app title and platform (iOS or Android).
              </li>
              <li>Provide your player ID or account email, if available.</li>
              <li>
                Tell us whether you want game data deleted, an account and its
                associated data deleted, or both.
              </li>
            </ul>
            <p>
              Do not send passwords, payment-card numbers, or unnecessary
              identity documents.
            </p>
          </div>
          <section>
            <h2>How we handle it</h2>
            <p>
              We locate the relevant records and may ask for proportionate
              information to verify ownership. If a game offers in-app account
              deletion, you may also use that option. If you cannot find it,
              contact us through the email above.
            </p>
            <p>
              We generally respond within one month where GDPR applies, or
              within the applicable local deadline. If a lawful extension is
              necessary, we explain the reason and timing. You receive
              confirmation when your request has been completed or an
              explanation of any limitation.
            </p>
          </section>
          <section>
            <h2>What gets deleted</h2>
            <p>
              Depending on the product, deletion includes account and profile
              information, server-side saved progress, player identifiers, and
              associated personal records that are no longer lawfully needed.
              Permanent deletion can remove progress and virtual items that
              cannot be restored.
            </p>
            <p>
              Limited transaction, security, fraud, or legal records may need to
              be retained for a documented period or legal requirement. We
              explain exceptions and restrict retained information to that
              purpose. Backups are removed through their normal retention cycle.
            </p>
          </section>
          <section>
            <h2>Local data, providers, and subscriptions</h2>
            <p>
              Data stored only on your device may require clearing the game's
              local storage or uninstalling it. Uninstalling alone does not
              remove server records. We can help with relevant providers, while
              providers acting independently may also need a direct request.
            </p>
            <p>
              Account deletion does not automatically cancel an App Store or
              Google Play subscription. Manage subscriptions through the store
              where you subscribed.
            </p>
          </section>
          <section>
            <h2>Other privacy requests</h2>
            <p>
              Use the same email for access, correction, consent withdrawal, or
              advertising opt-outs. See our{" "}
              <Link href="/privacy-policy">Privacy Policy</Link> and{" "}
              <Link href="/do-not-sell">Do not sell or share</Link> page for
              more choices.
            </p>
          </section>
        </article>
      </main>
      <Footer />
    </>
  );
}
