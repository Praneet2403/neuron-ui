"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

// ── Hook: track window width for responsive logic ──────────────────────
function useWindowWidth() {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const update = () => setWidth(window.innerWidth);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return width;
}

// ── Menu items for the fullscreen overlay ──────────────────────────────────
const menuItems = [
  { name: "Home", href: "#hero" },
  { name: "Projects", href: "#projects" },
  { name: "Services", href: "#services" },
  { name: "Testimonials", href: "#testimonials" },
  { name: "Contact", href: "#contact" },
];

// ── Wavy menu link (large, per-character spring wave) ──────────────────────
function WavyMenuLink({
  name,
  href,
  index,
  onClose,
}: {
  name: string;
  href: string;
  index: number;
  onClose: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const characters = name.split("");
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const lineH = isMobile ? 40 : 56;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onClose();

    // Scroll to section after overlay closes
    setTimeout(() => {
      const el = document.querySelector(href);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      } else if (href === "#hero") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }, 400);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{
        delay: 0.15 + index * 0.07,
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      <a
        href={href}
        onClick={handleClick}
        style={{
          textDecoration: "none",
          color: "inherit",
          display: "block",
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <span
          style={{
            display: "inline-flex",
            height: `${lineH}px`,
            overflow: "hidden",
            cursor: "pointer",
          }}
        >
          {characters.map((char, i) => (
            <span
              key={i}
              style={{
                display: "inline-block",
                overflow: "hidden",
                height: `${lineH}px`,
                width: char === " " ? "16px" : undefined,
              }}
            >
              <motion.span
                animate={{ y: isHovered ? -lineH : 0 }}
                transition={{
                  type: "spring",
                  stiffness: 350,
                  damping: 25,
                  delay: i * 0.02,
                }}
                style={{
                  display: "block",
                  lineHeight: `${lineH}px`,
                }}
              >
                <span
                  style={{
                    display: "block",
                    height: `${lineH}px`,
                    fontSize: "clamp(24px, 5vw, 48px)",
                    fontWeight: 500,
                    letterSpacing: "3px",
                    textTransform: "uppercase",
                    color: isHovered
                      ? "#fff"
                      : "rgba(255,255,255,0.45)",
                    fontFamily:
                      "'SF Mono', 'Fira Code', 'Cascadia Code', monospace",
                    transition: "color 0.15s",
                  }}
                >
                  {char === " " ? "\u00A0" : char}
                </span>
                <span
                  style={{
                    display: "block",
                    height: `${lineH}px`,
                    fontSize: "clamp(24px, 5vw, 48px)",
                    fontWeight: 500,
                    letterSpacing: isMobile ? "1px" : "3px",
                    textTransform: "uppercase",
                    color: "#fff",
                    fontFamily:
                      "'SF Mono', 'Fira Code', 'Cascadia Code', monospace",
                  }}
                >
                  {char === " " ? "\u00A0" : char}
                </span>
              </motion.span>
            </span>
          ))}
        </span>
      </a>
    </motion.div>
  );
}

// ── Small wavy nav link (for the top bar) ──────────────────────────────────
function NavLink({ name, href }: { name: string; href: string }) {
  const [isHovered, setIsHovered] = useState(false);
  const characters = name.split("");
  const lineH = 20;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.querySelector(href);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    } else if (href === "#hero") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <a
      href={href}
      onClick={handleClick}
      style={{
        position: "relative",
        color: isHovered ? "#fff" : "#ccc",
        fontSize: "14px",
        fontWeight: 500,
        textDecoration: "none",
        display: "inline-flex",
        height: `${lineH}px`,
        alignItems: "center",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {characters.map((char, i) => (
        <span
          key={i}
          style={{
            display: "inline-block",
            overflow: "hidden",
            height: `${lineH}px`,
            width: char === " " ? "4px" : undefined,
          }}
        >
          <motion.span
            animate={{ y: isHovered ? -lineH : 0 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 25,
              delay: i * 0.025,
            }}
            style={{ display: "block", lineHeight: `${lineH}px` }}
          >
            <span style={{ display: "block", height: `${lineH}px` }}>
              {char === " " ? "\u00A0" : char}
            </span>
            <span style={{ display: "block", height: `${lineH}px` }}>
              {char === " " ? "\u00A0" : char}
            </span>
          </motion.span>
        </span>
      ))}
    </a>
  );
}

// ── Animated Hamburger (4 lines → X morph) ─────────────────────────────────
function HamburgerButton({
  isOpen,
  onClick,
}: {
  isOpen: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      style={{
        background: "transparent",
        border: "none",
        cursor: "pointer",
        padding: "6px",
        display: "flex",
        flexDirection: "column",
        gap: "4px",
        zIndex: 201,
        position: "relative",
      }}
      aria-label={isOpen ? "Close menu" : "Open menu"}
    >
      {[0, 1, 2, 3].map((i) => (
        <motion.div
          key={i}
          animate={{
            rotate: isOpen ? (i === 0 || i === 1 ? 45 : -45) : 0,
            opacity: isOpen && (i === 1 || i === 2) ? 0 : 1,
            y: isOpen ? (i === 0 ? 8 : i === 3 ? -8 : 0) : 0,
            width: isOpen ? 20 : i === 1 || i === 2 ? 14 : 20,
          }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          style={{
            height: "1.5px",
            backgroundColor: "#fff",
            borderRadius: "2px",
            transformOrigin: "center",
          }}
        />
      ))}
    </motion.button>
  );
}

// ── Fullscreen Menu Overlay ────────────────────────────────────────────────
function FullscreenMenuOverlay({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  // Lock body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 199,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          {/* Blurred dark backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(10, 10, 10, 0.55)",
              backdropFilter: "blur(40px)",
              WebkitBackdropFilter: "blur(40px)",
            }}
          />

          {/* Subtle gradient accent */}
          <div
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: "50%",
              height: "100%",
              background:
                "radial-gradient(ellipse at top right, rgba(17, 69, 160, 0.08) 0%, transparent 60%)",
              pointerEvents: "none",
            }}
          />

          {/* Menu content */}
          <div
            style={{
              position: "relative",
              zIndex: 200,
              padding: "100px 24px 40px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              // maxWidth: "1400px",
            }}
          >
            {/* Section label */}
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.1, duration: 0.3 }}
              style={{
                fontSize: "10px",
                fontWeight: 600,
                letterSpacing: "4px",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.2)",
                marginBottom: "24px",
                paddingLeft: "4px",
              }}
            >
              NAVIGATION
            </motion.span>

            {/* Menu links */}
            {menuItems.map((item, i) => (
              <WavyMenuLink
                key={item.name}
                name={item.name}
                href={item.href}
                index={i}
                onClose={onClose}
              />
            ))}

            {/* Bottom info row */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.55, duration: 0.3 }}
              style={{
                marginTop: "48px",
                paddingTop: "24px",
                borderTop: "1px solid rgba(255,255,255,0.06)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontSize: "11px",
                  letterSpacing: "2px",
                  color: "rgba(255,255,255,0.25)",
                  textTransform: "uppercase",
                }}
              >
                hello@neuronui.com
              </span>
              <span
                style={{
                  fontSize: "11px",
                  letterSpacing: "2px",
                  color: "rgba(255,255,255,0.25)",
                  textTransform: "uppercase",
                }}
              >
                © {new Date().getFullYear()} NeuronUI
              </span>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Main Navbar ────────────────────────────────────────────────────────────
export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const windowWidth = useWindowWidth();
  const isMobile = windowWidth > 0 && windowWidth < 768;

  // Listen for custom event to hide navbar when Hero frames start
  useEffect(() => {
    const handleHide = () => setIsHidden(true);
    const handleShow = () => setIsHidden(false);

    window.addEventListener("navbar:hide", handleHide);
    window.addEventListener("navbar:show", handleShow);

    return () => {
      window.removeEventListener("navbar:hide", handleHide);
      window.removeEventListener("navbar:show", handleShow);
    };
  }, []);

  // Fallback: show hamburger when scrolled past 80vh (ensures visibility in project cards)
  useEffect(() => {
    const onScroll = () => {
      const scrollY = window.scrollY;
      const threshold = window.innerHeight * 0.8;
      if (scrollY > threshold && !isHidden) {
        setIsHidden(true);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHidden]);

  return (
    <>
      {/* ─── Standard Navbar (visible during Hero only) ─── */}
      <motion.nav
        initial={{ y: 0, x: "-50%", opacity: 1 }}
        animate={{
          y: isHidden ? -100 : 0,
          x: "-50%",
          opacity: isHidden ? 0 : 1,
        }}
        transition={{
          duration: 0.5,
          ease: [0.22, 1, 0.36, 1],
        }}
        style={{
          position: "fixed",
          top: "16px",
          left: "50%",
          zIndex: 200,
          width: "92%",
          maxWidth: "900px",
          backgroundColor: "#1a1a1a",
          borderRadius: "12px",
          padding: "10px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
          pointerEvents: isHidden ? "none" : "auto",
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          style={{
            color: "#fff",
            fontWeight: 800,
            fontSize: "18px",
            letterSpacing: "-0.5px",
            textDecoration: "none",
          }}
        >
          NeuronUI
        </Link>

        {/* Center links (hidden on mobile) */}
        {!isMobile && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "28px",
            }}
          >
            <NavLink name="Projects" href="#projects" />
            <NavLink name="Services" href="#services" />
            <NavLink name="Testimonials" href="#testimonials" />
          </div>
        )}

        {/* CTA (hidden on mobile) */}
        {!isMobile ? (
          <a
            href="#contact"
            onClick={(e) => {
              e.preventDefault();
              const el = document.querySelector("#contact");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
            style={{
              backgroundColor: "#1145A0",
              color: "#fff",
              fontSize: "13px",
              fontWeight: 600,
              padding: "8px 20px",
              borderRadius: "8px",
              textDecoration: "none",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#0d3680")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "#1145A0")
            }
          >
            Book a Demo
          </a>
        ) : <div />}
      </motion.nav>

      {/* ─── Standalone Hamburger (appears when scrolled past hero) ─── */}
      <AnimatePresence>
        {(isHidden || menuOpen) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: "fixed",
              top: isMobile ? "12px" : "20px",
              right: isMobile ? "12px" : "28px",
              zIndex: 9999,
              backgroundColor: "rgba(26, 26, 26, 0.7)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              borderRadius: "12px",
              padding: "8px",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
            }}
          >
            <HamburgerButton
              isOpen={menuOpen}
              onClick={() => setMenuOpen(!menuOpen)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Fullscreen Menu Overlay ─── */}
      <FullscreenMenuOverlay
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
      />
    </>
  );
}
