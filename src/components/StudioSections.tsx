import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Gamepad2,
  Heart,
  Lightbulb,
  Rocket,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
} from "lucide-react";

const steps = [
  {
    n: "01",
    title: "Find the fun",
    text: "Start with a playful idea and a mechanic that feels good from the very first tap.",
    icon: Lightbulb,
  },
  {
    n: "02",
    title: "Make it feel great",
    text: "Prototype, playtest, and refine. Every control, level, and little detail counts.",
    icon: Gamepad2,
  },
  {
    n: "03",
    title: "Bring it to players",
    text: "Bring development, device testing, and store presentation together for launch.",
    icon: Rocket,
  },
  {
    n: "04",
    title: "Keep getting better",
    text: "Listen to players, learn from the experience, and give good ideas room to grow.",
    icon: Heart,
  },
];

export default function StudioSections() {
  return (
    <>
      <section
        id="studio"
        className="kpe-section kpe-studio"
        aria-labelledby="studio-title"
      >
        <div className="kpe-container">
          <div className="kpe-section-heading">
            <div>
              <p className="kpe-eyebrow">01 / THIS IS KEEPPLAY ENGINE</p>
              <h2 id="studio-title">
                Serious about
                <br />
                having <span className="kpe-brand-accent">fun.</span>
              </h2>
            </div>
            <p>
              We develop and publish mobile games with a simple ambition: make
              something people love to pick up, play, and come back to.
            </p>
          </div>
          <div className="kpe-bento-grid">
            <article className="kpe-bento kpe-development">
              <div className="kpe-puzzle-art" aria-hidden="true">
                <i />
                <i />
                <i />
                <i />
                <Sparkles size={35} />
              </div>
              <div>
                <p className="kpe-card-kicker">WE DEVELOP</p>
                <h3>
                  From a little spark
                  <br />
                  to a great game.
                </h3>
                <p>
                  Satisfying controls. Clear goals. That lovely &ldquo;one more
                  go&rdquo; feeling. We put care into the little things that
                  turn a simple mechanic into a memorable experience.
                </p>
              </div>
            </article>
            <article className="kpe-bento kpe-publish-card">
              <div className="kpe-rocket-art" aria-hidden="true">
                <span />
                <Rocket size={98} strokeWidth={1.4} />
                <Star size={30} fill="currentColor" />
              </div>
              <div>
                <p className="kpe-card-kicker">WE PUBLISH</p>
                <h3>
                  Good ideas deserve
                  <br />a great launch.
                </h3>
                <p>
                  We connect the creative and practical sides of mobile
                  publishing. From polishing the experience to preparing for
                  release, we think about the whole player journey.
                </p>
              </div>
            </article>
          </div>
          <div className="kpe-studio-notes">
            <p>
              <Smartphone size={20} aria-hidden="true" />
              <strong>Mobile at our core.</strong> Play that fits in your
              pocket.
            </p>
            <p>
              <Heart size={20} aria-hidden="true" />
              <strong>Players at the centre.</strong> Built with care, refined
              through play.
            </p>
          </div>
        </div>
      </section>
      <section
        id="playground"
        className="kpe-section kpe-playground"
        aria-labelledby="playground-title"
      >
        <div className="kpe-container">
          <div className="kpe-section-heading">
            <div>
              <p className="kpe-eyebrow">02 / OUR PLAYGROUND</p>
              <h2 id="playground-title">
                Small screens.
                <br />
                Endless possibilities.
              </h2>
            </div>
            <p>
              Colourful worlds, clever challenges, and a spark of surprise.
              These are the kinds of experiences we love to create.
            </p>
          </div>
          <div className="kpe-genres">
            <article className="kpe-genre kpe-genre-puzzle">
              <div className="kpe-genre-art kpe-match-art" aria-hidden="true">
                {Array.from({ length: 9 }, (_, i) => (
                  <i key={i} />
                ))}
              </div>
              <div className="kpe-genre-caption">
                <div>
                  <p>THINK. MATCH. SMILE.</p>
                  <h3>Puzzle</h3>
                </div>
                <Sparkles size={26} aria-hidden="true" />
              </div>
            </article>
            <article className="kpe-genre kpe-genre-arcade">
              <div className="kpe-genre-art kpe-arcade-art" aria-hidden="true">
                <i />
                <span />
                <Star size={35} fill="currentColor" />
              </div>
              <div className="kpe-genre-caption">
                <div>
                  <p>JUST ONE MORE GO.</p>
                  <h3>Arcade</h3>
                </div>
                <Gamepad2 size={26} aria-hidden="true" />
              </div>
            </article>
            <article className="kpe-genre kpe-genre-casual">
              <div className="kpe-genre-art kpe-casual-art" aria-hidden="true">
                <div className="kpe-cube">
                  <i />
                  <i />
                </div>
                <span />
                <Star size={35} fill="currentColor" />
              </div>
              <div className="kpe-genre-caption">
                <div>
                  <p>LITTLE MOMENTS. BIG JOY.</p>
                  <h3>Casual</h3>
                </div>
                <Heart size={26} aria-hidden="true" />
              </div>
            </article>
          </div>
          <p className="kpe-concept-note">
            A look at our creative direction. Illustrations show concepts, not
            released game screenshots.
          </p>
        </div>
      </section>
      <section
        id="approach"
        className="kpe-section kpe-approach"
        aria-labelledby="approach-title"
      >
        <div className="kpe-container">
          <p className="kpe-eyebrow">03 / FROM SPARK TO SCREEN</p>
          <h2 id="approach-title">
            A little idea.
            <br />A lot of heart.
          </h2>
          <div className="kpe-process">
            {steps.map(({ n, title, text, icon: Icon }) => (
              <article key={n}>
                <div className="kpe-process-top">
                  <span>{n}</span>
                  <Icon size={24} aria-hidden="true" />
                </div>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section
        id="publishing"
        className="kpe-section kpe-publishing"
        aria-labelledby="publishing-title"
      >
        <div className="kpe-container kpe-publishing-grid">
          <div>
            <p className="kpe-eyebrow">
              04 / LET&rsquo;S BUILD SOMETHING PLAYFUL
            </p>
            <h2 id="publishing-title">
              Got a spark?
              <br />
              Let&rsquo;s make it <span>play.</span>
            </h2>
            <p>
              Have a game idea, a prototype, or a publishing conversation in
              mind? We&rsquo;d love to hear what you&rsquo;re working on.
            </p>
            <a
              className="kpe-button kpe-button-dark"
              href="mailto:business@keepplayengine.com?subject=Let%27s%20make%20games"
            >
              Create with KeepPlay <ArrowUpRight size={19} aria-hidden="true" />
            </a>
            <a
              className="kpe-publishing-email"
              href="mailto:business@keepplayengine.com"
            >
              business@keepplayengine.com
            </a>
          </div>
          <div className="kpe-play-sticker" aria-hidden="true">
            <span>GOOD IDEAS</span>
            <Gamepad2 size={112} strokeWidth={1.5} />
            <span>START WITH PLAY.</span>
          </div>
        </div>
      </section>
      <section className="kpe-trust">
        <div className="kpe-container kpe-trust-row">
          <ShieldCheck size={29} aria-hidden="true" />
          <div>
            <h2>Good play starts with trust.</h2>
            <p>
              Understand your data, manage your choices, and reach us when you
              need to.
            </p>
          </div>
          <Link href="/privacy-policy">
            Your privacy matters <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </section>
    </>
  );
}
