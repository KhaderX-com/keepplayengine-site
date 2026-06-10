import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Privacy Policy | KeepPlay Engine",
  description:
    "Learn how KeepPlay Engine collects, uses, shares, and protects information across our apps, games, websites, and related services.",
};

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mb-10 scroll-mt-28">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
        {title}
      </h2>
      <div className="space-y-4 text-gray-700 leading-relaxed">{children}</div>
    </section>
  );
}

const sections = [
  ["who-we-are", "Who We Are"],
  ["scope", "Scope of This Policy"],
  ["information-we-collect", "Information We May Collect"],
  ["third-party-collection", "Information Collected by Third Parties"],
  ["how-we-use", "How We Use Information"],
  ["legal-bases", "Legal Bases for Processing"],
  ["advertising-analytics", "Advertising, Analytics, and Personalization"],
  ["permissions", "App Permissions"],
  ["children", "Children and Families"],
  ["sharing", "Sharing Information"],
  ["transfers", "International Transfers"],
  ["retention", "Data Retention"],
  ["security", "Security"],
  ["choices-rights", "Your Choices and Rights"],
  ["us-state-rights", "California and Other US State Privacy Notices"],
  ["uk-eea-rights", "European and UK Privacy Rights"],
  ["third-party-links", "Third-Party Links and Services"],
  ["changes", "Changes to This Privacy Policy"],
  ["contact", "Contact Us"],
] as const;

const privacyEmail = "privacy@keepplayengine.com";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="grow pt-20 sm:pt-24 pb-16 bg-white">
        <div className="bg-linear-to-br from-gray-900 to-gray-800 text-white py-14 sm:py-20 mb-12">
          <div className="max-w-4xl mx-auto px-6 sm:px-8 text-center">
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4">
              Privacy Policy
            </h1>
            <p className="text-gray-300 text-sm sm:text-base max-w-2xl mx-auto">
              This policy explains how KeepPlay Engine may collect, use,
              disclose, and protect information in connection with our mobile
              apps, games, websites, and related services.
            </p>
            <p className="mt-4 text-xs text-gray-400">
              Last updated: June 10, 2026
            </p>
          </div>
        </div>

        <article className="max-w-4xl mx-auto px-6 sm:px-8">
          <nav className="mb-12 rounded-xl border border-gray-200 bg-gray-50 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-3">
              Table of Contents
            </h2>
            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
              {sections.map(([id, title]) => (
                <li key={id}>
                  <a href={`#${id}`} className="hover:text-[#0BCC0E]">
                    {title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <Section id="who-we-are" title="1. Who We Are">
            <p>
              This Privacy Policy applies to mobile applications, games,
              websites, support services, loyalty services, and related services
              published or operated by <strong>KeepPlay Engine</strong>, a
              private limited company registered in England and Wales.
            </p>
            <p>
              In this policy, <strong>KeepPlay Engine</strong>, &ldquo;we&rdquo;,
              &ldquo;us&rdquo;, and &ldquo;our&rdquo; refer to the operator of
              the services. The words &ldquo;app&rdquo;, &ldquo;game&rdquo;,
              &ldquo;platform&rdquo;, and &ldquo;service&rdquo; mean any
              KeepPlay Engine mobile application, game, website, loyalty
              product, or related service that links to this Privacy Policy.
            </p>
          </Section>

          <Section id="scope" title="2. Scope of This Policy">
            <p>
              This is a general privacy policy intended to cover KeepPlay Engine
              apps, games, websites, and related services published on Google
              Play, other app stores, and the web. Not every service collects
              every type of information described here.
            </p>
            <p>
              The information actually collected depends on the app or game you
              use, the features you choose, your device settings, your consent
              choices, your account activity, and the third-party services
              included in that product. Where an app, store listing, consent
              screen, permission prompt, or in-app notice gives more specific
              privacy information, that notice should be read together with this
              Privacy Policy.
            </p>
          </Section>

          <Section
            id="information-we-collect"
            title="3. Information We May Collect"
          >
            <ul className="list-disc list-inside space-y-2">
              <li>
                <strong>Information you provide directly</strong>, such as your
                name, email address, username, profile details, support
                messages, feedback, survey answers, account details, display
                name, avatar, payout information, or content you submit through
                an app, game, or website.
              </li>
              <li>
                <strong>Device and technical information</strong>, such as
                device model, operating system, language, region, app version,
                device identifiers, advertising identifiers where permitted, IP
                address, network information, crash logs, diagnostics,
                performance data, and security logs.
              </li>
              <li>
                <strong>App, gameplay, and loyalty information</strong>, such
                as installation events, session activity, games played, levels
                completed, scores, achievements, virtual items, coin balances,
                rewards, redemption history, settings, feature usage, tutorial
                progress, and interactions with in-app content.
              </li>
              <li>
                <strong>Purchase, reward, and payout information</strong>, such
                as products purchased, subscription status, transaction
                identifiers, reward eligibility, payout method, purchase
                validation data, and payment status. Payments made through app
                stores or payment providers are processed by those providers; we
                do not receive your full payment card details.
              </li>
              <li>
                <strong>Advertising and analytics information</strong>, such as
                ad impressions, ad clicks, campaign attribution, approximate
                location inferred from IP address, consent status, and
                aggregated usage statistics.
              </li>
              <li>
                <strong>Location information</strong>, if a feature needs it
                and you grant permission. Some services may infer approximate
                location from your IP address even when precise location
                permission is not requested.
              </li>
              <li>
                <strong>User-generated content</strong>, if a service allows
                it, such as profile information, usernames, messages, comments,
                saved creations, uploaded media, or other materials you choose
                to share.
              </li>
              <li>
                <strong>Children&apos;s information</strong> only where
                permitted by applicable law and relevant platform policies. Apps
                directed to children, or apps with a child audience, are handled
                with additional care as described below.
              </li>
            </ul>
          </Section>

          <Section
            id="third-party-collection"
            title="4. Information Collected by Third Parties"
          >
            <p>
              Our apps, games, and websites may use third-party service
              providers, SDKs, and platform services for hosting, analytics,
              crash reporting, advertising, attribution, fraud prevention,
              payments, app store services, leaderboards, achievements, cloud
              saves, push notifications, age screening, parental controls, and
              customer support.
            </p>
            <p>
              These third parties may collect information directly from your
              device under their own privacy policies. Depending on the product,
              these providers may include app store operators, advertising
              networks, analytics providers, crash reporting tools, cloud
              infrastructure providers, payment processors, and customer support
              platforms.
            </p>
            <p>
              We aim to use service providers that support appropriate privacy,
              security, and platform compliance requirements. For child-directed
              products, we aim to use only child-appropriate providers and
              advertising SDKs allowed by applicable law and platform rules.
            </p>
          </Section>

          <Section id="how-we-use" title="5. How We Use Information">
            <ul className="list-disc list-inside space-y-2">
              <li>
                To provide, maintain, update, secure, and improve our apps,
                games, websites, loyalty services, and support services.
              </li>
              <li>
                To save progress, enable gameplay features, provide rewards,
                operate accounts, deliver cloud saves, process in-app purchases,
                manage subscriptions, validate reward activity, and restore
                purchases.
              </li>
              <li>
                To respond to support requests, investigate bugs, troubleshoot
                errors, and communicate service-related notices.
              </li>
              <li>
                To analyze performance, understand feature usage, improve
                design, test updates, prevent crashes, and develop new
                services.
              </li>
              <li>
                To provide advertising, measure ad performance, limit repetitive
                ads, prevent ad fraud, and, where permitted, personalize ads
                based on your consent choices and applicable law.
              </li>
              <li>
                To maintain safety and integrity, prevent cheating, fraud,
                misuse, unauthorized access, illegal activity, and violations of
                our Terms of Service.
              </li>
              <li>
                To comply with legal obligations, enforce our rights, respond to
                lawful requests, and meet app store policy requirements.
              </li>
            </ul>
          </Section>

          <Section id="legal-bases" title="6. Legal Bases for Processing">
            <p>
              Where UK GDPR, EU GDPR, or similar privacy laws apply, we rely on
              one or more legal bases depending on the activity. These may
              include performance of a contract, legitimate interests, consent,
              compliance with a legal obligation, and protection of vital
              interests where relevant.
            </p>
            <p>
              Examples include using information to provide a game, app, or
              reward feature you requested; relying on consent for certain
              advertising, analytics, or optional permissions; processing
              support messages to respond to you; and keeping records needed for
              legal, payment, tax, security, or fraud prevention purposes.
            </p>
          </Section>

          <Section
            id="advertising-analytics"
            title="7. Advertising, Analytics, and Personalization"
          >
            <p>
              Some KeepPlay Engine apps and games may show ads. Ads may be
              contextual, based on the app or game content, or personalized
              where allowed by law, platform rules, your age status, and your
              consent choices.
            </p>
            <p>
              Advertising partners may use device identifiers, advertising
              identifiers, IP address, app activity, and other signals to
              deliver, measure, and improve ads. You can reset or limit use of
              your device advertising identifier through your device settings,
              and some apps may also provide in-app consent controls.
            </p>
            <p>
              Analytics tools help us understand how our apps, games, and
              websites are used. We use analytics to improve performance,
              balance gameplay, fix problems, detect abuse, and make better
              product decisions. Where possible, analytics reports are
              aggregated or limited to what is necessary.
            </p>
          </Section>

          <Section id="permissions" title="8. App Permissions">
            <p>
              Some apps or games may request device permissions, such as
              storage, notifications, camera, microphone, location, photos,
              contacts, Bluetooth, or other permissions. The exact permissions
              depend on the product and feature.
            </p>
            <p>
              We request permissions only where they support an app or game
              feature, legal compliance, safety, fraud prevention, or service
              operation. You can usually manage permissions in your device
              settings. If you disable a permission, some features may not work
              correctly.
            </p>
          </Section>

          <Section id="children" title="9. Children and Families">
            <p>
              Some KeepPlay Engine apps and games may be intended for general
              audiences, while others may be suitable for children or families.
              We design and operate child-directed products with additional
              privacy protections and in line with applicable laws and platform
              requirements, including rules relating to children, advertising,
              data collection, and parental consent.
            </p>
            <p>
              For child-directed apps or games, we do not knowingly collect more
              personal information from children than is reasonably necessary
              for the relevant product, and we avoid interest-based advertising
              to children where prohibited. If we learn that we have collected
              personal information from a child in a way that does not comply
              with applicable requirements, we will take appropriate steps to
              delete or handle that information lawfully.
            </p>
            <p>
              Parents or guardians may contact us at{" "}
              <a
                href={`mailto:${privacyEmail}`}
                className="text-[#0BCC0E] hover:underline"
              >
                {privacyEmail}
              </a>{" "}
              to ask questions or request review, correction, or deletion of a
              child&apos;s personal information where applicable.
            </p>
          </Section>

          <Section id="sharing" title="10. Sharing Information">
            <ul className="list-disc list-inside space-y-2">
              <li>
                We may share information with service providers that help us
                operate, host, analyze, advertise, secure, support, and improve
                our apps, games, websites, and services.
              </li>
              <li>
                We may share information with app store operators and payment
                processors for purchases, subscriptions, refunds, rewards,
                payouts, fraud prevention, tax, and account-related services.
              </li>
              <li>
                We may share information with advertising and analytics partners
                where permitted by law, app store rules, and your consent
                choices.
              </li>
              <li>
                We may disclose information if required by law, legal process,
                government request, or to protect rights, safety, security,
                users, or the public.
              </li>
              <li>
                We may transfer information as part of a merger, acquisition,
                financing, restructuring, sale of assets, or similar business
                transaction, subject to appropriate protections.
              </li>
            </ul>
          </Section>

          <Section id="transfers" title="11. International Transfers">
            <p>
              KeepPlay Engine is based in the United Kingdom, and our service
              providers may process information in the United Kingdom, European
              Economic Area, United States, and other countries. Privacy laws in
              those countries may differ from the laws where you live.
            </p>
            <p>
              Where required, we use appropriate safeguards for international
              transfers, such as contractual protections or other lawful
              transfer mechanisms.
            </p>
          </Section>

          <Section id="retention" title="12. Data Retention">
            <p>
              We keep personal information only for as long as reasonably
              necessary for the purposes described in this Privacy Policy,
              including to provide services, maintain records, resolve disputes,
              enforce agreements, meet legal obligations, and protect our
              legitimate interests.
            </p>
            <p>
              Retention periods vary depending on the type of information,
              product, user settings, legal requirements, and operational needs.
              For example, support emails may be kept for customer service
              records, crash logs may be kept for a limited troubleshooting
              period, and purchase, reward, and payout records may be kept as
              required for accounting, tax, fraud prevention, or compliance
              purposes.
            </p>
          </Section>

          <Section id="security" title="13. Security">
            <p>
              We use reasonable technical and organizational measures designed
              to protect information against unauthorized access, loss, misuse,
              alteration, or disclosure. No method of transmission or storage is
              completely secure, so we cannot guarantee absolute security.
            </p>
            <p>
              You are responsible for keeping your device, account credentials,
              app store account, and payout account secure.
            </p>
          </Section>

          <Section id="choices-rights" title="14. Your Choices and Rights">
            <p>
              Depending on where you live, you may have rights to access,
              correct, delete, restrict, object to, or receive a copy of your
              personal information. You may also have the right to withdraw
              consent where processing is based on consent.
            </p>
            <p>
              You can manage many choices through your device settings, app
              settings, Google Play or app store account settings, advertising
              ID settings, consent prompts, and permission controls.
            </p>
            <p>
              To make a privacy request, contact us at{" "}
              <a
                href={`mailto:${privacyEmail}`}
                className="text-[#0BCC0E] hover:underline"
              >
                {privacyEmail}
              </a>
              . We may need to verify your request before responding. Some
              information may be retained where required or permitted by law.
            </p>
          </Section>

          <Section
            id="us-state-rights"
            title="15. California and Other US State Privacy Notices"
          >
            <p>
              Where applicable US state privacy laws apply, residents may have
              rights to know, access, correct, delete, opt out of certain
              sharing or targeted advertising, limit use of sensitive personal
              information, and appeal a decision.
            </p>
            <p>
              We do not sell personal information for money, but some
              advertising or analytics activities may be considered
              &ldquo;sharing&rdquo;, &ldquo;targeted advertising&rdquo;, or a
              &ldquo;sale&rdquo; under certain laws. You may exercise applicable
              rights by contacting us at{" "}
              <a
                href={`mailto:${privacyEmail}`}
                className="text-[#0BCC0E] hover:underline"
              >
                {privacyEmail}
              </a>{" "}
              and by using device or in-app privacy controls where available.
            </p>
          </Section>

          <Section
            id="uk-eea-rights"
            title="16. European and UK Privacy Rights"
          >
            <p>
              If UK GDPR or EU GDPR applies, you may have rights to access,
              rectification, erasure, restriction, portability, objection, and
              withdrawal of consent. You may also have the right to lodge a
              complaint with a data protection authority.
            </p>
            <p>
              For the United Kingdom, the supervisory authority is the
              Information Commissioner&apos;s Office. You can contact us first
              at{" "}
              <a
                href={`mailto:${privacyEmail}`}
                className="text-[#0BCC0E] hover:underline"
              >
                {privacyEmail}
              </a>{" "}
              so we can try to resolve your concern.
            </p>
          </Section>

          <Section
            id="third-party-links"
            title="17. Third-Party Links and Services"
          >
            <p>
              Our apps, games, and websites may link to third-party websites,
              app stores, social platforms, ads, games, payment providers, or
              services. We are not responsible for the privacy practices of
              third parties. Their privacy policies apply to their services.
            </p>
          </Section>

          <Section id="changes" title="18. Changes to This Privacy Policy">
            <p>
              We may update this Privacy Policy from time to time. When we make
              changes, we will update the &ldquo;Last updated&rdquo; date. If
              changes are material, we may provide additional notice where
              appropriate, such as through an app, website, store listing, or
              email.
            </p>
            <p>
              Your continued use of our apps, games, websites, or services
              after an updated policy becomes effective means you acknowledge
              the updated policy, where permitted by law.
            </p>
          </Section>

          <Section id="contact" title="19. Contact Us">
            <p>
              If you have questions, requests, or concerns about this Privacy
              Policy or our privacy practices, contact KeepPlay Engine:
            </p>
            <address className="not-italic bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm">
              <strong>KeepPlay Engine</strong>
              <br />
              71-75 Shelton Street, Covent Garden
              <br />
              London, WC2H 9JQ
              <br />
              United Kingdom
              <br />
              <br />
              Privacy:{" "}
              <a
                href={`mailto:${privacyEmail}`}
                className="text-[#0BCC0E] hover:underline"
              >
                {privacyEmail}
              </a>
              <br />
              General Support:{" "}
              <a
                href="mailto:support@keepplayengine.com"
                className="text-[#0BCC0E] hover:underline"
              >
                support@keepplayengine.com
              </a>
            </address>
            <p className="text-sm text-gray-500">
              This general policy is designed for KeepPlay Engine apps, games,
              websites, and loyalty services. App-specific disclosures in app
              stores, in-app notices, consent prompts, and permission prompts
              must accurately reflect the data practices of each individual
              product.
            </p>
            <p className="text-sm text-gray-500">
              Please also read our{" "}
              <Link
                href="/terms-of-service"
                className="text-[#0BCC0E] hover:underline"
              >
                Terms of Service
              </Link>
              .
            </p>
          </Section>
        </article>
      </main>

      <Footer />
    </div>
  );
}
