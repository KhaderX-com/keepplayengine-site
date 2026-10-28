import Image from "next/image";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Gamepad2,
  Sparkles,
  Smartphone,
} from "lucide-react";

export default function Hero() {
  return (
    <section id="home" className="kpe-hero" aria-labelledby="hero-title">
      <div className="kpe-container kpe-hero-grid">
        <div className="kpe-hero-copy">
          <p className="kpe-eyebrow">
            <span className="kpe-status-dot" /> MOBILE GAMES DEVELOPMENT &
            PUBLISHING
          </p>
          <h1 id="hero-title">
            Life needs
            <br />a little more
            <br />
            <span>play.</span>
            {/* <Sparkles className="kpe-hero-spark" aria-hidden="true" /> */}
          </h1>
          <p className="kpe-hero-description">
            Big ideas. Small screens. We&rsquo;re KeepPlay Engine, a mobile
            games studio turning everyday moments into{" "}
            <strong>one more go.</strong>
          </p>
          <div className="kpe-actions">
            <a className="kpe-button kpe-button-primary" href="#studio">
              Meet the studio <ArrowRight size={19} aria-hidden="true" />
            </a>
            <a className="kpe-text-link" href="#publishing">
              Create with us <ArrowUpRight size={18} aria-hidden="true" />
            </a>
          </div>
          <p className="kpe-platforms">
            <Smartphone size={17} aria-hidden="true" /> Made for mobile <span />{" "}
            iOS & Android
          </p>
        </div>
        <div className="kpe-hero-art">
          <div className="kpe-art-orbit" aria-hidden="true" />
          <Image
            src="/images/mobile-game-world-blue.webp"
            alt="A miniature game world with an orange racetrack, colourful puzzle blocks, a friendly cube character, and a golden star"
            width={1280}
            height={1024}
            priority
            sizes="(max-width: 800px) 100vw, 52vw"
            className="kpe-world"
          />
          <span className="kpe-art-label kpe-label-top">
            <Sparkles size={16} aria-hidden="true" /> SMALL SCREEN. BIG
            POSSIBILITY.
          </span>
          <span className="kpe-art-label kpe-label-bottom">
            <Gamepad2 size={21} aria-hidden="true" /> Built for the joy of it.
          </span>
          <span className="kpe-art-plus" aria-hidden="true">
            ✳︎
          </span>
        </div>
      </div>
      <div className="kpe-container kpe-hero-bottom">
        <span>GOOD IDEAS START WITH PLAY.</span>
        <a href="#studio" aria-label="Explore the studio">
          <ArrowDown size={20} aria-hidden="true" />
        </a>
        <span>DEVELOP. PUBLISH. KEEP PLAYING.</span>
      </div>
    </section>
  );
}
