"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";

// Each slide stands for one of the three disciplines the studio sells, so the
// carousel reads as a statement of services rather than three unlabelled images.
export const slides = [
  {
    src: "/frames-01/ezgif-frame-001.jpg",
    alt: "Storefront interface design",
    discipline: "Commerce",
    note: "Storefronts that carry a catalogue and convert",
  },
  {
    src: "/images/carousel-2.png",
    alt: "Product dashboard interface design",
    discipline: "Product",
    note: "Dashboards, tools, and the screens teams live in",
  },
  {
    src: "/images/carousel-3.png",
    alt: "Brand site interface design",
    discipline: "Brand",
    note: "Sites that make a name feel like something",
  },
];

const images = slides;

function getCarouselConfig(windowWidth: number) {
  if (windowWidth < 480) {
    return { cardWidth: 200, cardGap: 30, showSide: false };
  } else if (windowWidth < 768) {
    return { cardWidth: 260, cardGap: 50, showSide: true };
  } else {
    return { cardWidth: 340, cardGap: 120, showSide: true };
  }
}

const arrowStyle: React.CSSProperties = {
  position: "absolute",
  zIndex: 60,
  width: "44px",
  height: "44px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "50%",
  backgroundColor: "rgba(255,255,255,0.85)",
  border: "1px solid rgba(26,26,26,0.12)",
  cursor: "pointer",
  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  transition: "background-color 0.2s ease, border-color 0.2s ease",
};

export default function Carousel({
  index,
  onIndexChange,
  // "wide" spreads the side cards out on either side; "deck" tucks them behind
  // the centre card as a fan, so the whole unit fits a half-width column.
  layout = "wide",
  showArrows = true,
}: {
  index?: number;
  onIndexChange?: (i: number) => void;
  layout?: "wide" | "deck";
  showArrows?: boolean;
} = {}) {
  const [internalIndex, setInternalIndex] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [windowWidth, setWindowWidth] = useState(1024);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Controlled when the parent passes `index` — it owns the state and renders
  // its own controls. Uncontrolled otherwise, so existing usage keeps working.
  const isControlled = index !== undefined;
  const currentIndex = isControlled ? index : internalIndex;

  useEffect(() => {
    const update = () => setWindowWidth(window.innerWidth);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // The cards bob continuously. That is decorative, so it has to stop entirely
  // under reduced-motion — the global CSS override can't reach a JS animation.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const { cardWidth, cardGap, showSide } = getCarouselConfig(windowWidth);

  const isDeck = layout === "deck";
  const sideX = isDeck
    ? Math.round(cardWidth * 0.42)
    : cardWidth + cardGap;
  const sideScale = isDeck ? 0.84 : 0.82;
  const sideRotate = isDeck ? 7 : 5;
  const sideOpacity = showSide ? (isDeck ? 0.7 : 0.85) : 0;

  const positionConfigs = {
    left: {
      x: -sideX,
      scale: sideScale,
      rotate: -sideRotate,
      zIndex: 5,
      opacity: sideOpacity,
    },
    center: {
      x: 0,
      scale: 1,
      rotate: 0,
      zIndex: 15,
      opacity: 1,
    },
    right: {
      x: sideX,
      scale: sideScale,
      rotate: sideRotate,
      zIndex: 5,
      opacity: sideOpacity,
    },
  };

  const goTo = (i: number) => {
    if (!isControlled) setInternalIndex(i);
    onIndexChange?.(i);
  };
  const nextSlide = () => goTo((currentIndex + 1) % images.length);
  const prevSlide = () =>
    goTo((currentIndex - 1 + images.length) % images.length);

  const getPosition = (idx: number): "left" | "center" | "right" | "hidden" => {
    const prev = (currentIndex - 1 + images.length) % images.length;
    const next = (currentIndex + 1) % images.length;
    if (idx === currentIndex) return "center";
    if (idx === prev) return "left";
    if (idx === next) return "right";
    return "hidden";
  };

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Arrows — 44px hit area per touch-target minimum, even though the
          painted circle is smaller. Suppressed when the parent renders its own. */}
      {showArrows && (
        <>
          <button
            onClick={prevSlide}
            aria-label="Previous slide"
            style={{
              ...arrowStyle,
              left: `max(0px, calc(50% - ${cardWidth / 2 + 48}px))`,
            }}
          >
            <ChevronLeft size={18} color="#4A443E" />
          </button>

          <button
            onClick={nextSlide}
            aria-label="Next slide"
            style={{
              ...arrowStyle,
              right: `max(0px, calc(50% - ${cardWidth / 2 + 48}px))`,
            }}
          >
            <ChevronRight size={18} color="#4A443E" />
          </button>
        </>
      )}

      {/* Cards */}
      {images.map((img, i) => {
        const position = getPosition(i);
        if (position === "hidden") return null;

        const config = positionConfigs[position];
        const isCenter = position === "center";
        const isHovered = hoveredIndex === i;

        // Float params per position for organic bobbing
        const floatDuration =
          position === "left" ? 4 : position === "center" ? 3.5 : 3;
        const floatDelay =
          position === "left" ? 0 : position === "center" ? 0.5 : 1;
        const floatRange = position === "center" ? 12 : 8;

        return (
          // Positioning wrapper
          <motion.div
            key={img.src}
            animate={{
              x: config.x,
              scale: isHovered ? config.scale * 1.03 : config.scale,
              rotate: isHovered ? 0 : config.rotate,
              opacity: config.opacity,
            }}
            transition={{ type: "spring", stiffness: 250, damping: 28 }}
            style={{
              position: "absolute",
              zIndex: isHovered ? 40 : config.zIndex,
              cursor: isCenter ? "default" : "pointer",
            }}
            onClick={() => {
              // Click side cards to select them
              if (!isCenter) goTo(i);
            }}
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            {/* Float wrapper - continuous bobbing */}
            <motion.div
              animate={
                reducedMotion
                  ? { y: 0 }
                  : { y: [0, -floatRange, 0, floatRange * 0.5, 0] }
              }
              transition={
                reducedMotion
                  ? { duration: 0 }
                  : {
                      duration: floatDuration,
                      repeat: Infinity,
                      repeatType: "loop",
                      ease: "easeInOut",
                      delay: floatDelay,
                    }
              }
            >
              {/* Card */}
              <div
                style={{
                  position: "relative",
                  width: `${cardWidth}px`,
                  aspectRatio: "16 / 10",
                }}
              >
                {/* Image */}
                <div
                  style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    borderRadius: "12px",
                    overflow: "hidden",
                    boxShadow: isHovered
                      ? "0 20px 60px rgba(0,0,0,0.3)"
                      : "0 10px 40px rgba(0,0,0,0.15)",
                    filter: isCenter
                      ? "grayscale(0%)"
                      : isHovered
                        ? "grayscale(30%)"
                        : "grayscale(100%)",
                    transition: "filter 0.4s ease, box-shadow 0.3s ease",
                  }}
                >
                  <Image
                    src={img.src}
                    alt={img.alt}
                    fill
                    style={{ objectFit: "cover" }}
                    // The centre card is the hero's LCP element, so the first
                    // slide loads eagerly. `sizes` mirrors getCarouselConfig —
                    // a flat 340px made phones download 1.7x the pixels they
                    // paint.
                    priority={i === 0}
                    sizes="(max-width: 480px) 200px, (max-width: 768px) 260px, 340px"
                  />

                  {/* Subtle glow ring on hover for side cards */}
                  {isHovered && !isCenter && (
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        border: "2px solid rgba(255,255,255,0.3)",
                        borderRadius: "12px",
                        pointerEvents: "none",
                      }}
                    />
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        );
      })}

    </div>
  );
}
