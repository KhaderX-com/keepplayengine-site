import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Imprint | KeepPlay Engine",
  description:
    "Legal entity information and contact details for RAVADO TECH LTD, the company behind KeepPlay Engine.",
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <tr className="border-b border-gray-200">
      <td className="py-3 pr-6 text-gray-500 text-sm whitespace-nowrap align-top">
        {label}
      </td>
      <td className="py-3 text-gray-900 font-medium text-sm">{children}</td>
    </tr>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */
export default function ImprintPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="grow pt-20 sm:pt-24 pb-16 bg-white">
        {/* Header */}
        <div className="bg-linear-to-br from-gray-900 to-gray-800 text-white py-14 sm:py-20 mb-12">
          <div className="max-w-4xl mx-auto px-6 sm:px-8 text-center">
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4">
              Imprint
            </h1>
            <p className="text-gray-300 text-sm sm:text-base max-w-2xl mx-auto">
              Legal entity information and contact details
            </p>
          </div>
        </div>

        {/* Body */}
        <article className="max-w-4xl mx-auto px-6 sm:px-8">
          {/* Company Name */}
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 text-center mb-10 tracking-tight">
            RAVADO TECH LTD
          </h2>

          {/* ---- Company Details Table ---- */}
          <div className="overflow-x-auto mb-14">
            <table className="w-full text-left">
              <tbody>
                <Row label="Legal Entity Name">
                  <strong>RAVADO TECH LTD</strong>
                </Row>
                <Row label="Trading As">Ravado Tech</Row>
                <Row label="Entity Type">Private Limited Company (UK)</Row>
                <Row label="Company Registration Number">17051903</Row>
                <Row label="D.U.N.S® Number">354606066</Row>
                <Row label="Incorporated In">
                  England and Wales, United Kingdom
                </Row>
                <Row label="Registered Address">
                  71–75 Shelton Street, Covent Garden, London, WC2H 9JQ, United
                  Kingdom
                </Row>
                <Row label="Contact Email">
                  <a
                    href="mailto:support@ravadotech.com"
                    className="text-[#0BCC0E] hover:underline font-medium"
                  >
                    support@ravadotech.com
                  </a>
                </Row>
                <Row label="Website">
                  <a
                    href="https://ravadotech.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#0BCC0E] hover:underline font-medium"
                  >
                    ravadotech.com
                  </a>
                </Row>
              </tbody>
            </table>
          </div>

          {/* ---- Departmental Contact Information ---- */}
          <section className="mb-14">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">
              Departmental Contact Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                {
                  title: "General Support",
                  email: "support@ravadotech.com",
                },
                {
                  title: "Legal Enquiries",
                  email: "legal@ravadotech.com",
                },
                {
                  title: "Office",
                  email: "office@ravadotech.com",
                },
                {
                  title: "CEO",
                  email: "ceo@ravadotech.com",
                },
                {
                  title: "Business",
                  email: "business@ravadotech.com",
                },
              ].map(({ title, email }) => (
                <div key={email}>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">
                    {title}
                  </h3>
                  <a
                    href={`mailto:${email}`}
                    className="text-sm text-[#0BCC0E] hover:underline font-medium"
                  >
                    {email}
                  </a>
                </div>
              ))}
            </div>
          </section>

          {/* ---- Regulatory Information ---- */}
          <section className="mb-14">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
              Regulatory Information
            </h2>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                <strong className="text-gray-900">RAVADO TECH LTD</strong> is
                registered with Companies House (England and Wales) under company
                number <strong className="text-gray-900">17051903</strong>. The
                company is subject to the laws and regulations of England and
                Wales and operates as a private limited company. Our D‑U‑N‑S®
                Number is <strong className="text-gray-900">354606066</strong>.
              </p>
              <p>
                We are committed to complying with all applicable regulations
                including the UK General Data Protection Regulation (UK GDPR),
                the Data Protection Act 2018, consumer protection legislation,
                and industry-specific standards for mobile application
                publishing.
              </p>
            </div>
          </section>

          {/* ---- Copyright ---- */}
          <div className="text-center text-sm text-gray-400 pt-6 border-t border-gray-200">
            © 2026 RAVADO TECH LTD. All rights reserved.
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
}
