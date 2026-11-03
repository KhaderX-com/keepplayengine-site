import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Terms of Service | KeepPlay Engine",
  description: "Terms governing KeepPlay Engine mobile games, website and related services.",
  alternates: { canonical: "/terms-of-service" },
};

const sections = [
  ["introduction", "Introduction"], ["eligibility", "Eligibility and age"],
  ["accounts", "Accounts and security"], ["licence", "Licence and acceptable use"],
  ["purchases", "In-app purchases and virtual items"], ["subscriptions", "Subscriptions"],
  ["refunds", "Refunds and consumer rights"], ["advertising", "Advertising and third-party services"],
  ["privacy", "Privacy and cookies"], ["content", "Intellectual property and user content"],
  ["changes", "Changes to the services and terms"], ["termination", "Suspension and termination"],
  ["liability", "Disclaimers and liability"], ["disputes", "Disputes and applicable law"],
  ["general", "General provisions"], ["contact", "Contact"],
] as const;

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return <section id={id}><h2>{title}</h2>{children}</section>;
}

export default function TermsOfServicePage() {
  return (
    <>
      <Navbar />
      <main className="bg-white">
        <article className="kpe-legal">
          <p className="kpe-eyebrow mb-5">KEEPPLAY ENGINE / PLAYER TERMS</p>
          <h1>Terms of Service</h1>
          <p className="kpe-legal-date">Last updated: 3 November 2026 · Version 3.0</p>
          <div className="kpe-legal-summary"><strong>Terms at a glance.</strong><p>Our games are for personal entertainment. Some may offer advertising, optional purchases or subscriptions. Virtual items have no real-world monetary value. Your privacy choices and applicable consumer rights remain protected.</p></div>
          <nav className="kpe-legal-toc" aria-label="Terms of service contents"><h2>Find what you need</h2><ol>{sections.map(([id, title]) => <li key={id}><a href={`#${id}`}>{title}</a></li>)}</ol></nav>
          <Section id="introduction" title="1. Introduction">
            <p>These Terms of Service (&ldquo;Terms&rdquo;) govern your use of mobile games, applications, keepplayengine.com and related services published or operated by KeepPlay Engine (&ldquo;we&rdquo;, &ldquo;us&rdquo; or &ldquo;our&rdquo;), collectively the &ldquo;Services&rdquo;. Additional terms may apply to a particular game or platform.</p>
            <p>By accessing or using the Services, you agree to these Terms. If you do not agree, do not use them. Our <Link href="/privacy-policy">Privacy Policy</Link> explains how personal information is handled.</p>
          </Section>
          <Section id="eligibility" title="2. Eligibility and age">
            <p>You must meet the applicable age requirements and any age rating or platform restrictions for the Service. If you are a minor, you may use the Services only with your parent or guardian’s permission and supervision where required. Parents and guardians are responsible for reviewing the relevant game and its purchase and advertising features.</p>
          </Section>
          <Section id="accounts" title="3. Accounts and security">
            <p>Some features may require an account. Provide accurate information, protect your credentials and tell us promptly if you suspect unauthorised access. You are responsible for activity under your account to the extent permitted by law. Do not sell, transfer or misuse an account. You may request deletion through our <Link href="/delete-my-account">deletion page</Link>; deletion may result in loss of progress and access to digital items.</p>
          </Section>
          <Section id="licence" title="4. Licence and acceptable use">
            <p>Subject to these Terms, we grant you a limited, personal, non-exclusive, non-transferable and revocable licence to use the Services for non-commercial entertainment. We retain all rights not expressly granted.</p>
            <p>Do not cheat, exploit bugs, use unauthorised software, interfere with the Services, bypass security, harass others, violate their rights, or copy, distribute, modify or reverse engineer the Services except where applicable law permits. Do not use the Services unlawfully or commercially without permission.</p>
          </Section>
          <Section id="purchases" title="5. In-app purchases and virtual items">
            <p>Some games may offer optional purchases of virtual currency, items or features through an authorised app store. Prices and applicable taxes are displayed before purchase. Virtual items are licensed for use within the relevant game, are not property or real money, and cannot be exchanged for real-world value. Availability and use may be subject to platform and game rules.</p>
            <p>Purchases are processed by the platform, whose payment terms also apply. Keep your device and account secure against unauthorised purchases. Nothing in these Terms limits rights granted by applicable consumer law.</p>
          </Section>
          <Section id="subscriptions" title="6. Subscriptions">
            <p>If a Service offers a subscription, its price, duration, renewal and cancellation terms will be shown before you subscribe. Subscriptions may renew automatically unless cancelled through the platform by its stated deadline. Manage or cancel them in the account used to subscribe. Uninstalling a game or deleting an account does not automatically cancel a subscription.</p>
          </Section>
          <Section id="refunds" title="7. Refunds and consumer rights">
            <p>Request refunds through the app store or payment platform used for the purchase, subject to its procedures and applicable law. You may have cancellation, refund or other statutory rights, including rights relating to digital content; these Terms do not exclude or restrict them.</p>
          </Section>
          <Section id="advertising" title="8. Advertising and third-party services">
            <p>Games may display advertisements provided by third-party partners. Some ads or linked services are operated independently and have their own terms and privacy practices. We do not control third-party content. Advertising choices, including consent and opt-out options where applicable, are described in our <Link href="/privacy-policy">Privacy Policy</Link> and available controls.</p>
          </Section>
          <Section id="privacy" title="9. Privacy and cookies">
            <p>Our <Link href="/privacy-policy">Privacy Policy</Link> explains the information we process and your choices. The <Link href="/cookie-policy">Cookie Policy</Link> and <Link href="/cookie-settings">cookie settings</Link> describe website technologies and preferences. Any consent required for optional processing is requested separately.</p>
          </Section>
          <Section id="content" title="10. Intellectual property and user content">
            <p>The Services and their content, including software, artwork, music and trademarks, belong to us or our licensors and are protected by intellectual property laws. These Terms do not transfer ownership to you.</p>
            <p>If a Service lets you submit content, you remain responsible for it and must have the necessary rights. You grant us a non-exclusive, worldwide licence to host, use, reproduce and display that content as reasonably needed to operate, support and improve the Services. Do not submit unlawful or infringing content. We may remove content that violates these Terms or the law.</p>
          </Section>
          <Section id="changes" title="11. Changes to the services and terms">
            <p>We may update, change or discontinue features or Services, for example to improve security, comply with law or maintain compatibility. We may update these Terms and will change the date above and provide notice of material changes where required. Changes apply prospectively; your continued use after they take effect constitutes acceptance where permitted by law. Mandatory consumer rights remain unaffected.</p>
          </Section>
          <Section id="termination" title="12. Suspension and termination">
            <p>You may stop using the Services at any time. We may suspend or terminate access where reasonably necessary, including for serious or repeated violations, fraud, security or legal reasons. Where appropriate and legally permitted, we will provide notice and an opportunity to address the issue. You may contact support to request a review. Provisions that by their nature should survive termination remain in effect.</p>
          </Section>
          <Section id="liability" title="13. Disclaimers and liability">
            <p>We aim to provide reliable Services, but availability, uninterrupted operation and compatibility cannot be guaranteed. To the extent permitted by law, the Services are provided without additional warranties beyond those required by law.</p>
            <p>To the extent permitted by law, we are not liable for indirect or unforeseeable losses arising from use of the Services. Nothing in these Terms excludes or limits liability or statutory rights that cannot lawfully be excluded or limited.</p>
          </Section>
          <Section id="disputes" title="14. Disputes and applicable law">
            <p>Please contact us first so we can try to resolve a concern. Applicable law and courts are determined by the law that applies to your situation. These Terms do not deprive you of mandatory consumer protections or your right to bring a claim before a court where applicable law allows.</p>
          </Section>
          <Section id="general" title="15. General provisions">
            <p>If a provision is unenforceable, the remaining provisions continue to apply. A failure to enforce a provision is not a waiver. These Terms and any applicable game or platform terms govern your use of the Services; mandatory law takes precedence where required.</p>
          </Section>
          <Section id="contact" title="16. Contact">
            <p>For questions about these Terms or our games, email <a href="mailto:support@keepplayengine.com">support@keepplayengine.com</a>. For privacy enquiries, email <a href="mailto:privacy@keepplayengine.com">privacy@keepplayengine.com</a>.</p>
          </Section>
        </article>
      </main>
      <Footer />
    </>
  );
}
