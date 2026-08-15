"use client";

import { useGSAP } from "@gsap/react";
import dynamic from "next/dynamic";
import Image from "next/image";
import type { CSSProperties } from "react";
import { useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { ProjectVisual as ProjectVisualPanel } from "@/components/project-visuals";
import { projects } from "@/data/projects";

const RoboticArmScene = dynamic(
  () =>
    import("@/components/three/robotic-arm-scene").then(
      (module) => module.RoboticArmScene,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="scene-loading" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
    ),
  },
);

gsap.registerPlugin(useGSAP);
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const capabilityItems = [
  {
    title: "Learning systems",
    copy: "Reward design, reproducible experiments, evaluation across scenarios, and a bias toward evidence over one impressive rollout.",
    signal: "Policies that can be explained",
  },
  {
    title: "Autonomous software",
    copy: "Clear contracts between perception, planning, and control so each layer can be replayed, tested, and improved independently.",
    signal: "Systems that fail visibly",
  },
  {
    title: "Full-stack delivery",
    copy: "Interfaces, server logic, relational data, and integrations connected into complete journeys rather than isolated features.",
    signal: "Products that actually ship",
  },
  {
    title: "Interface engineering",
    copy: "Accessible, responsive experiences with purposeful motion and graceful fallbacks for constrained devices and reduced-motion users.",
    signal: "Clarity at every layer",
  },
];

const evidenceItems = [
  {
    question: "Can another person reproduce the result?",
    answer:
      "A convincing demo is only the start. I want the environment, inputs, assumptions, and evaluation path to be visible enough for someone else to run.",
  },
  {
    question: "Is my contribution visible?",
    answer:
      "For team work, I separate the shared outcome from the interfaces, decisions, and implementation I personally own.",
  },
  {
    question: "Does the system fail clearly?",
    answer:
      "I value logs, replayable scenarios, fallbacks, and honest next milestones because dependable engineering includes the unsuccessful path.",
  },
];

const marqueeItems = [
  "Reinforcement learning",
  "Robotics",
  "Autonomous systems",
  "Full-stack engineering",
  "Human-centred software",
];
const MARQUEE_GROUP_COUNT = 5;

function ArrowIcon({ direction = "forward" }: { direction?: "forward" | "back" }) {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden="true"
      className={direction === "back" ? "arrow-icon arrow-icon--back" : "arrow-icon"}
    >
      <path d="M3 10h13M11 5l5 5-5 5" />
    </svg>
  );
}

export function PortfolioPage() {
  const root = useRef<HTMLElement>(null);
  const [evidenceIndex, setEvidenceIndex] = useState(0);

  useGSAP(
    () => {
      const media = gsap.matchMedia();
      const delayedTweens: gsap.core.Tween[] = [];

      media.add(
        {
          motion: "(prefers-reduced-motion: no-preference)",
          desktop: "(min-width: 900px)",
        },
        (context) => {
          const { motion, desktop } = context.conditions as {
            motion: boolean;
            desktop: boolean;
          };

          if (!motion) return;

          const intro = gsap.timeline({ defaults: { ease: "power3.out" } });
          intro
            .from(".site-nav", { y: -24, opacity: 0, duration: 0.7 })
            .from(
              ".hero-context, .hero-title__line, .hero-intro, .hero-actions",
              {
                y: 44,
                opacity: 0,
                duration: 0.9,
                stagger: 0.09,
              },
              "-=0.35",
            )
            .from(".hero-visual", { scale: 0.9, opacity: 0, duration: 1.1 }, "-=0.9");

          gsap.to(".marquee-track", {
            xPercent: -100 / MARQUEE_GROUP_COUNT,
            duration: 28,
            repeat: -1,
            ease: "none",
          });

          const revealElements = (elements: Element[]) => {
            delayedTweens.push(
              gsap.from(elements, {
                y: 56,
                opacity: 0,
                duration: 0.9,
                stagger: 0.1,
                ease: "power3.out",
              }),
            );
          };

          ScrollTrigger.batch(".section-reveal", {
            start: "top 88%",
            once: true,
            onEnter: revealElements,
          });

          const cards = gsap.utils.toArray<HTMLElement>(".case-card");
          cards.forEach((card, index) => {
            const nextCard = cards[index + 1];
            if (!nextCard) return;

            gsap.to(card, {
              scale: 0.94,
              opacity: 0.5,
              ease: "none",
              scrollTrigger: {
                trigger: nextCard,
                start: "top 82%",
                end: "top 24%",
                scrub: true,
              },
            });
          });

          if (desktop) {
            ScrollTrigger.create({
              trigger: ".case-layout",
              start: "top top+=112",
              end: "bottom bottom-=120",
              pin: ".case-intro",
              pinSpacing: false,
            });
          }
        },
      );

      return () => {
        delayedTweens.forEach((tween) => tween.kill());
        media.revert();
      };
    },
    { scope: root },
  );

  const showPreviousEvidence = () =>
    setEvidenceIndex((current) =>
      current === 0 ? evidenceItems.length - 1 : current - 1,
    );

  const showNextEvidence = () =>
    setEvidenceIndex((current) => (current + 1) % evidenceItems.length);

  return (
    <main ref={root} className="portfolio-shell overflow-x-hidden w-full max-w-full">
      <section className="hero" id="top">
        <div className="hero-noise" aria-hidden="true" />
        <div className="hero-panel">
          <nav className="site-nav" aria-label="Primary navigation">
            <a className="brand-mark" href="#top" aria-label="Back to top">
              <span>KA CHONG</span>
              <span className="brand-mark__slash">/</span>
              <span>CS</span>
            </a>
            <div className="site-nav__links">
              <a href="#work">Work</a>
              <a href="#profile">Profile</a>
              <a
                href="https://github.com/xDavid673x"
                target="_blank"
                rel="noreferrer"
              >
                GitHub
              </a>
              <a
                href="https://www.linkedin.com/in/david673/"
                target="_blank"
                rel="noreferrer"
              >
                LinkedIn
              </a>
            </div>
            <a className="nav-cta" href="#contact">
              Contact
              <ArrowIcon />
            </a>
          </nav>

          <div className="hero-grid">
            <div className="hero-copy">
              <p className="hero-context">
                Computer Science
                <span aria-hidden="true">/</span>
                Manchester
              </p>
              <h1 className="hero-title" aria-label="Ka Chong">
                <span className="hero-title__line">KA CHONG</span>
              </h1>
            </div>

            <div className="hero-visual">
              <div className="hero-portrait-glow" aria-hidden="true" />
              <Image
                alt="Stylized portrait of Ka Chong"
                className="hero-portrait"
                height={1402}
                priority
                sizes="(max-width: 620px) 96vw, (max-width: 899px) 74vw, 52vw"
                src="/images/avatar/david-hero-portrait-v1.png"
                width={1122}
              />
            </div>

            <div className="hero-intro">
              <span>Year 2 / University of Manchester</span>
              <p className="hero-statement">
                Building systems that <em>learn, move, and ship.</em>
              </p>
            </div>

            <div className="hero-actions">
              <a className="hero-talk" href="#contact">
                <span>Let&apos;s talk</span>
                <ArrowIcon />
              </a>
              <a
                className="hero-github"
                href="https://github.com/xDavid673x"
                target="_blank"
                rel="noreferrer"
              >
                GitHub
                <ArrowIcon />
              </a>
              <a
                className="hero-github"
                href="https://www.linkedin.com/in/david673/"
                target="_blank"
                rel="noreferrer"
              >
                LinkedIn
                <ArrowIcon />
              </a>
            </div>

            <div className="hero-evidence">
              <p>
                From full-stack delivery to reinforcement-learning robotics and
                autonomous Formula Student systems.
              </p>
              <dl>
                <div>
                  <dt>Building now</dt>
                  <dd>RL robotic arm</dd>
                </div>
                <div>
                  <dt>Moving toward</dt>
                  <dd>Autonomous racing</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </section>

      <div className="marquee" aria-label="Areas of focus">
        <div className="marquee-track">
          {Array.from({ length: MARQUEE_GROUP_COUNT }, (_, group) => (
            <div className="marquee-group" key={group} aria-hidden={group > 0}>
              {marqueeItems.map((item) => (
                <span key={`${group}-${item}`}>
                  {item}
                  <i aria-hidden="true" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <section className="work-overview" id="work">
        <header className="chapter-heading section-reveal">
          <p>Selected work</p>
          <h2>
            From shipped software to systems that <em>learn.</em>
          </h2>
          <span>
            Three projects, ordered by where I am heading rather than when I
            started.
          </span>
        </header>

        <div className="project-bento grid-flow-dense section-reveal">
          {projects.map((project, index) => (
            <a
              className={`bento-card group bento-card--${index === 0 ? "lead" : "side"} bento-card--${project.tone}`}
              href={`#case-${project.id}`}
              key={project.id}
            >
              <div
                className={`bento-card__visual${
                  index === 0 ? "" : " group-hover:scale-105 transition-transform duration-700 ease-out"
                }`}
              >
                <ProjectVisualPanel type={project.visual} />
              </div>
              <div className={`bento-card__copy${index === 0 ? " bento-card__copy--lead" : ""}`}>
                {index === 0 ? (
                  <span className="bento-card__discipline">
                    Reinforcement learning / robotics
                  </span>
                ) : null}
                <h3>{project.shortTitle}</h3>
                <p>{project.summary}</p>
                <span className="text-link">
                  Read the build notes
                  <ArrowIcon />
                </span>
              </div>
            </a>
          ))}
        </div>
      </section>

      <section className="case-studies" aria-labelledby="case-study-title">
        <div className="case-layout">
          <aside className="case-intro">
            <p>Inside the work</p>
            <h2 id="case-study-title">How I turn open questions into testable systems.</h2>
            <span>
              Each project separates the challenge, current approach, available
              evidence, and next validation milestone.
            </span>
          </aside>

          <div className="case-stack">
            {projects.map((project, index) => (
              <article
                className={`case-card case-card--${project.tone} case-card--layout-${index + 1}`}
                data-arm-scroll-scene={
                  project.id === "robotic-arm" ? "true" : undefined
                }
                id={`case-${project.id}`}
                key={project.id}
                style={{ "--card-index": index } as CSSProperties}
              >
                <header className="case-card__header">
                  <div>
                    <span>{project.status}</span>
                    <span>{project.context}</span>
                  </div>
                  <h3>{project.title}</h3>
                  <p>{project.summary}</p>
                </header>

                <div className="case-card__visual group overflow-hidden">
                  {project.id === "robotic-arm" ? (
                    <div className="robotic-arm-scene-frame">
                      <RoboticArmScene
                        className="robotic-arm-project-scene"
                        label="The articulated ZERO robotic arm performing a pick-and-place sorting task as the project chapter scrolls"
                      />
                      <div className="robotic-arm-scene-note" aria-hidden="true">
                        <span>Pick → transfer → place</span>
                        <span>Continuous workcell cycle</span>
                      </div>
                    </div>
                  ) : (
                    <div className="group-hover:scale-105 transition-transform duration-700 ease-out">
                      <ProjectVisualPanel type={project.visual} />
                    </div>
                  )}
                </div>

                <dl className="case-card__details">
                  <div>
                    <dt>System challenge</dt>
                    <dd>{project.challenge}</dd>
                  </div>
                  <div>
                    <dt>Current build</dt>
                    <dd>{project.approach}</dd>
                  </div>
                  <div>
                    <dt>
                      {project.evidenceType === "verified"
                        ? "Verified evidence"
                        : "Validation plan"}
                    </dt>
                    <dd>{project.evidence}</dd>
                  </div>
                </dl>

                <footer className="case-card__footer">
                  <div className="case-card__next">
                    <span>Next</span>
                    <p>{project.nextMilestone}</p>
                  </div>
                  <div className="case-card__footer-end">
                    <div className="case-card__technologies">
                      {project.technologies.map((technology) => (
                        <span key={technology}>{technology}</span>
                      ))}
                    </div>
                    {project.source ? (
                      <a
                        href={project.source.href}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {project.source.label}
                        <ArrowIcon />
                      </a>
                    ) : (
                      <span className="case-card__progress">Evidence in progress</span>
                    )}
                  </div>
                </footer>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="capabilities" aria-labelledby="capabilities-title">
        <header className="chapter-heading chapter-heading--compact section-reveal">
          <p>Capabilities in motion</p>
          <h2 id="capabilities-title">The layers I am learning to connect.</h2>
        </header>

        <div className="capability-accordion section-reveal">
          {capabilityItems.map((item) => (
            <article className="capability-panel" key={item.title} tabIndex={0}>
              <div className="capability-panel__signal" aria-hidden="true" />
              <h3>{item.title}</h3>
              <p>{item.copy}</p>
              <span>{item.signal}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="profile" id="profile">
        <div className="profile-statement section-reveal">
          <p>Profile</p>
          <h2>
            Learning in public. Building beyond the notebook. Keeping the
            unsuccessful run in the story.
          </h2>
        </div>
        <div className="profile-copy section-reveal">
          <p>
            I am a second-year Computer Science student at the University of
            Manchester aiming toward AI and machine-learning engineering. My work
            is moving from a broad full-stack foundation into learning systems and
            autonomy that interact with the physical world.
          </p>
          <p>
            I care about reproducibility, clear interfaces, and communicating what
            is complete, what is still uncertain, and what evidence comes next.
          </p>
        </div>

        <div className="evidence-carousel section-reveal" aria-live="polite">
          <div
            className="evidence-carousel__stage"
            id="evidence-statement"
            key={evidenceIndex}
          >
            <span>How I want the work judged</span>
            <blockquote>{evidenceItems[evidenceIndex].question}</blockquote>
            <p>{evidenceItems[evidenceIndex].answer}</p>
          </div>
          <div className="evidence-carousel__controls">
            <div
              aria-label={`Statement ${evidenceIndex + 1} of ${evidenceItems.length}`}
              role="group"
            >
              {evidenceItems.map((item, index) => (
                <button
                  aria-label={`Show: ${item.question}`}
                  aria-controls="evidence-statement"
                  aria-pressed={index === evidenceIndex}
                  className={index === evidenceIndex ? "is-active" : ""}
                  key={item.question}
                  onClick={() => setEvidenceIndex(index)}
                  type="button"
                />
              ))}
            </div>
            <div>
              <button
                aria-label="Previous statement"
                onClick={showPreviousEvidence}
                type="button"
              >
                <ArrowIcon direction="back" />
              </button>
              <button
                aria-label="Next statement"
                onClick={showNextEvidence}
                type="button"
              >
                <ArrowIcon />
              </button>
            </div>
          </div>
        </div>
      </section>

      <footer className="contact" id="contact">
        <div className="contact-signal section-reveal" aria-hidden="true">
          <div className="contact-signal__orbit contact-signal__orbit--outer"><i /></div>
          <div className="contact-signal__orbit contact-signal__orbit--inner"><i /></div>
          <div className="contact-signal__core">
            <span>AI</span>
            <span>ML</span>
          </div>
          <span className="contact-signal__label">OPEN SIGNAL / MANCHESTER</span>
        </div>
        <div className="contact-grid">
          <div className="contact-copy">
            <p>What comes next</p>
            <h2>Looking for an AI/ML engineer in the making?</h2>
            <span>
              Bring me the hard system. I will make the next test visible, then
              build from what the evidence says.
            </span>
            <a
              className="button button--contact"
              href="https://github.com/xDavid673x"
              target="_blank"
              rel="noreferrer"
            >
              Start with my GitHub
              <ArrowIcon />
            </a>
          </div>

          <div className="contact-links" aria-label="Footer navigation">
            <a href="#work">Selected work</a>
            <a href="#profile">Profile</a>
            <a
              href="https://github.com/xDavid673x"
              target="_blank"
              rel="noreferrer"
            >
              GitHub profile
            </a>
            <a
              href="https://www.linkedin.com/in/david673/"
              target="_blank"
              rel="noreferrer"
            >
              LinkedIn profile
            </a>
            <a href="#top">Back to top</a>
          </div>
        </div>

        <div className="footer-wordmark" aria-label="Learn, move, ship">
          <span>LEARN</span>
          <span>MOVE</span>
          <span>SHIP</span>
        </div>
        <div className="footer-meta">
          <span>Manchester, United Kingdom</span>
          <span>Designed and engineered with evidence in view</span>
        </div>
      </footer>
    </main>
  );
}
