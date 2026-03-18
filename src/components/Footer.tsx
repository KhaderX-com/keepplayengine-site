import Link from "next/link";

export default function Footer() {
    const columns = [
        {
            heading: "COMPANY",
            links: [
                { label: "Home", href: "/" },
                { label: "About Us", href: "/about-us" },
                { label: "Contact", href: "/contact" },
                { label: "Loyalty Program", href: "/loyalty-program" },
            ],
        },
        {
            heading: "LEGAL",
            links: [
                { label: "Privacy Policy", href: "/privacy-policy" },
                { label: "Terms of Service", href: "/terms-of-service" },
                { label: "Imprint", href: "/imprint" },
            ],
        },
        {
            heading: "PRIVACY TOOLS",
            links: [
                { label: "Cookie Policy", href: "/cookie-policy" },
                { label: "Do Not Sell", href: "/do-not-sell" },
                { label: "Delete My Account", href: "/delete-my-account" },
                { label: "Cookie Settings", href: "/cookie-settings" },
            ],
        },
    ];

    return (
        <footer className="bg-black text-gray-300">
            <div className="max-w-7xl mx-auto px-8 sm:px-12 lg:px-16 py-10 sm:py-14">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 sm:gap-12">
                    {/* Brand Section */}
                    <div className="lg:col-span-1">
                        <Link href="/" className="flex items-center space-x-2 mb-4">
                            <img
                                src="https://res.cloudinary.com/destej60y/image/upload/v1773809464/Bolt_2_xqr9so.png"
                                alt="KeepPlay Engine Logo"
                                width={36}
                                height={36}
                                loading="eager"
                                className="h-9 w-auto"
                            />
                            <span className="text-base font-bold text-white">KeepPlay Engine</span>
                        </Link>
                        <p className="text-sm text-gray-400 leading-relaxed max-w-xs">
                            Building the future of Play-to-Earn ecosystems | technology that keeps players engaged and rewards flowing endlessly.
                        </p>
                    </div>

                    {/* Link Columns */}
                    {columns.map((col) => (
                        <div key={col.heading}>
                            <h3 className="text-white font-bold text-sm tracking-widest uppercase mb-5">
                                {col.heading}
                            </h3>
                            <ul className="space-y-4">
                                {col.links.map((link) => (
                                    <li key={link.label}>
                                        <Link
                                            href={link.href}
                                            className="text-sm text-white hover:underline transition-colors"
                                        >
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Bottom bar */}
                <div className="mt-10 sm:mt-14 border-t border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    {/* Copyright */}
                    <p className="text-xs text-gray-500">
                        © 2026 RAVADO TECH LTD. All rights reserved.
                    </p>

                    {/* YouTube icon */}
                    <a
                        href="https://youtube.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="YouTube"
                        className="h-9 w-9 rounded-full border border-gray-700 flex items-center justify-center text-gray-400 hover:text-white hover:border-gray-500 transition-colors"
                    >
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 576 512">
                            <path d="M549.655 124.083c-6.281-23.65-24.787-42.276-48.284-48.597C458.781 64 288 64 288 64S117.22 64 74.629 75.486c-23.497 6.322-42.003 24.947-48.284 48.597C14.786 166.95 14.786 256 14.786 256s0 89.05 11.559 131.917c6.281 23.65 24.787 41.5 48.284 47.821C117.22 448 288 448 288 448s170.78 0 213.371-12.262c23.497-6.321 42.003-24.171 48.284-47.821C561.214 345.05 561.214 256 561.214 256s0-89.05-11.559-131.917zM232.145 337.591V174.409L374.884 256 232.145 337.591z" />
                        </svg>
                    </a>
                </div>

                {/* Address */}
                <p className="mt-4 text-center text-xs font-semibold text-white">
                    RAVADO TECH LTD. 71–75 Shelton Street, Covent Garden, London, WC2H 9JQ, United Kingdom.
                </p>
            </div>
        </footer>
    );
}
