import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Privacy Policy | KeepPlay Engine",
  description:
    "Learn how KeepPlay Engine collects, uses, and protects your personal data. Read our full Privacy Policy.",
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
export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="grow pt-20 sm:pt-24 pb-16 bg-white">
        {/* Header */}
        <div className="bg-linear-to-br from-gray-900 to-gray-800 text-white py-14 sm:py-20 mb-12">
          <div className="max-w-4xl mx-auto px-6 sm:px-8 text-center">
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4">
              Privacy Policy
            </h1>
            <p className="text-gray-300 text-sm sm:text-base max-w-2xl mx-auto">
              Your privacy is important to us. This policy explains how KeepPlay
              Engine and RAVADO TECH LTD collect, use, share, and protect your
              personal data.
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
              <li>
                <a href="#introduction" className="hover:text-[#0BCC0E]">
                  Introduction
                </a>
              </li>
              <li>
                <a href="#controller" className="hover:text-[#0BCC0E]">
                  Data Controller
                </a>
              </li>
              <li>
                <a href="#data-we-collect" className="hover:text-[#0BCC0E]">
                  Data We Collect
                </a>
              </li>
              <li>
                <a href="#how-we-use" className="hover:text-[#0BCC0E]">
                  How We Use Your Data
                </a>
              </li>
              <li>
                <a href="#legal-bases" className="hover:text-[#0BCC0E]">
                  Legal Bases for Processing
                </a>
              </li>
              <li>
                <a href="#cookies" className="hover:text-[#0BCC0E]">
                  Cookies &amp; Similar Technologies
                </a>
              </li>
              <li>
                <a href="#data-sharing" className="hover:text-[#0BCC0E]">
                  Data Sharing &amp; Third Parties
                </a>
              </li>
              <li>
                <a href="#international" className="hover:text-[#0BCC0E]">
                  International Data Transfers
                </a>
              </li>
              <li>
                <a href="#retention" className="hover:text-[#0BCC0E]">
                  Data Retention
                </a>
              </li>
              <li>
                <a href="#security" className="hover:text-[#0BCC0E]">
                  Data Security
                </a>
              </li>
              <li>
                <a href="#your-rights" className="hover:text-[#0BCC0E]">
                  Your Rights
                </a>
              </li>
              <li>
                <a href="#children" className="hover:text-[#0BCC0E]">
                  Children&apos;s Privacy
                </a>
              </li>
              <li>
                <a href="#push-notifications" className="hover:text-[#0BCC0E]">
                  Push Notifications
                </a>
              </li>
              <li>
                <a href="#rewards-payouts" className="hover:text-[#0BCC0E]">
                  Rewards &amp; Payouts
                </a>
              </li>
              <li>
                <a href="#automated-decisions" className="hover:text-[#0BCC0E]">
                  Automated Decision-Making
                </a>
              </li>
              <li>
                <a href="#california" className="hover:text-[#0BCC0E]">
                  Additional Notice for California Residents
                </a>
              </li>
              <li>
                <a href="#us-state-rights" className="hover:text-[#0BCC0E]">
                  Additional Notice for Other US State Residents
                </a>
              </li>
              <li>
                <a href="#uk-eea" className="hover:text-[#0BCC0E]">
                  UK &amp; EEA Specific Rights (GDPR / UK GDPR)
                </a>
              </li>
              <li>
                <a href="#changes" className="hover:text-[#0BCC0E]">
                  Changes to This Policy
                </a>
              </li>
              <li>
                <a href="#contact-us" className="hover:text-[#0BCC0E]">
                  Contact Us
                </a>
              </li>
            </ol>
          </nav>

          {/* -------------------------------------------------------- */}
          {/* 1. INTRODUCTION                                          */}
          {/* -------------------------------------------------------- */}
          <Section id="introduction" title="1. Introduction">
            <p>
              Welcome to KeepPlay Engine (the &ldquo;App&rdquo;,
              &ldquo;Platform&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or
              &ldquo;our&rdquo;). The App is operated by{" "}
              <strong>RAVADO TECH LTD</strong>, a company registered in England
              &amp; Wales with its registered office at 71–75 Shelton Street,
              Covent Garden, London, WC2H 9JQ, United Kingdom.
            </p>
            <p>
              This Privacy Policy describes how we collect, use, store, share,
              and protect personal data when you download, install, access, or
              use the KeepPlay Engine mobile application, website, and any
              related services (collectively, the &ldquo;Services&rdquo;).
            </p>
            <p>
              By using our Services you acknowledge that you have read and
              understood this Privacy Policy. If you do not agree with the
              practices described herein, please do not use our Services.
            </p>
          </Section>

          {/* -------------------------------------------------------- */}
          {/* 2. DATA CONTROLLER                                       */}
          {/* -------------------------------------------------------- */}
          <Section id="controller" title="2. Data Controller">
            <p>
              For the purposes of applicable data-protection legislation
              (including the UK GDPR, EU GDPR, and the Data Protection Act
              2018), the data controller is:
            </p>
            <address className="not-italic bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm">
              <strong>RAVADO TECH LTD</strong>
              <br />
              71–75 Shelton Street, Covent Garden
              <br />
              London, WC2H 9JQ
              <br />
              United Kingdom
              <br />
              <br />
              Email:{" "}
              <a
                href="mailto:privacy@keepplayengine.com"
                className="text-[#0BCC0E] hover:underline"
              >
                privacy@keepplayengine.com
              </a>
            </address>
          </Section>

          {/* -------------------------------------------------------- */}
          {/* 3. DATA WE COLLECT                                       */}
          {/* -------------------------------------------------------- */}
          <Section id="data-we-collect" title="3. Data We Collect">
            <SubSection title="3.1 Information You Provide Directly">
              <ul className="list-disc list-inside space-y-2">
                <li>
                  <strong>Account &amp; Profile Data</strong> — name, email
                  address, username, password, profile picture, and other
                  details you supply during sign-up or later in your account
                  settings.
                </li>
                <li>
                  <strong>Payout Information</strong> — when you redeem rewards,
                  we may collect information necessary to process payments (e.g.
                  PayPal email, postal address) through our third-party payment
                  partners.
                </li>
                <li>
                  <strong>Communications</strong> — any messages, feedback, or
                  support requests you send to us.
                </li>
              </ul>
            </SubSection>

            <SubSection title="3.2 Information Collected Automatically">
              <ul className="list-disc list-inside space-y-2">
                <li>
                  <strong>Device Information</strong> — device model, operating
                  system, unique device identifiers (e.g. Android Advertising ID
                  or iOS IDFA/IDFV), screen resolution, and language settings.
                </li>
                <li>
                  <strong>Usage Data</strong> — in-app activity, gameplay
                  progress, feature interactions, session duration, referral
                  sources, coins earned, and rewards redeemed.
                </li>
                <li>
                  <strong>Log &amp; Network Data</strong> — IP address, browser
                  type, access times, pages viewed, referring URLs, and HTTP
                  status codes.
                </li>
                <li>
                  <strong>Location Data</strong> — approximate geographic
                  location derived from your IP address. We do not collect
                  precise GPS location unless you explicitly grant permission.
                </li>
              </ul>
            </SubSection>

            <SubSection title="3.3 Information from Third Parties">
              <p>
                We may receive limited data from app stores (e.g. download
                statistics, crash logs), analytics providers, advertising
                networks, and our game-studio partners to improve the Services
                and prevent fraud.
              </p>
            </SubSection>
          </Section>

          {/* -------------------------------------------------------- */}
          {/* 4. HOW WE USE YOUR DATA                                  */}
          {/* -------------------------------------------------------- */}
          <Section id="how-we-use" title="4. How We Use Your Data">
            <p>We process your personal data for the following purposes:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>
                <strong>Providing &amp; Improving the Services</strong> —
                operating the App, delivering game content, tracking loyalty
                rewards, processing payouts, and developing new features.
              </li>
              <li>
                <strong>Account Management</strong> — creating and managing your
                account, authenticating you, and providing customer support.
              </li>
              <li>
                <strong>Personalisation</strong> — tailoring content, game
                recommendations, and reward offers to your preferences and
                usage.
              </li>
              <li>
                <strong>Analytics &amp; Research</strong> — understanding how
                users interact with the App, measuring performance, conducting
                aggregated research, and optimising user experience.
              </li>
              <li>
                <strong>Security &amp; Fraud Prevention</strong> — detecting,
                investigating, and preventing fraudulent, unauthorised, or
                illegal activity, including multi-account abuse.
              </li>
              <li>
                <strong>Communications</strong> — sending service-related
                messages (e.g. payout confirmations, security alerts) and, where
                you have opted in, promotional communications.
              </li>
              <li>
                <strong>Advertising</strong> — displaying contextual or
                interest-based ads within the App via third-party ad networks,
                where permitted.
              </li>
              <li>
                <strong>Legal Compliance</strong> — fulfilling legal and
                regulatory obligations, responding to lawful requests, and
                enforcing our Terms of Service.
              </li>
            </ul>
          </Section>

          {/* -------------------------------------------------------- */}
          {/* 5. LEGAL BASES                                           */}
          {/* -------------------------------------------------------- */}
          <Section id="legal-bases" title="5. Legal Bases for Processing">
            <p>
              Where applicable law requires a legal basis, we rely on one or
              more of the following:
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>
                <strong>Performance of a contract</strong> — processing
                necessary to provide the Services you requested (e.g. account
                creation, reward payouts).
              </li>
              <li>
                <strong>Consent</strong> — where you have given clear,
                affirmative consent (e.g. push notifications, marketing emails,
                optional analytics). You may withdraw consent at any time.
              </li>
              <li>
                <strong>Legitimate interests</strong> — processing necessary for
                our legitimate business interests (e.g. fraud prevention, App
                improvement, direct marketing to existing users) provided those
                interests are not overridden by your rights.
              </li>
              <li>
                <strong>Legal obligation</strong> — where processing is
                necessary to comply with a legal or regulatory requirement.
              </li>
            </ul>
          </Section>

          {/* -------------------------------------------------------- */}
          {/* 6. COOKIES                                               */}
          {/* -------------------------------------------------------- */}
          <Section id="cookies" title="6. Cookies & Similar Technologies">
            <p>
              Our website and App may use cookies, local storage, SDKs, and
              similar technologies for the following purposes:
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>
                <strong>Strictly Necessary</strong> — essential for the
                technical operation of our Services (e.g. session management,
                authentication tokens).
              </li>
              <li>
                <strong>Analytics &amp; Performance</strong> — help us
                understand usage patterns and improve the Services.
              </li>
              <li>
                <strong>Advertising</strong> — used by third-party ad networks
                to deliver interest-based ads and measure ad effectiveness.
              </li>
            </ul>
            <p>
              You can manage cookie preferences in your browser or device
              settings at any time. Note that disabling certain cookies may
              affect the functionality of the Services.
            </p>
          </Section>

          {/* -------------------------------------------------------- */}
          {/* 7. DATA SHARING                                          */}
          {/* -------------------------------------------------------- */}
          <Section id="data-sharing" title="7. Data Sharing & Third Parties">
            <p>
              We do not sell your personal data. We may share information in the
              following limited circumstances:
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>
                <strong>Service Providers</strong> — trusted vendors that help
                us operate the Services (hosting, analytics, payment
                processing, email delivery, customer support). These providers
                are contractually bound to process data only on our
                instructions.
              </li>
              <li>
                <strong>Game &amp; Advertising Partners</strong> — game
                publishers, ad networks, and attribution providers that
                participate in our loyalty ecosystem to deliver content and
                measure campaign performance, in compliance with applicable law.
              </li>
              <li>
                <strong>Legal &amp; Safety</strong> — law enforcement,
                regulators, or other parties when disclosure is required by law,
                legal process, or is necessary to protect the rights, property,
                or safety of RAVADO TECH LTD, our users, or the public.
              </li>
              <li>
                <strong>Business Transfers</strong> — in connection with a
                merger, acquisition, restructuring, or sale of assets, your data
                may be transferred as part of that transaction. We will notify
                you of any such change.
              </li>
              <li>
                <strong>With Your Consent</strong> — when you have given
                explicit permission for a specific disclosure.
              </li>
            </ul>
          </Section>

          {/* -------------------------------------------------------- */}
          {/* 8. INTERNATIONAL TRANSFERS                               */}
          {/* -------------------------------------------------------- */}
          <Section id="international" title="8. International Data Transfers">
            <p>
              RAVADO TECH LTD is based in the United Kingdom. Your personal data
              may be transferred to, and processed in, countries outside the UK
              and the European Economic Area (EEA) that may not provide the same
              level of data-protection.
            </p>
            <p>
              Where such transfers occur, we implement appropriate safeguards,
              including:
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>
                Standard Contractual Clauses (SCCs) approved by the European
                Commission or the UK&apos;s International Data Transfer
                Agreement (IDTA).
              </li>
              <li>
                Adequacy decisions where the destination country has been
                recognised as providing adequate protection.
              </li>
              <li>
                Additional technical and organisational measures as needed.
              </li>
            </ul>
          </Section>

          {/* -------------------------------------------------------- */}
          {/* 9. RETENTION                                             */}
          {/* -------------------------------------------------------- */}
          <Section id="retention" title="9. Data Retention">
            <p>
              We retain personal data only for as long as necessary to fulfil
              the purposes for which it was collected, including to satisfy
              legal, regulatory, accounting, or reporting requirements. When
              determining retention periods we consider:
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>
                The nature and sensitivity of the data and the potential risk of
                harm from unauthorised use or disclosure.
              </li>
              <li>
                The purposes for which we process the data and whether we can
                achieve those purposes through other means.
              </li>
              <li>
                Applicable legal, regulatory, tax, accounting, or other
                requirements.
              </li>
            </ul>
            <p>
              When you delete your account, we will delete or anonymise your
              personal data within a reasonable period, unless retention is
              required by law.
            </p>
          </Section>

          {/* -------------------------------------------------------- */}
          {/* 10. SECURITY                                            */}
          {/* -------------------------------------------------------- */}
          <Section id="security" title="10. Data Security">
            <p>
              We take the security of your personal data seriously and implement
              appropriate technical and organisational measures to protect it
              against unauthorised access, alteration, disclosure, or
              destruction. These measures include, but are not limited to:
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>Encryption of data in transit (TLS/HTTPS) and at rest.</li>
              <li>
                Access controls limited to authorised personnel on a
                need-to-know basis.
              </li>
              <li>
                Regular security assessments of our infrastructure and
                third-party providers.
              </li>
              <li>
                Secure coding practices and vulnerability management.
              </li>
            </ul>
            <p>
              While we strive to protect your data, please note that no method
              of transmission over the internet or electronic storage is 100%
              secure. We encourage you to help keep your account safe by using
              a strong password and not sharing your credentials.
            </p>
          </Section>

          {/* -------------------------------------------------------- */}
          {/* 11. YOUR RIGHTS                                         */}
          {/* -------------------------------------------------------- */}
          <Section id="your-rights" title="11. Your Rights">
            <p>
              Depending on your jurisdiction, you may have some or all of the
              following rights regarding your personal data:
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>
                <strong>Access</strong> — request confirmation of whether we
                process your personal data and obtain a copy of it.
              </li>
              <li>
                <strong>Rectification</strong> — request correction of
                inaccurate or incomplete personal data.
              </li>
              <li>
                <strong>Erasure (&ldquo;Right to be Forgotten&rdquo;)</strong>{" "}
                — request deletion of your personal data, subject to lawful
                exceptions.
              </li>
              <li>
                <strong>Restriction of Processing</strong> — request that we
                limit the processing of your data under certain circumstances.
              </li>
              <li>
                <strong>Data Portability</strong> — receive the personal data
                you provided to us in a structured, commonly used,
                machine-readable format.
              </li>
              <li>
                <strong>Object</strong> — object to processing based on
                legitimate interests or for direct-marketing purposes.
              </li>
              <li>
                <strong>Withdraw Consent</strong> — withdraw consent at any
                time. Withdrawal does not affect the lawfulness of processing
                that occurred before it.
              </li>
              <li>
                <strong>Lodge a Complaint</strong> — file a complaint with your
                local data-protection authority (in the UK, the Information
                Commissioner&apos;s Office — ico.org.uk).
              </li>
            </ul>
            <p>
              To exercise any of these rights, email us at{" "}
              <a
                href="mailto:privacy@keepplayengine.com"
                className="text-[#0BCC0E] hover:underline"
              >
                privacy@keepplayengine.com
              </a>
              . We will respond within the time frame required by applicable
              law.
            </p>
          </Section>

          {/* -------------------------------------------------------- */}
          {/* 12. CHILDREN                                             */}
          {/* -------------------------------------------------------- */}
          <Section id="children" title="12. Children's Privacy">
            <p>
              The Services are not intended for children under the age of 16
              (or the applicable minimum age in your jurisdiction). We do not
              knowingly collect personal data from children. If we become aware
              that we have collected personal data from a child without
              verifiable parental consent, we will take steps to delete that
              information promptly. If you believe a child has provided us with
              personal data, please contact us at{" "}
              <a
                href="mailto:privacy@keepplayengine.com"
                className="text-[#0BCC0E] hover:underline"
              >
                privacy@keepplayengine.com
              </a>
              .
            </p>
          </Section>

          {/* -------------------------------------------------------- */}
          {/* 13. PUSH NOTIFICATIONS                                   */}
          {/* -------------------------------------------------------- */}
          <Section id="push-notifications" title="13. Push Notifications">
            <p>
              With your permission, we may send push notifications to inform
              you about:
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>Changes to your earnings or reward status.</li>
              <li>Reminders related to your account activity.</li>
              <li>New features, games, or App updates.</li>
              <li>Promotional offers and special events.</li>
            </ul>
            <p>
              You can opt in or out of push notifications at any time through
              your device settings. Disabling notifications will not affect core
              functionality of the App.
            </p>
          </Section>

          {/* -------------------------------------------------------- */}
          {/* 14. REWARDS & PAYOUTS                                    */}
          {/* -------------------------------------------------------- */}
          <Section id="rewards-payouts" title="14. Rewards & Payouts">
            <p>
              When you redeem coins or loyalty rewards, additional personal data
              may be required to process your payout (e.g. full name, email
              address, or postal address). This data is shared with our
              third-party payment partners solely for the purpose of fulfilling
              your redemption.
            </p>
            <p>
              We do not directly process or store sensitive payment information
              such as bank account or credit-card numbers. All transactions are
              handled by our authorised payment providers under their own
              privacy policies.
            </p>
            <p>
              Your payout history is retained so that you can track your
              earnings. This is based on our legitimate interest in providing a
              transparent and convenient experience.
            </p>
          </Section>

          {/* -------------------------------------------------------- */}
          {/* 15. AUTOMATED DECISION-MAKING                            */}
          {/* -------------------------------------------------------- */}
          <Section
            id="automated-decisions"
            title="15. Automated Decision-Making"
          >
            <p>
              For fraud detection and prevention purposes, certain criteria —
              such as IP address, device fingerprint, and usage patterns — may
              be evaluated automatically. If multiple indicators suggest
              fraudulent behaviour, your account may be restricted or suspended.
            </p>
            <p>
              Such processing is necessary for the performance of our contract
              with you and our legitimate interest in maintaining Platform
              integrity. You have the right to request human review of any
              automated decision that significantly affects you.
            </p>
          </Section>

          {/* -------------------------------------------------------- */}
          {/* 16. CALIFORNIA                                           */}
          {/* -------------------------------------------------------- */}
          <Section
            id="california"
            title="16. Additional Notice for California Residents (CCPA / CPRA)"
          >
            <p>
              If you are a California resident, the California Consumer Privacy
              Act and the California Privacy Rights Act grant you additional
              rights:
            </p>
            <SubSection title="16.1 Categories of Personal Information">
              <p>
                We may collect the following categories as defined by the CCPA:
                identifiers, internet or electronic network activity, geolocation data, commercial
                information, and inferences drawn from the above.
              </p>
            </SubSection>
            <SubSection title="16.2 Your California Rights">
              <ul className="list-disc list-inside space-y-2">
                <li>
                  <strong>Right to Know</strong> — request the categories and
                  specific pieces of personal information we have collected.
                </li>
                <li>
                  <strong>Right to Delete</strong> — request deletion of
                  personal information, subject to exceptions.
                </li>
                <li>
                  <strong>Right to Correct</strong> — request correction of
                  inaccurate personal information.
                </li>
                <li>
                  <strong>Right to Opt-Out of Sale / Sharing</strong> — we do
                  not sell personal information. If we share data for
                  cross-context behavioural advertising, you may opt out via
                  the settings in the App or by emailing us.
                </li>
                <li>
                  <strong>Right to Non-Discrimination</strong> — we will not
                  discriminate against you for exercising your CCPA rights.
                </li>
              </ul>
            </SubSection>
            <SubSection title="16.3 Exercising Your Rights">
              <p>
                To submit a request, email{" "}
                <a
                  href="mailto:privacy@keepplayengine.com"
                  className="text-[#0BCC0E] hover:underline"
                >
                  privacy@keepplayengine.com
                </a>{" "}
                with the subject line &ldquo;California Privacy Rights
                Request.&rdquo; We may need to verify your identity before
                processing your request. You may also designate an authorised
                agent to act on your behalf.
              </p>
            </SubSection>
            <SubSection title="16.4 &ldquo;Shine the Light&rdquo;">
              <p>
                California&apos;s &ldquo;Shine the Light&rdquo; law permits
                California residents to request information about our disclosure
                of personal information to third parties for their direct
                marketing purposes. To make such a request, contact us at the
                email above with &ldquo;Shine the Light Request&rdquo; in the
                subject line.
              </p>
            </SubSection>
          </Section>

          {/* -------------------------------------------------------- */}
          {/* 17. OTHER US STATE RIGHTS                                */}
          {/* -------------------------------------------------------- */}
          <Section
            id="us-state-rights"
            title="17. Additional Notice for Other US State Residents"
          >
            <p>
              Residents of US states with comprehensive privacy laws (e.g.
              Colorado, Connecticut, Virginia, Utah, Oregon, Texas, Delaware,
              Montana, Iowa, and others as they come into effect) may have
              additional rights, including:
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>
                <strong>Right to Confirm &amp; Access</strong> — confirm
                whether we are processing your personal data and obtain a copy.
              </li>
              <li>
                <strong>Right to Delete</strong> — request deletion of your
                personal data.
              </li>
              <li>
                <strong>Right to Correct</strong> — request correction of
                inaccuracies.
              </li>
              <li>
                <strong>Right to Opt-Out</strong> — opt out of the sale of
                personal data and targeted advertising.
              </li>
              <li>
                <strong>Right to Appeal</strong> — appeal our response to your
                request.
              </li>
            </ul>
            <p>
              To exercise these rights, email{" "}
              <a
                href="mailto:privacy@keepplayengine.com"
                className="text-[#0BCC0E] hover:underline"
              >
                privacy@keepplayengine.com
              </a>
              . We will verify your identity and respond within the legally
              required time frame. You will not be discriminated against for
              exercising your rights.
            </p>
          </Section>

          {/* -------------------------------------------------------- */}
          {/* 18. UK & EEA SPECIFIC                                    */}
          {/* -------------------------------------------------------- */}
          <Section
            id="uk-eea"
            title="18. UK & EEA Specific Rights (GDPR / UK GDPR)"
          >
            <p>
              If you are located in the United Kingdom or the European Economic
              Area, the General Data Protection Regulation (GDPR) and the UK
              GDPR apply to our processing of your data. In addition to the
              rights described in Section 11 above, you have the right to:
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>
                Lodge a complaint with the Information Commissioner&apos;s
                Office (ICO) in the UK or your local supervisory authority in
                the EEA.
              </li>
              <li>
                Request details of the safeguards we apply when transferring
                data outside the UK/EEA (see Section 8).
              </li>
              <li>
                Object to processing of your data where we rely on legitimate
                interests as the legal basis.
              </li>
            </ul>
            <p>
              The data controller address and contact email are listed in
              Section 2. We aim to resolve any concerns directly, but you always
              retain the right to approach your supervisory authority.
            </p>
          </Section>

          {/* -------------------------------------------------------- */}
          {/* 19. CHANGES                                              */}
          {/* -------------------------------------------------------- */}
          <Section id="changes" title="19. Changes to This Policy">
            <p>
              We may update this Privacy Policy from time to time to reflect
              changes in our practices, technology, legal requirements, or other
              factors. When we make material changes, we will:
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>
                Update the &ldquo;Last updated&rdquo; date at the top of this
                page.
              </li>
              <li>
                Notify you via in-app notification, email, or a prominent
                notice on our website, as appropriate.
              </li>
            </ul>
            <p>
              We encourage you to review this Privacy Policy periodically. Your
              continued use of the Services after the effective date of any
              changes constitutes acceptance of the updated policy.
            </p>
          </Section>

          {/* -------------------------------------------------------- */}
          {/* 20. CONTACT US                                           */}
          {/* -------------------------------------------------------- */}
          <Section id="contact-us" title="20. Contact Us">
            <p>
              If you have any questions, concerns, or requests regarding this
              Privacy Policy or our data practices, please contact us:
            </p>
            <address className="not-italic bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm">
              <strong>RAVADO TECH LTD</strong>
              <br />
              71–75 Shelton Street, Covent Garden
              <br />
              London, WC2H 9JQ
              <br />
              United Kingdom
              <br />
              <br />
              Email:{" "}
              <a
                href="mailto:privacy@keepplayengine.com"
                className="text-[#0BCC0E] hover:underline"
              >
                privacy@keepplayengine.com
              </a>
            </address>
            <p className="mt-4 text-sm text-gray-500">
              We will endeavour to respond to all legitimate enquiries within
              one month. Occasionally it may take longer if your request is
              particularly complex or you have made multiple requests, in which
              case we will notify you of the extension.
            </p>
          </Section>
        </article>
      </main>

      <Footer />
    </div>
  );
}
