import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Gamepad2, Handshake, ShieldCheck } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Contact | KeepPlay Engine",
  description:
    "Talk to KeepPlay Engine about mobile game publishing, player support, or privacy.",
};
const contacts = [
  {
    title: "Let's make games",
    text: "Ideas, prototypes, collaborations, and publishing conversations.",
    email: "business@keepplayengine.com",
    icon: Handshake,
  },
  {
    title: "Player support",
    text: "Need a hand? Include the game title, platform, and a description of the issue.",
    email: "support@keepplayengine.com",
    icon: Gamepad2,
  },
  {
    title: "Your privacy",
    text: "Questions about your data, advertising choices, or a privacy request.",
    email: "privacy@keepplayengine.com",
    icon: ShieldCheck,
  },
];
export default function ContactPage() {
  return (
    <>
      <Navbar />
      <main className="bg-white">
        <article className="kpe-legal">
          <p className="kpe-eyebrow mb-5">SAY HELLO</p>
          <h1>
            Good things start
            <br />
            with a conversation.
          </h1>
          <p className="mt-6">
            Whether you're building your next game or need help with one of
            ours, we'd love to hear from you.
          </p>
          <div className="mt-10 grid gap-5">
            {contacts.map(({ title, text, email, icon: Icon }) => (
              <section
                key={email}
                className="!mt-0 rounded-2xl border border-gray-200 bg-gray-50 p-6 sm:p-8"
              >
                <Icon
                  className="mb-4 text-[#2D32FF]"
                  size={28}
                  aria-hidden="true"
                />
                <h2>{title}</h2>
                <p>{text}</p>
                <a
                  className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold"
                  href={`mailto:${email}`}
                >
                  {email}
                  <ArrowUpRight size={16} aria-hidden="true" />
                </a>
              </section>
            ))}
          </div>
          <p className="mt-8 text-sm">
            You can request{" "}
            <Link href="/delete-my-account">data and account deletion</Link>{" "}
            without reinstalling a game. Please never send passwords or full
            payment-card details.
          </p>
        </article>
      </main>
      <Footer />
    </>
  );
}
