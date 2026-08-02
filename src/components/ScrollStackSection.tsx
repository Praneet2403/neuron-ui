"use client";

import React, { useRef, useEffect, useCallback, useState } from "react";
import ProjectCard, { type ProjectData } from "./ProjectCard";

// Hook: window width for responsive layout
function useWindowWidth() {
  const [w, setW] = useState(1024);
  useEffect(() => {
    const u = () => setW(window.innerWidth);
    u();
    window.addEventListener("resize", u);
    return () => window.removeEventListener("resize", u);
  }, []);
  return w;
}

const projects: ProjectData[] = [
  {
    title: "Modevelle",
    description:
      "A demo e-commerce website for women's fashion, featuring product listings, cart functionality, and user authentication. Built using Next.js and the Shopify Storefront API.",
    hash: "EC4TM4BC50NS6A000",
    tags: ["NEXTJS", "SHOPIFY STOREFRONT API", "GSAP"],
    creditLabel: "Content Earth",
    category: "ECOMMERCE WEBSITE",
    stackImages: [
      "/site1/ina2.png",
      "/site1/ina4.png",
      "/site1/ins.png",
      "/site1/ins1.png",
      "/site1/ins3.png",
      "/site1/ins5.png",
    ],
  },
  {
    title: "Aetheria",
    description:
      "An immersive portfolio experience for creative agencies, with smooth page transitions, 3D elements, and a dynamic project showcase. Powered by Three.js and GSAP.",
    hash: "7F2BA9DC41E8F3B02",
    tags: ["THREE.JS", "GSAP", "WEBGL"],
    creditLabel: "Digital Nomad",
    category: "PORTFOLIO EXPERIENCE",
    stackImages: ["/site2/sol1.png", "/site2/sol2.png", "/site2/sol3.png"],
  },
  {
    title: "Nocturn",
    description:
      "A real-time analytics dashboard for SaaS products, offering live metrics, custom report builders, and team collaboration features. Built with React and D3.js.",
    hash: "A91CD5E823FA07D44",
    tags: ["REACT", "D3.JS", "WEBSOCKET"],
    creditLabel: "Metric Labs",
    category: "ANALYTICS DASHBOARD",
    stackImages: ["/site3/housie1.png", "/site3/housie2.png"],
  },
  {
    title: "Verdant",
    description:
      "A sustainable marketplace connecting local artisans with conscious consumers. Features include carbon tracking, artisan profiles, and curated collections.",
    hash: "3E8F1C6DA20B94E77",
    tags: ["NEXT.JS", "STRIPE", "PRISMA"],
    creditLabel: "Green Studio",
    category: "SUSTAINABLE MARKETPLACE",
  },
];

const CARD_MARGIN = 16;
const VH_PER_CARD = 100;
const EXTRA_VH = 40;
const TOTAL_HEIGHT_VH = projects.length * VH_PER_CARD + EXTRA_VH;
const TOTAL_CARDS = projects.length;

// ── Progress circle config (larger, like reference image) ─────────────────
const PROGRESS_SIZE = 140;
const PROGRESS_RADIUS = 60;
const PROGRESS_CIRCUMFERENCE = 2 * Math.PI * PROGRESS_RADIUS;

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

// Smoother easing for card transitions
function easeOutQuart(t: number) {
  return 1 - (1 - t) ** 4;
}

// ── Per-card glassmorphism gradients (semi-transparent for blur to show) ──
const cardGradients = [
  "linear-gradient(160deg, rgba(12,26,46,0.75) 0%, rgba(15,31,53,0.7) 40%, rgba(22,45,74,0.65) 100%)",
  "linear-gradient(160deg, rgba(30,10,46,0.75) 0%, rgba(42,16,64,0.7) 40%, rgba(61,24,96,0.65) 100%)",
  "linear-gradient(160deg, rgba(10,46,42,0.75) 0%, rgba(14,61,56,0.7) 40%, rgba(20,90,82,0.65) 100%)",
  "linear-gradient(160deg, rgba(46,26,10,0.75) 0%, rgba(64,40,16,0.7) 40%, rgba(96,64,24,0.65) 100%)",
];

// ── Per-card background images (blurred behind gradient) ──
const cardBackgroundImages = [
  "/site1/ina2.png",
  "/site2/sol1.png",
  "/site3/housie1.png",
  "/site1/ina2.png",
];

const ScrollStackSection: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const progressCircleRef = useRef<SVGCircleElement>(null);
  const progressNumberRef = useRef<HTMLSpanElement>(null);
  const rafId = useRef(0);
  const lastProgress = useRef(-1);
  const windowWidth = useWindowWidth();
  const isMobile = windowWidth > 0 && windowWidth < 768;

  const CARD_MARGIN_RESPONSIVE = isMobile ? 8 : CARD_MARGIN;
  const PROGRESS_SIZE_R = isMobile ? 90 : PROGRESS_SIZE;
  const PROGRESS_RADIUS_R = isMobile ? 36 : PROGRESS_RADIUS;
  const PROGRESS_CIRCUMFERENCE_R = 2 * Math.PI * PROGRESS_RADIUS_R;

  const lastActiveIdx = useRef(-1);

  const setCardRef = useCallback((el: HTMLDivElement | null, i: number) => {
    cardRefs.current[i] = el;
  }, []);

  useEffect(() => {
    // Smooth interpolation target for scroll progress
    let currentSmooth = 0;
    let isVisible = false;

    // Only run the loop while the section is near the viewport. Without this
    // the rAF ran for the life of the page, competing with every other section.
    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
        if (isVisible && !rafId.current) {
          rafId.current = requestAnimationFrame(update);
        }
      },
      { rootMargin: "200px" },
    );

    const update = () => {
      const section = sectionRef.current;
      if (!isVisible || !section) {
        rafId.current = 0;
        return;
      }

      const rect = section.getBoundingClientRect();
      const vh = window.innerHeight;

      const scrolled = -rect.top;
      const range = section.offsetHeight - vh;
      const targetProgress = clamp01(scrolled / range);

      // Lerp for smooth interpolation (creates the "slight delay" feel)
      currentSmooth += (targetProgress - currentSmooth) * 0.08;

      // Use smooth value for animations
      const progress = currentSmooth;

      // Skip if progress hasn't changed significantly (perf optimization)
      if (Math.abs(progress - lastProgress.current) < 0.0002) {
        rafId.current = requestAnimationFrame(update);
        return;
      }
      lastProgress.current = progress;

      // Compute which card is "active" (most recent one entering)
      let activeIdx = 0;
      for (let i = TOTAL_CARDS - 1; i >= 0; i--) {
        const cs = (i * VH_PER_CARD) / (TOTAL_CARDS * VH_PER_CARD + EXTRA_VH);
        if (progress >= cs) {
          activeIdx = i;
          break;
        }
      }

      // ── Update global progress circle (only when the card changes) ──
      if (activeIdx !== lastActiveIdx.current) {
        lastActiveIdx.current = activeIdx;
        const circle = progressCircleRef.current;
        const numSpan = progressNumberRef.current;
        if (circle) {
          const fillFraction = (activeIdx + 1) / TOTAL_CARDS;
          const offset = PROGRESS_CIRCUMFERENCE_R * (1 - fillFraction);
          circle.style.strokeDashoffset = String(offset);
        }
        if (numSpan) {
          numSpan.textContent = String(activeIdx + 1).padStart(2, "0");
        }
      }

      // ── Update card transforms ─────────────────────────────────────
      for (let i = 0; i < TOTAL_CARDS; i++) {
        const card = cardRefs.current[i];
        if (!card) continue;

        const cardStart =
          (i * VH_PER_CARD) / (TOTAL_CARDS * VH_PER_CARD + EXTRA_VH);
        const cardPhaseLen =
          VH_PER_CARD / (TOTAL_CARDS * VH_PER_CARD + EXTRA_VH);

        if (progress < cardStart && i !== 0) {
          card.style.opacity = "0";
          card.style.transform = "translateY(100%)";
          card.style.zIndex = String(i + 1);
        } else {
          let enterProgress = clamp01(
            (progress - cardStart) / (cardPhaseLen * 0.5),
          );

          // Force first card to be fully visible immediately
          if (i === 0) enterProgress = 1;

          const easedEnter = easeOutQuart(enterProgress);

          if (i <= activeIdx && enterProgress >= 1) {
            if (i < activeIdx) {
              // Behind: scale down smoothly as next card enters
              const nextStart =
                ((i + 1) * VH_PER_CARD) /
                (TOTAL_CARDS * VH_PER_CARD + EXTRA_VH);
              const nextEnterProgress = clamp01(
                (progress - nextStart) / (cardPhaseLen * 0.5),
              );
              const behindCount = activeIdx - i;
              const targetScale = Math.max(0.85, 1 - behindCount * 0.05);
              const currentScale =
                1 - (1 - targetScale) * easeOutQuart(nextEnterProgress);
              card.style.transform = `scale(${currentScale})`;
              card.style.transformOrigin = "center top";
              card.style.opacity = String(
                Math.max(0.6, 1 - behindCount * 0.12),
              );
            } else {
              // Active card: full size
              card.style.transform = "translateY(0%) scale(1)";
              card.style.opacity = "1";
            }
          } else {
            // Entering: slide up from below with smooth easing
            const yOffset = (1 - easedEnter) * 100;
            card.style.opacity = String(Math.min(1, easedEnter * 2));
            card.style.transform = `translateY(${yOffset}%)`;
          }
          card.style.zIndex = String(i + 1);
        }
      }

      // Continue the animation loop
      rafId.current = requestAnimationFrame(update);
    };

    if (sectionRef.current) observer.observe(sectionRef.current);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(rafId.current);
      rafId.current = 0;
    };
  }, [PROGRESS_CIRCUMFERENCE_R]);

  return (
    <section
      ref={sectionRef}
      style={{
        position: "relative",
        height: `${TOTAL_HEIGHT_VH}vh`,
        backgroundColor: "#0a0a0a",
      }}
    >
      <div
        style={{
          position: "sticky",
          top: 0,
          width: "100%",
          height: "100vh",
          overflow: "hidden",
        }}
      >
        {/* ── Single Floating Progress Circle (highest z-index) ──────── */}
        <div
          style={{
            position: "absolute",
            top: isMobile ? "16px" : "32px",
            left: isMobile ? "16px" : "36px",
            zIndex: 100,
            width: `${PROGRESS_SIZE_R}px`,
            height: `${PROGRESS_SIZE_R}px`,
            pointerEvents: "none",
          }}
        >
          <svg
            width={PROGRESS_SIZE_R}
            height={PROGRESS_SIZE_R}
            viewBox={`0 0 ${PROGRESS_SIZE_R} ${PROGRESS_SIZE_R}`}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              transform: "rotate(-90deg)",
            }}
          >
            {/* Background circle */}
            <circle
              cx={PROGRESS_SIZE_R / 2}
              cy={PROGRESS_SIZE_R / 2}
              r={PROGRESS_RADIUS_R}
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="1.5"
            />
            {/* Progress arc */}
            <circle
              ref={progressCircleRef}
              cx={PROGRESS_SIZE_R / 2}
              cy={PROGRESS_SIZE_R / 2}
              r={PROGRESS_RADIUS_R}
              fill="none"
              stroke="rgba(255,255,255,0.5)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeDasharray={PROGRESS_CIRCUMFERENCE_R}
              strokeDashoffset={PROGRESS_CIRCUMFERENCE_R}
              style={{ transition: "stroke-dashoffset 0.6s ease" }}
            />
          </svg>
          {/* Number inside circle */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "2px",
            }}
          >
            <span
              style={{
                fontSize: "10px",
                letterSpacing: "2.5px",
                color: "rgba(255,255,255,0.4)",
                fontWeight: 500,
                textTransform: "uppercase",
                lineHeight: 1,
                display: isMobile ? "none" : "block",
              }}
            >
              PROJECT
            </span>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: "8px",
              }}
            >
              <span
                ref={progressNumberRef}
                style={{
                  fontSize: isMobile ? "20px" : "28px",
                  fontWeight: 600,
                  color: "#fff",
                  lineHeight: 1,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                01
              </span>
              <span
                style={{
                  fontSize: isMobile ? "12px" : "16px",
                  color: "rgba(255,255,255,0.25)",
                  fontWeight: 300,
                }}
              >
                |
              </span>
              <span
                style={{
                  fontSize: isMobile ? "12px" : "16px",
                  color: "rgba(255,255,255,0.35)",
                  fontWeight: 400,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {String(TOTAL_CARDS).padStart(2, "0")}
              </span>
            </div>
          </div>
        </div>

        {/* ── Card Container ─────────────────────────────────────────── */}
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            padding: `${CARD_MARGIN_RESPONSIVE}px`,
          }}
        >
          {projects.map((project, i) => (
            <div
              key={project.hash}
              ref={(el) => setCardRef(el, i)}
              style={{
                position: i === 0 ? "relative" : "absolute",
                top: i === 0 ? 0 : `${CARD_MARGIN_RESPONSIVE}px`,
                left: i === 0 ? undefined : `${CARD_MARGIN_RESPONSIVE}px`,
                right: i === 0 ? undefined : `${CARD_MARGIN_RESPONSIVE}px`,
                bottom: i === 0 ? undefined : `${CARD_MARGIN_RESPONSIVE}px`,
                width: i === 0 ? "100%" : undefined,
                height: i === 0 ? "100%" : undefined,
                opacity: i === 0 ? 1 : 0,
                transform: i === 0 ? "none" : "translateY(100%)",
                willChange: "transform, opacity",
                zIndex: i + 1,
                // ── Glassmorphism blur on each card ──
                borderRadius: "20px",
                overflow: "hidden",
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
              }}
            >
              <ProjectCard
                project={project}
                index={i}
                total={projects.length}
                gradient={cardGradients[i]}
                backgroundImage={cardBackgroundImages[i]}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ScrollStackSection;
