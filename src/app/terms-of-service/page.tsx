import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Terms of Service | KeepPlay Engine",
  description:
    "Read the Terms of Service governing your use of the KeepPlay Engine loyalty app and related services.",
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
export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="grow pt-20 sm:pt-24 pb-16 bg-white">
        {/* Header */}
        <div className="bg-linear-to-br from-gray-900 to-gray-800 text-white py-14 sm:py-20 mb-12">
          <div className="max-w-4xl mx-auto px-6 sm:px-8 text-center">
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4">
              Terms of Service
            </h1>
            <p className="text-gray-300 text-sm sm:text-base max-w-2xl mx-auto">
              These Terms of Service govern your access to and use of the
              KeepPlay Engine application and all related services operated by
              RAVADO TECH LTD.
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
              <li><a href="#acceptance" className="hover:text-[#0BCC0E]">Acceptance of Terms</a></li>
              <li><a href="#eligibility" className="hover:text-[#0BCC0E]">Eligibility</a></li>
              <li><a href="#account" className="hover:text-[#0BCC0E]">Account Registration &amp; Security</a></li>
              <li><a href="#services" className="hover:text-[#0BCC0E]">Description of Services</a></li>
              <li><a href="#loyalty-rewards" className="hover:text-[#0BCC0E]">Loyalty Rewards &amp; Virtual Currency</a></li>
              <li><a href="#payouts" className="hover:text-[#0BCC0E]">Payouts &amp; Redemption</a></li>
              <li><a href="#user-conduct" className="hover:text-[#0BCC0E]">User Conduct &amp; Acceptable Use</a></li>
              <li><a href="#ip" className="hover:text-[#0BCC0E]">Intellectual Property</a></li>
              <li><a href="#user-content" className="hover:text-[#0BCC0E]">User Content</a></li>
              <li><a href="#third-party" className="hover:text-[#0BCC0E]">Third-Party Services &amp; Links</a></li>
              <li><a href="#advertising" className="hover:text-[#0BCC0E]">Advertising</a></li>
              <li><a href="#privacy" className="hover:text-[#0BCC0E]">Privacy</a></li>
              <li><a href="#disclaimers" className="hover:text-[#0BCC0E]">Disclaimers</a></li>
              <li><a href="#limitation" className="hover:text-[#0BCC0E]">Limitation of Liability</a></li>
              <li><a href="#indemnification" className="hover:text-[#0BCC0E]">Indemnification</a></li>
              <li><a href="#termination" className="hover:text-[#0BCC0E]">Termination &amp; Suspension</a></li>
              <li><a href="#modifications" className="hover:text-[#0BCC0E]">Modifications to the Service &amp; Terms</a></li>
              <li><a href="#governing-law" className="hover:text-[#0BCC0E]">Governing Law &amp; Dispute Resolution</a></li>
              <li><a href="#severability" className="hover:text-[#0BCC0E]">Severability</a></li>
              <li><a href="#entire-agreement" className="hover:text-[#0BCC0E]">Entire Agreement</a></li>
              <li><a href="#contact" className="hover:text-[#0BCC0E]">Contact Us</a></li>
            </ol>
          </nav>

          {/* -------------------------------------------------------- */}
          {/* 1. ACCEPTANCE OF TERMS                                   */}
          {/* -------------------------------------------------------- */}
          <Section id="acceptance" title="1. Acceptance of Terms">
            <p>
              By downloading, installing, accessing, or using the KeepPlay
              Engine application (&ldquo;App&rdquo;), website, or any related
              services (collectively, the &ldquo;Services&rdquo;), you agree to
              be bound by these Terms of Service (&ldquo;Terms&rdquo;). If you
              do not agree to all of these Terms, you must not use our Services.
            </p>
            <p>
              These Terms constitute a legally binding agreement between you
              (&ldquo;User&rdquo;, &ldquo;you&rdquo;, or &ldquo;your&rdquo;)
              and <strong>RAVADO TECH LTD</strong> (&ldquo;Company&rdquo;,
              &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;), a
              company registered in England &amp; Wales with its registered
              office at 71–75 Shelton Street, Covent Garden, London, WC2H 9JQ,
              United Kingdom.
            </p>
          </Section>

          {/* -------------------------------------------------------- */}
          {/* 2. ELIGIBILITY                                           */}
          {/* -------------------------------------------------------- */}
          <Section id="eligibility" title="2. Eligibility">
            <p>
              You must be at least 16 years old (or the minimum age required in
              your jurisdiction) to use the Services. By using the Services, you
              represent and warrant that:
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>
                You meet the minimum age requirement in your country or
                territory.
              </li>
              <li>
                You have the legal capacity to enter into a binding agreement.
              </li>
              <li>
                Your use of the Services does not violate any applicable law or
                regulation.
              </li>
              <li>
                Any information you provide to us is accurate, complete, and
                current.
              </li>
            </ul>
            <p>
              If you are using the Services on behalf of an organisation, you
              represent that you have the authority to bind that organisation to
              these Terms.
            </p>
          </Section>

          {/* -------------------------------------------------------- */}
          {/* 3. ACCOUNT REGISTRATION & SECURITY                       */}
          {/* -------------------------------------------------------- */}
          <Section id="account" title="3. Account Registration & Security">
            <p>
              Certain features of the Services require you to create an account.
              When you register, you agree to:
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>
                Provide accurate and truthful information during registration
                and keep it up to date.
              </li>
              <li>
                Maintain the security of your account credentials and not share
                them with anyone.
              </li>
              <li>
                Immediately notify us of any unauthorised use of your account.
              </li>
              <li>
                Accept responsibility for all activities that occur under your
                account, whether or not authorised by you.
              </li>
            </ul>
            <p>
              We reserve the right to disable any account at any time if, in our
              sole discretion, we believe you have violated these Terms.
            </p>
            <SubSection title="3.1 One Account Per User">
              <p>
                Each individual is permitted only one account on the Platform.
                Creating or operating multiple accounts (including via different
                devices, emails, or identities) to gain an unfair advantage or
                circumvent restrictions is strictly prohibited and constitutes
                grounds for immediate termination and forfeiture of all accrued
                rewards.
              </p>
            </SubSection>
          </Section>

          {/* -------------------------------------------------------- */}
          {/* 4. DESCRIPTION OF SERVICES                               */}
          {/* -------------------------------------------------------- */}
          <Section id="services" title="4. Description of Services">
            <p>
              KeepPlay Engine is a play-to-earn loyalty ecosystem that allows
              users to:
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>
                Discover and play games from our partner studios.
              </li>
              <li>
                Earn virtual coins, points, and loyalty rewards through
                gameplay, engagement, and completing in-app activities.
              </li>
              <li>
                Redeem accumulated rewards for gift cards, digital goods, or
                other payout methods as available.
              </li>
              <li>
                Track progress, leaderboards, and reward history through their
                account dashboard.
              </li>
            </ul>
            <p>
              We reserve the right to modify, suspend, or discontinue any aspect
              of the Services at any time, with or without notice. We shall not
              be liable to you or any third party for any such modification,
              suspension, or discontinuation.
            </p>
          </Section>

          {/* -------------------------------------------------------- */}
          {/* 5. LOYALTY REWARDS & VIRTUAL CURRENCY                    */}
          {/* -------------------------------------------------------- */}
          <Section id="loyalty-rewards" title="5. Loyalty Rewards & Virtual Currency">
            <SubSection title="5.1 Nature of Virtual Currency">
              <p>
                Coins, points, and other virtual currencies earned through the
                Services (&ldquo;Virtual Currency&rdquo;) have no real-world
                monetary value and do not constitute currency, property, or any
                form of financial instrument. Virtual Currency is a limited,
                revocable licence granted to you to use within the Platform
                only.
              </p>
            </SubSection>
            <SubSection title="5.2 Earning Rules">
              <p>
                The rate, method, and conditions under which Virtual Currency is
                earned are determined solely by us and may change at any time.
                We reserve the right to adjust earning rates, introduce caps,
                or modify reward structures without prior notice.
              </p>
            </SubSection>
            <SubSection title="5.3 Expiration & Forfeiture">
              <p>
                Virtual Currency may expire if your account is inactive for a
                period determined by us. Additionally, all Virtual Currency is
                forfeited upon account termination for violation of these Terms.
                We are not obligated to provide compensation for expired or
                forfeited Virtual Currency.
              </p>
            </SubSection>
            <SubSection title="5.4 No Transfer or Sale">
              <p>
                Virtual Currency cannot be transferred, sold, traded, or
                exchanged between users. Any attempt to sell, trade, or transfer
                Virtual Currency outside of the Platform is a violation of these
                Terms and may result in account termination.
              </p>
            </SubSection>
          </Section>

          {/* -------------------------------------------------------- */}
          {/* 6. PAYOUTS & REDEMPTION                                  */}
          {/* -------------------------------------------------------- */}
          <Section id="payouts" title="6. Payouts & Redemption">
            <p>
              Subject to meeting the applicable minimum thresholds and
              eligibility requirements, you may redeem Virtual Currency for
              available payout options (e.g. gift cards or digital rewards).
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>
                <strong>Verification</strong> — we may require identity
                verification before processing a payout to prevent fraud.
              </li>
              <li>
                <strong>Processing Time</strong> — payouts are processed within
                a reasonable time frame. Delays may occur due to verification
                requirements, payment-provider processing times, or high
                volumes.
              </li>
              <li>
                <strong>Taxes</strong> — you are solely responsible for any
                taxes, levies, or duties applicable to rewards you receive. We
                do not provide tax advice.
              </li>
              <li>
                <strong>Third-Party Payment Providers</strong> — payouts are
                fulfilled through third-party payment providers. Their terms and
                conditions apply to the processing of your payment. We are not
                responsible for delays or errors caused by such providers.
              </li>
              <li>
                <strong>Reversals</strong> — we reserve the right to reverse or
                withhold any payout if we reasonably suspect fraud, policy
                violation, or errors in the reward calculation.
              </li>
            </ul>
          </Section>

          {/* -------------------------------------------------------- */}
          {/* 7. USER CONDUCT & ACCEPTABLE USE                         */}
          {/* -------------------------------------------------------- */}
          <Section id="user-conduct" title="7. User Conduct & Acceptable Use">
            <p>
              You agree not to use the Services for any purpose that is
              unlawful, harmful, or otherwise objectionable. Specifically, you
              shall not:
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>
                Use bots, scripts, automation tools, emulators, or any
                non-human means to interact with the Services or artificially
                inflate earnings.
              </li>
              <li>
                Create multiple accounts to exploit promotions, referral
                programmes, or reward structures.
              </li>
              <li>
                Attempt to reverse-engineer, decompile, disassemble, or
                otherwise derive source code from the App.
              </li>
              <li>
                Interfere with or disrupt the integrity or performance of the
                Services, servers, or networks.
              </li>
              <li>
                Exploit bugs, glitches, or vulnerabilities in the App for
                personal gain, rather than reporting them to us.
              </li>
              <li>
                Impersonate any person or entity, or misrepresent your
                affiliation with any person or entity.
              </li>
              <li>
                Engage in any activity that constitutes fraud, money
                laundering, or any other financial crime.
              </li>
              <li>
                Use the Services to distribute malware, viruses, or other
                harmful code.
              </li>
              <li>
                Harass, abuse, threaten, or intimidate other users or our staff.
              </li>
              <li>
                Use the Services in any manner that could damage, disable,
                overburden, or impair our infrastructure.
              </li>
            </ul>
            <p>
              Violation of these rules may result in immediate account
              suspension or termination, forfeiture of all accrued rewards, and
              any other remedies available to us under applicable law.
            </p>
          </Section>

          {/* -------------------------------------------------------- */}
          {/* 8. INTELLECTUAL PROPERTY                                  */}
          {/* -------------------------------------------------------- */}
          <Section id="ip" title="8. Intellectual Property">
            <p>
              All content, features, and functionality of the Services —
              including but not limited to text, graphics, logos, icons, images,
              audio, video, software, algorithms, and the overall design — are
              the exclusive property of RAVADO TECH LTD or our licensors and are
              protected by copyright, trademark, trade secret, and other
              intellectual-property laws.
            </p>
            <p>
              We grant you a limited, non-exclusive, non-transferable, revocable
              licence to access and use the Services for your personal,
              non-commercial purposes in accordance with these Terms. This
              licence does not include the right to:
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>
                Modify, reproduce, distribute, or create derivative works based
                on any part of the Services.
              </li>
              <li>
                Use any data-mining, robots, or similar data-gathering methods.
              </li>
              <li>
                Remove, alter, or obscure any copyright, trademark, or other
                proprietary notices.
              </li>
            </ul>
            <p>
              The &ldquo;KeepPlay Engine&rdquo; name, logo, and all related
              names, logos, product and service names, designs, and slogans are
              trademarks of RAVADO TECH LTD. You may not use them without our
              prior written permission.
            </p>
          </Section>

          {/* -------------------------------------------------------- */}
          {/* 9. USER CONTENT                                          */}
          {/* -------------------------------------------------------- */}
          <Section id="user-content" title="9. User Content">
            <p>
              If you submit, post, or transmit any content through the Services
              (including feedback, reviews, usernames, or profile information)
              (&ldquo;User Content&rdquo;), you grant us a worldwide,
              non-exclusive, royalty-free, perpetual, irrevocable licence to
              use, reproduce, modify, adapt, publish, translate, and distribute
              such User Content for the purposes of operating and improving the
              Services.
            </p>
            <p>
              You represent and warrant that you own or have the necessary
              rights to submit User Content and that it does not infringe on
              the rights of any third party or violate any applicable law.
            </p>
            <p>
              We reserve the right, but have no obligation, to monitor, edit, or
              remove User Content that we determine, in our sole discretion,
              violates these Terms or is otherwise objectionable.
            </p>
          </Section>

          {/* -------------------------------------------------------- */}
          {/* 10. THIRD-PARTY SERVICES & LINKS                         */}
          {/* -------------------------------------------------------- */}
          <Section id="third-party" title="10. Third-Party Services & Links">
            <p>
              The Services may contain links to, or integrate with, third-party
              websites, apps, games, or services that are not owned or
              controlled by us. These include partner game studios, payment
              processors, analytics services, and advertising networks.
            </p>
            <p>
              We are not responsible for the content, privacy policies, or
              practices of any third-party services. Your interactions with
              third-party services are governed by their respective terms and
              policies. We encourage you to review their terms before using
              them.
            </p>
            <p>
              Inclusion of any third-party link or integration does not imply
              our endorsement or approval.
            </p>
          </Section>

          {/* -------------------------------------------------------- */}
          {/* 11. ADVERTISING                                          */}
          {/* -------------------------------------------------------- */}
          <Section id="advertising" title="11. Advertising">
            <p>
              The Services may display advertisements from third-party ad
              networks. By using the Services, you agree that we may display
              such advertising. We strive to provide a positive user experience
              and reserve the right to set limits on the types and frequency of
              ads shown.
            </p>
            <p>
              We do not endorse or guarantee the products or services advertised
              and are not responsible for any transactions between you and
              third-party advertisers. Your interaction with advertisements is
              at your own risk.
            </p>
          </Section>

          {/* -------------------------------------------------------- */}
          {/* 12. PRIVACY                                              */}
          {/* -------------------------------------------------------- */}
          <Section id="privacy" title="12. Privacy">
            <p>
              Your privacy is important to us. Our collection, use, and sharing
              of personal data is governed by our{" "}
              <a
                href="/privacy-policy"
                className="text-[#0BCC0E] hover:underline font-medium"
              >
                Privacy Policy
              </a>
              , which is incorporated into these Terms by reference. By using
              the Services, you acknowledge that you have read and understood
              our Privacy Policy.
            </p>
          </Section>

          {/* -------------------------------------------------------- */}
          {/* 13. DISCLAIMERS                                          */}
          {/* -------------------------------------------------------- */}
          <Section id="disclaimers" title="13. Disclaimers">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 text-sm">
              <p className="font-semibold text-gray-900 mb-3">
                THE SERVICES ARE PROVIDED ON AN &ldquo;AS IS&rdquo; AND
                &ldquo;AS AVAILABLE&rdquo; BASIS WITHOUT WARRANTIES OF ANY KIND,
                WHETHER EXPRESS, IMPLIED, OR STATUTORY.
              </p>
              <p>
                TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, WE DISCLAIM
                ALL WARRANTIES, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES
                OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE,
                NON-INFRINGEMENT, AND ANY WARRANTIES ARISING OUT OF COURSE OF
                DEALING OR USAGE OF TRADE.
              </p>
            </div>
            <p>Without limiting the foregoing, we do not warrant that:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>
                The Services will be uninterrupted, timely, secure, or
                error-free.
              </li>
              <li>
                The results obtained from using the Services will be accurate or
                reliable.
              </li>
              <li>
                Any defects or errors in the Services will be corrected.
              </li>
              <li>
                The Services will be free from viruses or other harmful
                components.
              </li>
            </ul>
            <p>
              You acknowledge that you use the Services at your own risk and
              that you are solely responsible for any damage to your device or
              loss of data that results from your use.
            </p>
          </Section>

          {/* -------------------------------------------------------- */}
          {/* 14. LIMITATION OF LIABILITY                               */}
          {/* -------------------------------------------------------- */}
          <Section id="limitation" title="14. Limitation of Liability">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 text-sm">
              <p>
                TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT
                SHALL RAVADO TECH LTD, ITS DIRECTORS, EMPLOYEES, PARTNERS,
                AGENTS, SUPPLIERS, OR AFFILIATES BE LIABLE FOR ANY INDIRECT,
                INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES,
                INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, USE,
                GOODWILL, OR OTHER INTANGIBLE LOSSES, ARISING OUT OF OR
                RELATED TO:
              </p>
              <ul className="list-disc list-inside space-y-2 mt-3">
                <li>Your access to, use of, or inability to use the Services.</li>
                <li>Any conduct or content of any third party on the Services.</li>
                <li>Any content obtained from the Services.</li>
                <li>Unauthorised access, use, or alteration of your data.</li>
              </ul>
            </div>
            <p>
              In jurisdictions that do not allow the exclusion or limitation of
              certain warranties or liabilities, our liability shall be limited
              to the maximum extent permitted by law. In any case, our total
              aggregate liability shall not exceed the amount you have actually
              paid to us (if any) in the twelve (12) months preceding the claim.
            </p>
          </Section>

          {/* -------------------------------------------------------- */}
          {/* 15. INDEMNIFICATION                                      */}
          {/* -------------------------------------------------------- */}
          <Section id="indemnification" title="15. Indemnification">
            <p>
              You agree to indemnify, defend, and hold harmless RAVADO TECH LTD
              and its officers, directors, employees, and agents from and
              against any claims, damages, obligations, losses, liabilities,
              costs, or expenses (including reasonable legal fees) arising from:
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>Your use of and access to the Services.</li>
              <li>Your violation of these Terms.</li>
              <li>
                Your violation of any third-party right, including any
                intellectual-property or privacy right.
              </li>
              <li>
                Any claim that your User Content caused damage to a third party.
              </li>
            </ul>
            <p>
              This indemnification obligation will survive the termination of
              these Terms and your use of the Services.
            </p>
          </Section>

          {/* -------------------------------------------------------- */}
          {/* 16. TERMINATION & SUSPENSION                             */}
          {/* -------------------------------------------------------- */}
          <Section id="termination" title="16. Termination & Suspension">
            <SubSection title="16.1 Termination by You">
              <p>
                You may stop using the Services and delete your account at any
                time through the account settings in the App or by contacting us
                at{" "}
                <a
                  href="mailto:support@keepplayengine.com"
                  className="text-[#0BCC0E] hover:underline"
                >
                  support@keepplayengine.com
                </a>
                . Upon deletion, your account data will be handled in accordance
                with our Privacy Policy.
              </p>
            </SubSection>
            <SubSection title="16.2 Termination or Suspension by Us">
              <p>
                We may suspend or terminate your account and access to the
                Services immediately, without prior notice or liability, for any
                reason, including but not limited to:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>Breach of these Terms.</li>
                <li>Fraudulent or suspected fraudulent activity.</li>
                <li>
                  Conduct that we determine is harmful to other users, the
                  Company, or third parties.
                </li>
                <li>At our sole discretion for any other reason.</li>
              </ul>
            </SubSection>
            <SubSection title="16.3 Effect of Termination">
              <p>
                Upon termination, your right to use the Services ceases
                immediately. All Virtual Currency and accrued rewards that have
                not been redeemed prior to termination will be forfeited and
                cannot be recovered. Sections of these Terms that by their
                nature should survive termination shall remain in full force and
                effect, including, without limitation, Sections 8 (Intellectual
                Property), 13 (Disclaimers), 14 (Limitation of Liability), 15
                (Indemnification), and 18 (Governing Law).
              </p>
            </SubSection>
          </Section>

          {/* -------------------------------------------------------- */}
          {/* 17. MODIFICATIONS                                        */}
          {/* -------------------------------------------------------- */}
          <Section id="modifications" title="17. Modifications to the Service & Terms">
            <SubSection title="17.1 Changes to the Services">
              <p>
                We reserve the right to modify, update, or discontinue any part
                of the Services at any time, including features, reward
                structures, earning rates, games available, and payout options.
                We will endeavour to provide reasonable notice of material
                changes but are not obligated to do so.
              </p>
            </SubSection>
            <SubSection title="17.2 Changes to These Terms">
              <p>
                We may revise these Terms at any time by posting the updated
                version on this page with a revised &ldquo;Last updated&rdquo;
                date. For material changes, we will notify you via in-app
                notification, email, or a prominent notice on our website.
              </p>
              <p>
                Your continued use of the Services after the effective date of
                any revision constitutes your acceptance of the updated Terms.
                If you do not agree with the revised Terms, you must stop using
                the Services and delete your account.
              </p>
            </SubSection>
          </Section>

          {/* -------------------------------------------------------- */}
          {/* 18. GOVERNING LAW & DISPUTE RESOLUTION                   */}
          {/* -------------------------------------------------------- */}
          <Section id="governing-law" title="18. Governing Law & Dispute Resolution">
            <SubSection title="18.1 Governing Law">
              <p>
                These Terms and any dispute arising out of or in connection with
                them shall be governed by and construed in accordance with the
                laws of England and Wales, without regard to its conflict-of-law
                provisions.
              </p>
            </SubSection>
            <SubSection title="18.2 Jurisdiction">
              <p>
                You agree that any legal action or proceeding arising under
                these Terms shall be brought exclusively in the courts of
                England and Wales, and you consent to the personal jurisdiction
                and venue of such courts. Nothing in these Terms shall prevent
                us from seeking injunctive or other equitable relief in any
                court of competent jurisdiction.
              </p>
            </SubSection>
            <SubSection title="18.3 Informal Resolution">
              <p>
                Before filing any formal legal claim, you agree to first attempt
                to resolve the dispute informally by contacting us at{" "}
                <a
                  href="mailto:legal@keepplayengine.com"
                  className="text-[#0BCC0E] hover:underline"
                >
                  legal@keepplayengine.com
                </a>
                . We will try to resolve the matter within 30 days. If the
                dispute is not resolved within that period, either party may
                proceed with formal proceedings.
              </p>
            </SubSection>
            <SubSection title="18.4 Consumer Rights">
              <p>
                Nothing in these Terms affects your statutory rights as a
                consumer under applicable law, including the Consumer Rights Act
                2015 (UK) or equivalent legislation in your jurisdiction. If you
                are an EEA consumer, you may also benefit from any mandatory
                provisions of the law of your country of residence.
              </p>
            </SubSection>
          </Section>

          {/* -------------------------------------------------------- */}
          {/* 19. SEVERABILITY                                         */}
          {/* -------------------------------------------------------- */}
          <Section id="severability" title="19. Severability">
            <p>
              If any provision of these Terms is held to be invalid, illegal, or
              unenforceable by a court of competent jurisdiction, such provision
              shall be modified to the minimum extent necessary to make it
              valid while preserving its original intent. All remaining
              provisions shall continue in full force and effect.
            </p>
          </Section>

          {/* -------------------------------------------------------- */}
          {/* 20. ENTIRE AGREEMENT                                     */}
          {/* -------------------------------------------------------- */}
          <Section id="entire-agreement" title="20. Entire Agreement">
            <p>
              These Terms, together with the{" "}
              <a
                href="/privacy-policy"
                className="text-[#0BCC0E] hover:underline font-medium"
              >
                Privacy Policy
              </a>{" "}
              and any other legal notices or policies published by us on the
              Services, constitute the entire agreement between you and RAVADO
              TECH LTD regarding the use of the Services and supersede all prior
              and contemporaneous understandings, agreements, representations,
              and warranties, both written and oral.
            </p>
            <p>
              No waiver of any term or condition shall be deemed a further or
              continuing waiver of such term or any other term. Our failure to
              assert any right or provision under these Terms shall not
              constitute a waiver of that right or provision.
            </p>
          </Section>

          {/* -------------------------------------------------------- */}
          {/* 21. CONTACT US                                           */}
          {/* -------------------------------------------------------- */}
          <Section id="contact" title="21. Contact Us">
            <p>
              If you have any questions or concerns about these Terms of
              Service, please contact us:
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
              General Enquiries:{" "}
              <a
                href="mailto:support@keepplayengine.com"
                className="text-[#0BCC0E] hover:underline"
              >
                support@keepplayengine.com
              </a>
              <br />
              Legal:{" "}
              <a
                href="mailto:legal@keepplayengine.com"
                className="text-[#0BCC0E] hover:underline"
              >
                legal@keepplayengine.com
              </a>
              <br />
              Privacy:{" "}
              <a
                href="mailto:privacy@keepplayengine.com"
                className="text-[#0BCC0E] hover:underline"
              >
                privacy@keepplayengine.com
              </a>
            </address>
            <p className="mt-4 text-sm text-gray-500">
              We will endeavour to respond to all enquiries within a reasonable
              time frame.
            </p>
          </Section>
        </article>
      </main>

      <Footer />
    </div>
  );
}
