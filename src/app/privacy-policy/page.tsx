import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Privacy Policy | KeepPlay Engine",
  description:
    "How KeepPlay Engine handles gameplay, device, advertising, purchase and support information, and how to exercise your privacy and deletion rights.",
  alternates: { canonical: "/privacy-policy" },
};

const sections = [
  ["who-we-are", "About this policy"],
  ["scope", "Services covered"],
  ["information-we-collect", "Information we collect"],
  ["third-party-collection", "SDKs and providers"],
  ["how-we-use", "How information is used"],
  ["legal-bases", "Legal bases"],
  ["advertising-analytics", "Advertising, analytics and consent"],
  ["permissions", "Device permissions"],
  ["children", "Children and families"],
  ["sharing", "Who receives information"],
  ["transfers", "International transfers"],
  ["retention", "Retention and deletion"],
  ["security", "Security"],
  ["choices-rights", "Choices and requests"],
  ["us-state-rights", "US state rights"],
  ["uk-eea-rights", "EEA, UK and Swiss rights"],
  ["third-party-links", "External services"],
  ["changes", "Policy updates"],
  ["contact", "Contact us"],
  ["purchases", "Purchases, subscriptions and rewards"],
  ["cookies", "Cookies and local storage"],
  ["notifications", "Notifications"],
  ["automated-decisions", "Fraud prevention and automated decisions"],
  ["game-disclosures", "Game-specific disclosures"],
] as const;

function PrivacyEmail() {
  return (
    <a href="mailto:privacy@keepplayengine.com">privacy@keepplayengine.com</a>
  );
}
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
    <section id={id}>
      <h2>{title}</h2>
      {children}
    </section>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <>
      <Navbar />
      <main className="bg-white">
        <article className="kpe-legal">
          <p className="kpe-eyebrow mb-5">KEEPPLAY ENGINE / PLAYER PRIVACY</p>
          <h1>Privacy Policy</h1>
          <p className="kpe-legal-date">
            Last updated: 28 October 2026 · Version 2.0
          </p>
          <div className="kpe-legal-summary">
            <strong>Your privacy, at a glance.</strong>
            <p>
              Games can process gameplay, device, diagnostic, purchase and
              advertising information, depending on their features and your
              choices. Optional tracking needs the permissions and consent
              required by law and your platform. You can request access,
              correction or deletion, and opt out of targeted advertising.
              Contact <PrivacyEmail />.
            </p>
            <p className="mt-3">
              <Link href="/delete-my-account">
                Request data or account deletion
              </Link>{" "}
              · <Link href="/do-not-sell">Do not sell or share</Link> ·{" "}
              <Link href="/cookie-settings">Website cookie settings</Link>
            </p>
          </div>
          <p>
            This policy explains information practices for KeepPlay Engine
            games, apps, websites and related services. It is a notice, not a
            request for consent. Installing a game, continuing to play or
            reading this policy does not by itself give permission for optional
            tracking.
          </p>
          <nav className="kpe-legal-toc" aria-label="Privacy policy contents">
            <h2>Find what you need</h2>
            <ol>
              {sections.map(([id, title]) => (
                <li key={id}>
                  <a href={`#${id}`}>{title}</a>
                </li>
              ))}
            </ol>
          </nav>

          <Section id="who-we-are" title="1. About this policy">
            <p>
              <strong>KeepPlay Engine</strong> (&ldquo;we&rdquo;,
              &ldquo;us&rdquo; or &ldquo;our&rdquo;) is the mobile games
              development and publishing studio responsible for services that
              link to this policy. We determine the purposes and means of
              personal information we process as controller. Our privacy contact
              is <PrivacyEmail />; player support is{" "}
              <a href="mailto:support@keepplayengine.com">
                support@keepplayengine.com
              </a>
              .
            </p>
            <p>
              Personal information includes information that identifies you or
              can reasonably be linked to you or your device. Hashed
              identifiers, advertising IDs, IP addresses and pseudonymous player
              IDs can still be personal information. Truly anonymised
              information that cannot reasonably be linked back to a person is
              different.
            </p>
          </Section>
          <Section id="scope" title="2. Services covered">
            <p>
              This policy covers games and applications published by KeepPlay
              Engine that link to it, keepplayengine.com, support, playtests and
              related services. Where offered, account, loyalty, reward and
              payout features are also covered. Their inclusion does not mean
              every game has those features.
            </p>
            <p>
              Actual collection depends on the title, version, platform,
              country, features, SDKs, permissions, age status and choices. Read
              a game's in-app notices and store disclosures alongside this
              policy. A general policy does not authorise every category of
              collection in every game or replace required in-app disclosure and
              consent.
            </p>
          </Section>
          <Section
            id="information-we-collect"
            title="3. Information we collect"
          >
            <div className="kpe-legal-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Category and source</th>
                    <th>Examples, when applicable</th>
                    <th>Purposes</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Information you provide</td>
                    <td>
                      Support email, name, messages, feedback, survey answers
                      and submitted screenshots.
                    </td>
                    <td>
                      Respond to requests, investigate problems and improve
                      experiences.
                    </td>
                  </tr>
                  <tr>
                    <td>Accounts and player profiles</td>
                    <td>
                      Player ID, username, avatar, login-provider identifier,
                      account email and preferences.
                    </td>
                    <td>
                      Sign-in, saved progress, access restoration and optional
                      social features.
                    </td>
                  </tr>
                  <tr>
                    <td>Device and connection</td>
                    <td>
                      IP address, device model, operating system, app version,
                      language, network type and approximate region.
                    </td>
                    <td>
                      Content delivery, compatibility, security and performance.
                    </td>
                  </tr>
                  <tr>
                    <td>Gameplay and diagnostics</td>
                    <td>
                      Sessions, levels, scores, achievements, interactions,
                      virtual items, crash traces, load times and errors.
                    </td>
                    <td>
                      Gameplay, progress, troubleshooting and game improvement.
                    </td>
                  </tr>
                  <tr>
                    <td>Ads and attribution</td>
                    <td>
                      Advertising ID where permitted, consent signals,
                      impressions, clicks, rewarded-ad completion, campaign and
                      install events.
                    </td>
                    <td>
                      Ad delivery, measurement, attribution, invalid-traffic
                      detection and permitted personalisation.
                    </td>
                  </tr>
                  <tr>
                    <td>Transactions and rewards</td>
                    <td>
                      Receipts, purchase tokens, order IDs, subscription status,
                      balances, redemption history, payout destination and
                      status.
                    </td>
                    <td>
                      Purchase fulfilment, entitlements, fraud prevention and
                      eligible rewards.
                    </td>
                  </tr>
                  <tr>
                    <td>Optional features</td>
                    <td>
                      Content you share, notification token, communication
                      preferences and age band where needed.
                    </td>
                    <td>
                      Requested features, communications and age-appropriate
                      settings.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>
              Sources include you, your device, service logs, app stores,
              sign-in or payment providers and SDKs in the relevant title.
              Partners may report ad interactions and campaign attribution. For
              store-processed purchases, we do not receive full payment-card
              details.
            </p>
            <p>
              We do not require health records, identity documents or precise
              location for ordinary casual gameplay. Please do not include
              sensitive information in support requests. A separate feature
              requiring protected data must explain its purpose and obtain the
              necessary permissions and consent before collection.
            </p>
            <p>
              Advertising IDs can be reset or deleted through platform controls.
              App-instance and vendor identifiers may support essential features
              or permitted analytics; they must not bypass tracking restrictions
              or recreate deleted advertising IDs.
            </p>
          </Section>
          <Section id="third-party-collection" title="4. SDKs and providers">
            <p>
              SDKs are software components integrated into apps. They may send
              data directly from a device to a provider even if we do not
              receive the raw data. Depending on the title, they support
              game-engine services, ad mediation, analytics, diagnostics,
              sign-in, cloud saves, notifications or payments.
            </p>
            <p>
              Different game projects use different monetisation systems,
              including CAS.ai and Yodo1. This does not mean every provider or
              supported network is active in every release. Each title's notices
              must identify its actual integrations and material data practices.
              Provider information is available here:
            </p>
            <ul>
              <li>
                <a
                  href="https://cas.ai/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  CAS.ai privacy policy
                </a>{" "}
                — mediation and participating networks.
              </li>
              <li>
                <a
                  href="https://www.yodo1.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Yodo1 privacy information
                </a>{" "}
                — monetisation services where integrated.
              </li>
              <li>
                <a
                  href="https://unity.com/legal/game-player-and-app-user-privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Unity game player privacy policy
                </a>{" "}
                — Unity services where enabled.
              </li>
              <li>
                <a
                  href="https://firebase.google.com/support/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Firebase privacy information
                </a>{" "}
                — Firebase features where enabled.
              </li>
              <li>
                <a
                  href="https://policies.google.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Google privacy policy
                </a>{" "}
                and{" "}
                <a
                  href="https://www.apple.com/legal/privacy/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Apple privacy policy
                </a>{" "}
                — platform services.
              </li>
            </ul>
            <p>
              These links explain provider practices, not a blanket list of
              active SDKs. Mediation can involve additional ad networks and
              measurement partners. A game's disclosures must identify relevant
              recipients, purposes and choices. We remain responsible for how we
              integrate and configure third-party code.
            </p>
          </Section>
          <Section id="how-we-use" title="5. How information is used">
            <ul>
              <li>
                Operate games, load content, save progress and provide requested
                account features.
              </li>
              <li>
                Validate purchases, restore entitlements and process eligible
                rewards or payouts.
              </li>
              <li>
                Respond to support, diagnose crashes, investigate bugs and
                improve performance.
              </li>
              <li>
                Understand gameplay and test improvements, subject to applicable
                analytics consent requirements.
              </li>
              <li>
                Deliver and measure ads, attribute installs and provide
                personalisation only where permitted.
              </li>
              <li>
                Protect accounts, detect cheating and invalid ad activity,
                investigate fraud and enforce rules.
              </li>
              <li>
                Apply consent choices, age protections and legal requirements.
              </li>
            </ul>
            <p>
              Incompatible new uses require an appropriate legal basis and
              additional notice or consent where required. A description of
              possible features is not permission to collect unnecessary
              information.
            </p>
          </Section>
          <Section id="legal-bases" title="6. Legal bases">
            <p>
              Where EU or UK GDPR applies, the basis depends on the purpose:
            </p>
            <ul>
              <li>
                <strong>Contract:</strong> information necessary to deliver a
                game, account, purchase or service you request.
              </li>
              <li>
                <strong>Consent:</strong> optional tracking, personalised
                advertising, non-essential cookies or analytics, and other
                processing requiring consent. You may withdraw consent without
                affecting earlier lawful processing.
              </li>
              <li>
                <strong>Legitimate interests:</strong> proportionate security,
                fraud prevention, support or improvement where our interests are
                not overridden by your rights. You may object. This basis does
                not replace consent where required.
              </li>
              <li>
                <strong>Legal obligations:</strong> records and disclosures
                required by applicable accounting, tax, consumer or regulatory
                duties.
              </li>
            </ul>
            <p>
              When information is necessary for a requested feature, we explain
              the consequence of not providing it. Declining an optional
              permission does not authorise unrelated collection.
            </p>
          </Section>
          <Section
            id="advertising-analytics"
            title="7. Advertising, analytics and consent"
          >
            <h3>Ads and mediation</h3>
            <p>
              Some games include banner, interstitial or rewarded ads.
              Contextual ads use session circumstances or content; personalised
              ads may use identifiers and activity across services. Contextual
              advertising can still process an IP address, device information
              and ad events: it does not mean no information is collected.
            </p>
            <p>
              Ad mediation may offer an ad opportunity to participating networks
              or bidders. Requests can include an app identifier, technical
              information, approximate location, consent and age signals, and an
              advertising ID where permitted. Integrated networks and their
              roles must be reflected in that game's disclosures.
            </p>
            <h3>Consent and platform choices</h3>
            <p>
              Optional processing must wait for valid consent where required.
              Tracking covered by Apple's App Tracking Transparency additionally
              requires Apple's permission. One permission does not replace
              another. A refusal must not be bypassed with fingerprinting,
              another identifier or another SDK.
            </p>
            <ul>
              <li>
                <strong>In a game:</strong> use its privacy or advertising
                controls where available. If you cannot find them, contact{" "}
                <PrivacyEmail /> with the title.
              </li>
              <li>
                <strong>iOS:</strong> manage app tracking in device privacy
                settings.
              </li>
              <li>
                <strong>Android:</strong> manage advertising ID and ad privacy
                choices in device settings; labels vary by version and
                manufacturer.
              </li>
              <li>
                <strong>Website:</strong> use{" "}
                <Link href="/cookie-settings">Cookie settings</Link>. Website
                choices do not automatically change a game's SDK settings.
              </li>
              <li>
                <strong>Targeted advertising:</strong> use{" "}
                <Link href="/do-not-sell">Do not sell or share</Link> or email
                us. Choices may need to be applied separately on another device
                or game.
              </li>
            </ul>
            <p>
              Withdrawal affects future processing, not automatic erasure of
              past data. You can separately request deletion. Rewarded ads are
              optional where offered; viewing one for a reward is not consent to
              unrelated tracking.
            </p>
            <h3>Analytics and attribution</h3>
            <p>
              Tools can record sessions, progression, feature use, performance
              and errors. Attribution can associate an install with a campaign.
              These help us improve games, with the notice and consent required
              for the specific collection. An aggregated report does not mean
              its underlying events were anonymous.
            </p>
          </Section>
          <Section id="permissions" title="8. Device permissions">
            <p>
              Permissions must relate to a feature: notifications may use a push
              token, and sharing a screenshot may use a system photo picker.
              Ordinary gameplay does not itself require contacts, microphone,
              camera or precise location access.
            </p>
            <p>
              For features requiring protected access, we explain what is
              accessed and why, and request permission before access. A
              prominent in-app disclosure and separate consent are also needed
              where legally required. Revoke permissions in device settings; the
              related feature may stop working.
            </p>
          </Section>
          <Section id="children" title="9. Children and families">
            <p>
              Audience and eligibility are game-specific. A store content rating
              is not parental consent. Local rules differ: US COPPA generally
              concerns children under 13, while the age for a child's own
              consent to certain online processing in Europe can range from 13
              to 16.
            </p>
            <p>
              A child-directed game, or a player known to be a child, requires
              additional protections: minimising collection, disabling
              behavioural advertising and inappropriate profiling, and obtaining
              verifiable parental consent where required. Only SDKs and
              configurations permitted for that audience and platform may be
              used. Age screening must not encourage children to claim an older
              age.
            </p>
            <p>
              Some providers prohibit use for children. Such a provider must be
              excluded for child users; switching to contextual ads alone is not
              sufficient. This policy cannot replace child-safe technical
              configuration.
            </p>
            <p>
              Parents or guardians may request review, correction or deletion of
              a child's information, or withdraw authorisation, by contacting{" "}
              <PrivacyEmail /> with the title. We use proportionate
              verification. If information was collected without required
              authorisation, we take steps to stop processing and delete it,
              subject to lawful requirements.
            </p>
          </Section>
          <Section id="sharing" title="10. Who receives information">
            <ul>
              <li>
                <strong>Service providers:</strong> hosting, storage, support,
                authentication and diagnostics providers acting under
                instructions and appropriate protections.
              </li>
              <li>
                <strong>Ad and analytics partners:</strong> integrations in the
                relevant title, subject to consent, age restrictions and
                opt-outs. Some act as independent controllers, not our
                processors.
              </li>
              <li>
                <strong>Platforms and payment providers:</strong> stores, login
                services and payout processors needed for your chosen features.
              </li>
              <li>
                <strong>Other players:</strong> information you choose to make
                public through an available leaderboard or social feature.
              </li>
              <li>
                <strong>Legal recipients:</strong> where necessary to comply
                with law, valid legal process, or protect rights and safety.
              </li>
              <li>
                <strong>A successor operator:</strong> in a genuine transfer of
                a service, subject to safeguards and required notice.
              </li>
            </ul>
            <p>
              We do not sell information for money. Certain advertising
              disclosures may constitute sale, sharing or targeted advertising
              under broader state-law definitions; see section 15. A provider's
              separate policy does not remove our responsibility for disclosures
              to it.
            </p>
          </Section>
          <Section id="transfers" title="11. International transfers">
            <p>
              Providers may process information outside your country, including
              in the EEA, UK, US and other locations where they operate.
              Protections may differ.
            </p>
            <p>
              Restricted transfers require an appropriate mechanism, such as
              adequacy, EU Standard Contractual Clauses, or the applicable UK
              agreement or addendum, with supplementary measures where needed.
              Data Privacy Framework certification applies only to eligible
              recipients and covered transfers; not all providers are certified.
            </p>
            <p>
              Ask <PrivacyEmail /> about the safeguards applicable to your
              information and relevant details, subject to necessary redactions.
            </p>
          </Section>
          <Section id="retention" title="12. Retention and deletion">
            <p>
              Retention depends on the purpose, feature, account status, last
              activity, support history, legal recordkeeping, dispute periods
              and fraud risks. We delete or anonymise information when no longer
              needed. A single fixed period would not accurately describe all
              services and providers.
            </p>
            <ul>
              <li>
                <strong>Accounts and progress:</strong> while needed for the
                feature, until deletion or applicable inactivity cleanup.
              </li>
              <li>
                <strong>Support:</strong> for handling requests and a reasonable
                follow-up or dispute period.
              </li>
              <li>
                <strong>Diagnostics, analytics and ads:</strong> according to
                the purpose and relevant service's retention configuration;
                independent providers may have separate periods.
              </li>
              <li>
                <strong>Purchases, payouts and fraud records:</strong> for legal
                recordkeeping or documented necessity, with restricted use.
              </li>
              <li>
                <strong>Backups:</strong> through normal backup rotation, with
                protection against restarting ordinary processing after
                deletion.
              </li>
            </ul>
            <p>
              <Link href="/delete-my-account">Request deletion here</Link> or
              email <PrivacyEmail />. Account deletion includes associated
              personal information, subject to specific lawful exceptions;
              deactivation alone is not deletion. If information must be
              retained, we explain the category, reason and period or criteria.
            </p>
            <p>
              Uninstalling removes some local data but does not automatically
              erase server records, cancel subscriptions or delete information
              independently held by a provider. We can help identify the
              relevant records.
            </p>
          </Section>
          <Section id="security" title="13. Security">
            <p>
              We use reasonable technical and organisational measures
              appropriate to the information, including access restrictions,
              authentication, secure transport and operational safeguards.
              Providers receiving information are expected to protect it
              appropriately. No service guarantees absolute security.
            </p>
            <p>
              We assess personal data incidents and notify affected people and
              authorities where required by the applicable law. Protect your
              device and credentials, and report suspected account misuse to
              support.
            </p>
          </Section>
          <Section id="choices-rights" title="14. Choices and privacy requests">
            <p>
              Depending on your location, rights include access, correction,
              deletion, portability, restriction, objection and consent
              withdrawal. You can also manage device permissions, notifications,
              tracking and website cookies. We do not penalise people for
              exercising legal privacy rights.
            </p>
            <p>
              Email <PrivacyEmail /> with your request, title, platform and
              account email or player ID if available. No new account or
              reinstallation is required. Do not send passwords, full card
              details or unnecessary identity documents.
            </p>
            <p>
              We may ask for proportionate verification to locate records and
              protect ownership. Authorised agents may act where permitted with
              appropriate evidence. If we cannot identify records, we explain
              the limitation rather than collecting excessive new information.
            </p>
            <p>
              GDPR requests are generally answered within one month, with up to
              two additional months where lawfully necessary and notified.
              Applicable US state requests generally have a 45-day period,
              extendable by another 45 days where permitted and explained. Local
              deadlines and exceptions apply. Refusals explain the reason and
              available appeal or complaint routes.
            </p>
          </Section>
          <Section
            id="us-state-rights"
            title="15. California and other US state rights"
          >
            <p>
              Where applicable, rights include knowing categories and specific
              information, sources, purposes and recipients; access, correction,
              deletion and portability; and opting out of sale, sharing or
              targeted advertising. Sections 3, 5 and 10 describe categories and
              purposes, including for the preceding 12 months to the extent
              processed by the relevant service.
            </p>
            <p>
              Use <Link href="/do-not-sell">Do not sell or share</Link>,
              available in-game controls or <PrivacyEmail />. Global Privacy
              Control and similar signals apply in the browser context where
              detected and legally applicable; they cannot automatically change
              a separate mobile app's SDK settings.
            </p>
            <p>
              We do not use sensitive information to infer characteristics for
              advertising. You may exercise applicable rights to limit sensitive
              information. We do not knowingly sell or share children's
              information for targeted advertising without legally required
              authorisation.
            </p>
            <p>
              Where your state provides an appeal, email us with &ldquo;Privacy
              request appeal&rdquo;. We review it within the applicable period.
              You may also contact your state attorney general or competent
              regulator.
            </p>
          </Section>
          <Section id="uk-eea-rights" title="16. EEA, UK and Swiss rights">
            <p>
              Applicable European laws provide rights including access,
              rectification, erasure, restriction, portability, objection and
              withdrawal. You may object to legitimate-interest processing and
              direct marketing. Contact <PrivacyEmail /> to exercise rights or
              ask about a purpose's legal basis.
            </p>
            <p>
              You may complain directly to your local authority without first
              contacting us. See the{" "}
              <a
                href="https://ico.org.uk/make-a-complaint/"
                target="_blank"
                rel="noopener noreferrer"
              >
                UK Information Commissioner's Office
              </a>
              ,{" "}
              <a
                href="https://www.edpb.europa.eu/about-edpb/about-edpb/members_en"
                target="_blank"
                rel="noopener noreferrer"
              >
                EEA supervisory authorities
              </a>{" "}
              or{" "}
              <a
                href="https://www.edoeb.admin.ch/en"
                target="_blank"
                rel="noopener noreferrer"
              >
                Swiss Federal Data Protection and Information Commissioner
              </a>
              .
            </p>
          </Section>
          <Section id="third-party-links" title="17. External services">
            <p>
              Ads, links, stores and third-party sign-in or payment services may
              take you outside our services. Their operators provide separate
              policies. Review these before sharing information. Our
              responsibility for disclosures and SDK integrations remains as
              explained above.
            </p>
          </Section>
          <Section id="changes" title="18. Policy updates">
            <p>
              We update the date and version when this policy changes. Material
              changes are communicated through an appropriate channel where
              required. Changes requiring consent will not rely on continued
              play alone.
            </p>
            <p>
              Version 2.0 expands game, SDK, consent, children's privacy,
              retention, purchase and request disclosures. Publishing a revision
              does not itself install an SDK, implement an age gate or enable
              collection.
            </p>
          </Section>
          <Section id="contact" title="19. Contact us">
            <p>
              <strong>KeepPlay Engine</strong> — mobile games development and
              publishing.
            </p>
            <ul>
              <li>
                Privacy and data requests: <PrivacyEmail />
              </li>
              <li>
                Player support:{" "}
                <a href="mailto:support@keepplayengine.com">
                  support@keepplayengine.com
                </a>
              </li>
              <li>
                Publishing:{" "}
                <a href="mailto:business@keepplayengine.com">
                  business@keepplayengine.com
                </a>
              </li>
              <li>
                <Link href="/delete-my-account">
                  Web-based data and account deletion instructions
                </Link>
              </li>
            </ul>
            <p>
              Identify the affected title and platform so we can direct your
              request appropriately.
            </p>
          </Section>
          <Section
            id="purchases"
            title="20. Purchases, subscriptions and rewards"
          >
            <p>
              Store purchases and subscriptions are processed by the platform.
              We may receive tokens, order references, product, entitlement,
              status and time to deliver content, restore purchases, address
              refunds and detect fraud. We do not receive full card credentials.
            </p>
            <p>
              Reward or payout features, where offered, can process eligibility,
              reward activity, balances, redemption history, payout method and
              destination details. Games without these features do not need this
              information. Processors receive information necessary for their
              role and obligations.
            </p>
            <p>
              Manage subscriptions through the store or provider where you
              subscribed. Uninstalling or requesting deletion does not
              automatically cancel a subscription.
            </p>
          </Section>
          <Section id="cookies" title="21. Cookies and local storage">
            <p>
              Essential website storage supports authentication, security and
              cookie preferences. Read the{" "}
              <Link href="/cookie-policy">Cookie Policy</Link>. Optional
              categories default to off in our consent configuration; manage
              them through <Link href="/cookie-settings">Cookie settings</Link>.
            </p>
            <p>
              Apps use local storage and SDK technologies for progress,
              settings, consent and permitted identifiers. Website preferences
              do not automatically apply inside a game. Clearing storage may
              reset progress or preferences and show consent prompts again.
            </p>
          </Section>
          <Section id="notifications" title="22. Notifications">
            <p>
              Push notifications, where enabled, use a device registration token
              and platform delivery service. Disable them in device settings.
              Service messages may concern purchases, security or support.
              Optional marketing needs applicable permissions and provides a way
              to stop future messages.
            </p>
            <p>
              Withdrawing marketing permission does not prevent essential
              support responses or operational account notices.
            </p>
          </Section>
          <Section
            id="automated-decisions"
            title="23. Fraud prevention and automated decisions"
          >
            <p>
              Integrity systems may flag unusual activity, failed access,
              invalid ads, impossible gameplay or suspicious transactions.
              Processing must be proportionate and must not evade tracking
              refusal.
            </p>
            <p>
              If an automated restriction affects your account, rewards or
              purchase, contact support for an explanation and review. Where law
              gives rights concerning solely automated decisions with legal or
              similarly significant effects, you may request human intervention
              and contest the decision.
            </p>
          </Section>
          <Section id="game-disclosures" title="24. Game-specific disclosures">
            <p>
              Each released title needs accurate information about its actual
              SDKs and recipients, data and purposes, consent flow, audience,
              age protections, retention and deletion method. Google Play Data
              safety and Apple's App Privacy details must match the released
              build and SDK configuration.
            </p>
            <p>
              A policy cannot replace an in-app disclosure, consent control,
              deletion feature, parental safeguard or accurate store
              declaration. Contact us if you find a discrepancy so we can
              investigate and correct it.
            </p>
            <p>
              Related pages:{" "}
              <Link href="/terms-of-service">Terms of Service</Link>,{" "}
              <Link href="/cookie-policy">Cookie Policy</Link>,{" "}
              <Link href="/do-not-sell">Do not sell or share</Link> and{" "}
              <Link href="/delete-my-account">Data and account deletion</Link>.
            </p>
          </Section>
        </article>
      </main>
      <Footer />
    </>
  );
}
