import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";

const columns = [
  {
    title: "Explore",
    links: [
      { label: "The studio", href: "/#studio" },
      { label: "Our playground", href: "/#playground" },
      { label: "Publishing", href: "/#publishing" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "The essentials",
    links: [
      { label: "Privacy policy", href: "/privacy-policy" },
      { label: "Terms of service", href: "/terms-of-service" },
      { label: "Cookie policy", href: "/cookie-policy" },
    ],
  },
  {
    title: "Your privacy",
    links: [
      { label: "Do not sell or share", href: "/do-not-sell" },
      { label: "Data & account deletion", href: "/delete-my-account" },
      { label: "Cookie settings", href: "/cookie-settings" },
    ],
  },
];
export default function Footer() {
  return (
    <footer className="kpe-footer">
      <div className="kpe-container">
        <div className="kpe-footer-grid">
          <div className="kpe-footer-brand">
            <Link
              href="/"
              className="kpe-brand"
              aria-label="KeepPlay Engine home"
            >
              <Image
                src="/KPE_Banner_v3.png"
                alt="KeepPlay Engine"
                width={1024}
                height={500}
                className="kpe-banner-logo"
                sizes="(max-width: 520px) 145px, 220px"
              />
            </Link>
            <p>
              Big ideas. Small screens.
              <br />
              Mobile games development &amp; publishing.
            </p>
            <a href="mailto:business@keepplayengine.com">
              Let&rsquo;s make games{" "}
              <ArrowUpRight size={17} aria-hidden="true" />
            </a>
          </div>
          {columns.map((column) => (
            <div key={column.title}>
              <h2>{column.title}</h2>
              <ul>
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="kpe-footer-bottom">
          <p>
            © {new Date().getFullYear()} KeepPlay Engine. All rights reserved.
          </p>
          <span>Made with a little extra play.</span>
        </div>
      </div>
    </footer>
  );
}
