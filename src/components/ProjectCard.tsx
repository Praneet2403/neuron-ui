"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

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

export interface ProjectData {
  title: string;
  description: string;
  hash: string;
  tags: string[];
  siteUrl?: string;
  creditLabel?: string;
  previewImages?: string[];
  stackImages?: string[];
  category?: string;
}

interface ProjectCardProps {
  project: ProjectData;
  index: number;
  total: number;
  progressRef?: (el: SVGCircleElement | null) => void;
  gradient?: string;
  backgroundImage?: string;
}

// ── Wavy hover text (per-character wave) ──────────────────────────────────
const WavyText: React.FC<{
  text: string;
  href?: string;
  onClick?: () => void;
  fontSize?: string;
  color?: string;
  hoverColor?: string;
  fontFamily?: string;
  fontWeight?: number;
  letterSpacing?: string;
  border?: boolean;
}> = ({
  text,
  href,
  onClick,
  fontSize = "11px",
  color = "#fff",
  hoverColor,
  fontFamily,
  fontWeight = 600,
  letterSpacing = "2px",
  border = false,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const characters = text.split("");
  const h = parseInt(fontSize) + 4;

  const inner = (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: border ? "10px" : undefined,
        padding: border ? "12px 24px" : undefined,
        border: border ? "1px solid rgba(255,255,255,0.15)" : undefined,
        borderRadius: border ? "30px" : undefined,
        cursor: "pointer",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span
        style={{
          display: "inline-flex",
          height: `${h}px`,
          overflow: "hidden",
        }}
      >
        {characters.map((char, i) => (
          <span
            key={i}
            style={{
              display: "inline-block",
              overflow: "hidden",
              height: `${h}px`,
              width:
                char === " "
                  ? Math.max(parseInt(fontSize) * 0.35, 4) + "px"
                  : undefined,
            }}
          >
            <motion.span
              animate={{ y: isHovered ? -h : 0 }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 25,
                delay: i * 0.025,
              }}
              style={{ display: "block", lineHeight: `${h}px` }}
            >
              <span
                style={{
                  display: "block",
                  height: `${h}px`,
                  fontSize,
                  fontWeight,
                  letterSpacing,
                  textTransform: "uppercase",
                  color: hoverColor && isHovered ? hoverColor : color,
                  fontFamily,
                  transition: "color 0.2s",
                }}
              >
                {char === " " ? "\u00A0" : char}
              </span>
              <span
                style={{
                  display: "block",
                  height: `${h}px`,
                  fontSize,
                  fontWeight,
                  letterSpacing,
                  textTransform: "uppercase",
                  color: hoverColor || color,
                  fontFamily,
                }}
              >
                {char === " " ? "\u00A0" : char}
              </span>
            </motion.span>
          </span>
        ))}
      </span>
    </span>
  );

  if (href) {
    return (
      <a
        href={href}
        target={href.startsWith("http") ? "_blank" : undefined}
        rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
        style={{ textDecoration: "none", color: "inherit" }}
        onClick={onClick}
      >
        {inner}
      </a>
    );
  }

  return (
    <button
      onClick={onClick}
      style={{
        background: "none",
        border: "none",
        padding: 0,
        cursor: "pointer",
        color: "inherit",
      }}
    >
      {inner}
    </button>
  );
};

// ── Stacked Website Mockup Cards ──────────────────────────────────────────
const StackedMockupCards: React.FC<{ title: string; images?: string[] }> = ({
  title,
  images,
}) => {
  const [currentIdx, setCurrentIdx] = useState(0);

  // If we have images, create pages from them. Otherwise fall back to a default set.
  const defaultPages = [
    {
      label: "Homepage",
      subtitle: "Where timeless style meets modern grace.",
      image: "",
    },
    {
      label: "Collection",
      subtitle: "Discover our latest seasonal arrivals.",
      image: "",
    },
    {
      label: "About",
      subtitle: "Crafted with passion and purpose.",
      image: "",
    },
  ];

  const pages =
    images && images.length > 0
      ? images.map((img, i) => ({
          label: `View ${i + 1}`,
          subtitle: "Explore the project details and design.",
          image: img,
        }))
      : defaultPages;

  useEffect(() => {
    // Determine interval speed based on whether we have images or not
    const interval = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % pages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [pages.length]);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        perspective: "1000px", // Adds depth for 3D transforms
      }}
    >
      {pages.map((page, i) => {
        // Calculate offset for cyclic stacking
        // 0 = Active, 1 = Next, ... , last = Moving to back
        // We want a stack where 0 is front, 1 is behind, 2 is behind that...

        const relativeIndex = (i - currentIdx + pages.length) % pages.length;

        // We only show top 3 cards visually to avoid clutter, hiding others
        const isVisible = relativeIndex < 3;

        // Visual properties based on stack position
        let yOff = 0;
        let scaleVal = 1;
        let opacityVal = 1;
        let zIdx = 3;
        let blurVal = 0;
        let brightnessVal = 1;

        if (relativeIndex === 0) {
          // Front card
          yOff = 0;
          scaleVal = 1;
          opacityVal = 1;
          zIdx = 10;
          blurVal = 0;
          brightnessVal = 1;
        } else if (relativeIndex === 1) {
          // Second card
          yOff = -12; // Slightly above
          scaleVal = 0.95;
          opacityVal = 0.8;
          zIdx = 5;
          blurVal = 1; // Slight blur for depth
          brightnessVal = 0.7; // Darker
        } else if (relativeIndex === 2) {
          // Third card
          yOff = -24;
          scaleVal = 0.9;
          opacityVal = 0.5;
          zIdx = 1;
          blurVal = 2;
          brightnessVal = 0.5;
        } else {
          // Others (hidden/transitioning)
          yOff = -36;
          scaleVal = 0.85;
          opacityVal = 0;
          zIdx = 0;
        }

        return (
          <motion.div
            key={i} // Use rigid key to maintain varying stack order
            animate={{
              y: yOff,
              scale: scaleVal,
              opacity: opacityVal,
              zIndex: zIdx,
              filter: `blur(${blurVal}px) brightness(${brightnessVal})`,
            }}
            transition={{
              duration: 0.8,
              ease: [0.16, 1, 0.3, 1], // Smooth elegant ease
            }}
            style={{
              position: "absolute",
              top: "10%",
              left: "5%",
              right: "5%",
              bottom: "5%",
              borderRadius: "16px",
              background: "#1a1a1a", // Dark card base
              overflow: "hidden",
              boxShadow:
                relativeIndex === 0
                  ? "0 20px 50px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.1) inset"
                  : "none",
              pointerEvents: relativeIndex === 0 ? "auto" : "none",
            }}
          >
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                position: "relative",
              }}
            >
              {page.image ? (
                /* Full Image Mode */
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#0d0d0d",
                  }}
                >
                  {/* Image fitted with contain to show full content without compromising it */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={page.image}
                    alt={page.label}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                      display: "block",
                    }}
                  />

                  {/* Label Overlay */}
                  <div
                    style={{
                      position: "absolute",
                      bottom: "12px",
                      left: "12px",
                      padding: "4px 8px",
                      borderRadius: "4px",
                      background: "rgba(0,0,0,0.6)",
                      backdropFilter: "blur(4px)",
                      fontSize: "9px",
                      color: "#fff",
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                      pointerEvents: "none",
                    }}
                  >
                    {page.label}
                  </div>
                </div>
              ) : (
                /* Fallback (No Image) UI */
                <>
                  <div
                    style={{
                      padding: "16px 20px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      borderBottom: "1px solid rgba(255,255,255,0.05)",
                    }}
                  >
                    <div style={{ display: "flex", gap: "6px" }}>
                      {[0, 1, 2].map((d) => (
                        <div
                          key={d}
                          style={{
                            width: "6px",
                            height: "6px",
                            borderRadius: "50%",
                            background:
                              d === 0
                                ? "#ff5f56"
                                : d === 1
                                  ? "#ffbd2e"
                                  : "#27c93f",
                          }}
                        />
                      ))}
                    </div>
                    <div
                      style={{
                        fontSize: "8px",
                        color: "#555",
                        letterSpacing: "1px",
                      }}
                    >
                      NEURON UI
                    </div>
                  </div>

                  <div
                    style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      padding: "0 24px",
                      background: "#121212",
                    }}
                  >
                    <h3
                      style={{
                        fontFamily: "var(--font-serif), serif",
                        fontSize: "24px",
                        color: "#fff",
                        marginBottom: "8px",
                      }}
                    >
                      {title}
                    </h3>
                    <p style={{ fontSize: "10px", color: "#666" }}>
                      {page.subtitle}
                    </p>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

// ── Main ProjectCard Component ────────────────────────────────────────────
const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  index,
  total,
  progressRef,
  gradient,
  backgroundImage,
}) => {
  const {
    title,
    description,
    hash,
    tags,
    creditLabel = "Content Earth",
    category = "ECOMMERCE WEBSITE",
  } = project;

  const windowWidth = useWindowWidth();

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        borderRadius: "20px",
        background: gradient || "#141414",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        // Top padding clears the floating hamburger (Navbar.tsx renders it
        // fixed at top 20 / right 28, so it lands right on the category label).
        // The row below it is bottom-anchored, so this only eats slack.
        padding: windowWidth < 768 ? "56px 16px 16px" : "60px 40px 32px",
        color: "#fff",
        boxShadow:
          "0 4px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.03)",
      }}
    >
      {/* Background image layer */}
      {backgroundImage && (
        <>
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: `url(${backgroundImage})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              borderRadius: "inherit",
              zIndex: 0,
              filter: "blur(20px)",
              transform: "scale(1.05)",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.75) 60%, rgba(0,0,0,0.85) 100%)",
              borderRadius: "inherit",
              zIndex: 0,
            }}
          />
        </>
      )}

      {/* Noise texture */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.04,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      {/* ═══════════ TOP ROW ═══════════ */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "flex-start",
          marginBottom: "auto",
        }}
      >
        {/* Right side: Category + Tags */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: "10px",
          }}
        >
          <span
            style={{
              fontSize: "11px",
              fontWeight: 500,
              letterSpacing: "3px",
              color: "rgba(255,255,255,0.7)",
              textTransform: "uppercase",
            }}
          >
            {category}
          </span>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0",
            }}
          >
            {tags.map((tag, i) => (
              <React.Fragment key={tag}>
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 500,
                    letterSpacing: "1.5px",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.45)",
                  }}
                >
                  {tag}
                </span>
                {i < tags.length - 1 && (
                  <span
                    style={{
                      margin: "0 8px",
                      color: "rgba(255,255,255,0.2)",
                      fontSize: "10px",
                    }}
                  >
                    ·
                  </span>
                )}
              </React.Fragment>
            ))}
          </div>

          <div
            style={{
              width: "100%",
              height: "1px",
              background: "rgba(255,255,255,0.08)",
              marginTop: "4px",
            }}
          />
        </div>

        {/* Decorative menu icon */}
        {/* <div
          style={{
            marginLeft: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "3px",
            paddingTop: "4px",
          }}
        >
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                width: "16px",
                height: "1.5px",
                backgroundColor: "rgba(255,255,255,0.5)",
                borderRadius: "1px",
              }}
            />
          ))}
        </div> */}
      </div>

      {/* ═══════════ MAIN CONTENT (bottom area) ═══════════ */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          display: "grid",
          gridTemplateColumns: windowWidth < 768 ? "1fr" : "1fr 1fr",
          gap: windowWidth < 768 ? "24px" : "40px",
          alignItems: "end",
          flex: 1,
        }}
      >
        {/* Left column: Title + Description + CTA */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            gap: "0",
          }}
        >
          <h2
            style={{
              fontFamily: "var(--font-serif), 'DM Serif Display', serif",
              fontSize: "clamp(48px, 5vw, 80px)",
              fontWeight: 400,
              lineHeight: 1.0,
              marginBottom: "20px",
              color: "#fff",
              letterSpacing: "-1px",
            }}
          >
            {title}
          </h2>
          <p
            style={{
              fontSize: "13px",
              lineHeight: 1.7,
              color: "rgba(255,255,255,0.55)",
              maxWidth: "380px",
              marginBottom: "28px",
            }}
          >
            {description}
          </p>
          <WavyText
            text="VISIT SITE"
            href={project.siteUrl || "#"}
            fontSize="11px"
            border
          />
        </div>

        {/* Right column: Stacked mockup cards (hidden on small mobile) */}
        {windowWidth >= 600 && (
          <div
            style={{
              position: "relative",
              height: "100%",
              minHeight: "220px",
              maxHeight: "380px",
            }}
          >
            <StackedMockupCards title={title} images={project.stackImages} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectCard;
