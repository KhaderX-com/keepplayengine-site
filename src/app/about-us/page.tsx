import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "About the studio | KeepPlay Engine",
  description:
    "Meet KeepPlay Engine, a mobile games development and publishing studio built around the joy of play.",
};
export default function AboutUsPage() {
  return (
    <>
      <Navbar />
      <main className="bg-white">
        <article className="kpe-legal">
          <p className="kpe-eyebrow mb-5">THE STUDIO</p>
          <h1>
            Big ideas.
            <br />
            Small screens.
          </h1>
          <div className="kpe-legal-summary">
            KeepPlay Engine is a mobile games development and publishing studio.
            We bring playful ideas to life through simple mechanics, satisfying
            controls, and thoughtful details.
          </div>
          <section>
            <h2>Play comes first.</h2>
            <p>
              Our ambition is to make everyday moments a little more fun. We
              focus on casual mobile experiences that are easy to pick up and
              feel great to play, whether you have a few minutes or a little
              longer.
            </p>
          </section>
          <section>
            <h2>From spark to screen.</h2>
            <p>
              We think about the whole journey: the first prototype, the feel of
              a level, testing on real devices, store presentation, launch, and
              the feedback that helps a game grow. Development and publishing
              are parts of the same creative process.
            </p>
          </section>
          <section>
            <h2>Built with care.</h2>
            <p>
              Clear controls, good performance, and respect for players matter.
              Our <Link href="/privacy-policy">Privacy Policy</Link> explains
              information practices and your choices.
            </p>
          </section>
          <section>
            <h2>Let's create something playful.</h2>
            <p>
              Have a prototype, an idea, or a publishing question? Email{" "}
              <a href="mailto:business@keepplayengine.com">
                business@keepplayengine.com
              </a>{" "}
              or <Link href="/contact">get in touch</Link>.
            </p>
          </section>
        </article>
      </main>
      <Footer />
    </>
  );
}
