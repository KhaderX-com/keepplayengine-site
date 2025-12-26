import Image from "next/image";
import Link from "next/link";
import { Facebook, Instagram } from "lucide-react";

// Custom LinkedIn In Icon
const LinkedInIcon = () => (
    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 448 512">
        <path d="M100.28 448H7.4V148.9h92.88zM53.79 108.1C24.09 108.1 0 83.5 0 53.8a53.79 53.79 0 1 1 107.58 0c0 29.7-24.1 54.3-53.79 54.3zM447.9 448h-92.68V302.4c0-34.7-.7-79.2-48.29-79.2-48.29 0-55.69 37.7-55.69 76.7V448h-92.78V148.9h89.08v40.8h1.3c12.4-23.5 42.69-48.3 87.88-48.3 94 0 111.28 61.9 111.28 142.3V448z" />
    </svg>
);

// Custom X (Twitter) Icon
const XIcon = () => (
    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 512 512">
        <path d="M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z" />
    </svg>
);

export default function Footer() {
    const currentYear = new Date().getFullYear();

    const footerLinks = {
        company: [
            { label: "About Us", href: "/about" },
            { label: "Careers", href: "/careers" },
            { label: "Press", href: "/press" },
            { label: "Partners", href: "/partners" },
        ],
        product: [
            { label: "Ecosystem", href: "/ecosystem" },
            { label: "Giveback", href: "/giveback" },
            { label: "Technology", href: "/technology" },
            { label: "Security", href: "/security" },
        ],
        resources: [
            { label: "Documentation", href: "/docs" },
            { label: "Blog", href: "/blog" },
            { label: "Support", href: "/support" },
            { label: "API", href: "/api" },
        ],
        legal: [
            { label: "Privacy Policy", href: "/privacy-policy" },
            { label: "Terms of Service", href: "/terms-and-conditions" },
            { label: "Cookie Policy", href: "/cookies" },
            { label: "Compliance", href: "/compliance" },
        ],
    };

    const socialLinks = [
        { icon: LinkedInIcon, href: "https://linkedin.com", label: "LinkedIn" },
        { icon: XIcon, href: "https://x.com", label: "X" },
        { icon: Facebook, href: "https://facebook.com", label: "Facebook" },
        { icon: Instagram, href: "https://instagram.com", label: "Instagram" },
    ];

    return (
        <footer className="bg-gray-900 text-gray-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
                {/* Main Footer Content */}
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-6 gap-6 sm:gap-8 lg:gap-12 pb-6 sm:pb-8 border-b border-gray-800">
                    {/* Brand Section */}
                    <div className="col-span-2 lg:col-span-2">
                        <Link href="/" className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
                            <Image
                                src="https://res.cloudinary.com/destej60y/image/upload/v1766745807/Logo-transparent_icqnyx.svg"
                                alt="KeepPlay Engine Logo"
                                width={40}
                                height={40}
                                className="h-8 sm:h-10 w-auto"
                            />
                            <span className="text-lg sm:text-xl font-bold text-white">KeepPlay Engine</span>
                        </Link>
                        <p className="text-xs sm:text-sm text-gray-400 max-w-sm leading-relaxed">
                            Building the future of Play-to-Earn ecosystems. We create technology that keeps players engaged and rewards flowing endlessly.
                        </p>
                    </div>

                    {/* Company Links */}
                    <div>
                        <h3 className="text-white font-semibold text-sm sm:text-base mb-3 sm:mb-4">Company</h3>
                        <ul className="space-y-2 sm:space-y-3">
                            {footerLinks.company.map((link) => (
                                <li key={link.label}>
                                    <Link
                                        href={link.href}
                                        className="text-xs sm:text-sm hover:text-[#00E5FF] transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Product Links */}
                    <div>
                        <h3 className="text-white font-semibold text-sm sm:text-base mb-3 sm:mb-4">Product</h3>
                        <ul className="space-y-2 sm:space-y-3">
                            {footerLinks.product.map((link) => (
                                <li key={link.label}>
                                    <Link
                                        href={link.href}
                                        className="text-xs sm:text-sm hover:text-[#00E5FF] transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Resources Links */}
                    <div>
                        <h3 className="text-white font-semibold text-sm sm:text-base mb-3 sm:mb-4">Resources</h3>
                        <ul className="space-y-2 sm:space-y-3">
                            {footerLinks.resources.map((link) => (
                                <li key={link.label}>
                                    <Link
                                        href={link.href}
                                        className="text-xs sm:text-sm hover:text-[#00E5FF] transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Legal Links */}
                    <div>
                        <h3 className="text-white font-semibold text-sm sm:text-base mb-3 sm:mb-4">Legal</h3>
                        <ul className="space-y-2 sm:space-y-3">
                            {footerLinks.legal.map((link) => (
                                <li key={link.label}>
                                    <Link
                                        href={link.href}
                                        className="text-xs sm:text-sm hover:text-[#00E5FF] transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Bottom Section */}
                <div className="pt-6 sm:pt-8 flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 gap-4">
                    {/* Copyright */}
                    <p className="text-xs sm:text-sm text-gray-500 text-center sm:text-left">
                        &copy; {currentYear} KeepPlay Engine. All rights reserved.
                    </p>

                    {/* Social Links */}
                    <div className="flex items-center space-x-3 sm:space-x-4">
                        {socialLinks.map((social) => {
                            const IconComponent = social.icon;
                            return (
                                <a
                                    key={social.label}
                                    href={social.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-[#00E5FF] hover:text-gray-900 transition-all duration-200"
                                    aria-label={social.label}
                                >
                                    <IconComponent />
                                </a>
                            );
                        })}
                    </div>
                </div>
            </div>
        </footer>
    );
}
