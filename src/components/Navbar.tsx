"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";

const links = [
  { href: "/privacy-policy", label: "Privacy policy" },
  { href: "/terms-of-service", label: "Terms of service" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        toggle.current?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);
  return (
    <header className="kpe-header">
      <nav className="kpe-container kpe-nav" aria-label="Main navigation">
        <Link
          href="/"
          className="kpe-brand"
          onClick={() => setOpen(false)}
          aria-label="KeepPlay Engine home"
        >
          <Image
            src="/KPE_Banner_v3.png"
            alt="KeepPlay Engine"
            width={1024}
            height={500}
            className="kpe-banner-logo"
            sizes="(max-width: 520px) 145px, 220px"
            priority
          />
        </Link>
        <div className="kpe-desktop-nav">
          {links.map((link) => (
            <Link href={link.href} key={link.href}>
              {link.label}
            </Link>
          ))}
        </div>
        <Link href="/contact" className="kpe-nav-contact">
          Contact <ArrowUpRight size={17} aria-hidden="true" />
        </Link>
        <button
          ref={toggle}
          type="button"
          className="kpe-menu-toggle"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="kpe-mobile-menu"
          onClick={() => setOpen(!open)}
        >
          {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>
        {open && (
          <div id="kpe-mobile-menu" className="kpe-mobile-nav">
            {[...links, { href: "/contact", label: "Let’s talk" }].map(
              (link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                  <ArrowUpRight size={18} aria-hidden="true" />
                </Link>
              ),
            )}
          </div>
        )}
      </nav>
    </header>
  );
}
