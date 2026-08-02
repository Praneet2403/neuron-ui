"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Carousel, { slides } from "./Carousel";
// Navbar moved to page.tsx to avoid stacking context issues with sticky/overflow:hidden

// ── Studio status ───────────────────────────────────────────────────
// EDIT THESE. They are the hero's trust signal, so stale values cost more
// than no values. `AVAILABILITY` is the line prospects read first.
const AVAILABILITY = "Available — 2 build slots, Q4";
const STUDIO_TZ = "Asia/Kolkata";
const STUDIO_TZ_LABEL = "IST";

// Stacks pulled from the projects in ScrollStackSection — real work, not logos.
const STACK = [
  "NEXT.JS",
  "SHOPIFY",
  "THREE.JS",
  "WEBGL",
  "GSAP",
  "REACT",
  "D3.JS",
  "WEBSOCKET",
  "STRIPE",
  "PRISMA",
];

const MONO = "'SF Mono', 'Fira Code', 'Cascadia Code', monospace";

// ── Config ──────────────────────────────────────────────────────────
const FRAME_COUNT = 240;
const SECTION_HEIGHT_VH = 950; // One tall section for everything

// Frames stream in progressively. The hero becomes interactive once this many
// are decoded rather than waiting on all 240 (which was ~11MB of blocking JPG).
const READY_FRAMES = 16;
const LOAD_CONCURRENCY = 8;

// Carousel center card (must match Carousel.tsx)
const CARD_WIDTH = 340;
const CARD_HEIGHT = CARD_WIDTH * (10 / 16); // 212.5px
const CARD_RADIUS = 12;

// Fallback dimensions for the clip-path zoom, used only if the live anchor
// can't be measured. The real origin comes from `offsetWithin` below.
function getCardDims(w: number) {
  if (w < 480) return { cw: 200, ch: 200 * (10 / 16) };
  if (w < 768) return { cw: 260, ch: 260 * (10 / 16) };
  return { cw: CARD_WIDTH, ch: CARD_HEIGHT };
}

// Position of `el` inside `root`, in CSS pixels.
//
// getBoundingClientRect would be the obvious tool, but the hero translates and
// scales the whole content wrapper while the zoom is running, so a rect read
// mid-animation is wrong. offsetLeft/offsetTop walk the offsetParent chain and
// ignore transforms entirely, which is exactly what the zoom origin needs.
function offsetWithin(el: HTMLElement, root: HTMLElement) {
  let x = 0;
  let y = 0;
  let node: HTMLElement | null = el;
  while (node && node !== root) {
    x += node.offsetLeft;
    y += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return { x, y, w: el.offsetWidth, h: el.offsetHeight };
}

// Scroll phase boundaries (fraction of total scrollable range)
const CONTENT_FADE_START = 0.04;
const CONTENT_FADE_END = 0.15;
const CANVAS_APPEAR = 0.06;
const CANVAS_SOLID = 0.10;
const ZOOM_START = 0.06;
const ZOOM_END = 0.20;
const FRAMES_START = 0.20;
const FRAMES_END = 0.85;
const ZOOMOUT_START = 0.85;
const BG_START = 0.08;
const BG_END = 0.20;

// ── Helpers ─────────────────────────────────────────────────────────
function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}
function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}
function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3;
}
function frameSrc(i: number, tier: "hd" | "sd") {
  return `/frames-${tier}/ezgif-frame-${String(i + 1).padStart(3, "0")}.webp`;
}

// ── Live studio clock ───────────────────────────────────────────────
const StudioClock: React.FC = () => {
  const [time, setTime] = useState("");

  useEffect(() => {
    const tick = () => {
      setTime(
        new Intl.DateTimeFormat("en-GB", {
          timeZone: STUDIO_TZ,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }).format(new Date()),
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // suppressHydrationWarning: the server renders an empty string, the client
  // fills it on mount. Rendering a real time on the server would mismatch.
  return (
    <span
      suppressHydrationWarning
      style={{
        fontFamily: MONO,
        fontSize: "11px",
        letterSpacing: "1.5px",
        color: "#6B6560",
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {STUDIO_TZ_LABEL} {time}
    </span>
  );
};

// ── Component ───────────────────────────────────────────────────────
const Hero = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const progressWrapRef = useRef<HTMLDivElement>(null);

  // Invisible box sitting exactly where the centre card sits. The canvas
  // clip-path grows out of it, so the zoom tracks the card wherever the
  // editorial layout puts it instead of assuming dead centre.
  const zoomAnchorRef = useRef<HTMLDivElement>(null);
  const anchorRectRef = useRef<{
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);

  const imagesRef = useRef<(HTMLImageElement | undefined)[]>([]);
  const readyRef = useRef<boolean[]>([]);
  const [canPlay, setCanPlay] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);

  const [slide, setSlide] = useState(0);
  const handleSlide = useCallback((i: number) => setSlide(i), []);
  const step = useCallback(
    (d: number) => setSlide((p) => (p + d + slides.length) % slides.length),
    [],
  );

  // Drives the carousel well's height. The cards are absolutely positioned, so
  // the well needs an explicit height; deriving it from the card size instead
  // of a vh value keeps it from opening a hole on tall, narrow screens.
  const [vp, setVp] = useState({ w: 1024, h: 900 });
  useEffect(() => {
    const u = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    u();
    window.addEventListener("resize", u);
    return () => window.removeEventListener("resize", u);
  }, []);
  // Phones get the tightest well: the stacked layout has to fit the copy, the
  // deck, and the switcher inside one 100vh pane on a 667px-tall screen.
  const carouselWellH = Math.round(
    vp.w < 480
      ? Math.min(170, vp.h * (vp.h < 620 ? 0.23 : 0.24))
      : Math.min(vp.w < 768 ? 240 : 300, vp.h * 0.28),
  );
  const cardDims = getCardDims(vp.w);

  // Any of these move the card, so the cached zoom origin is stale.
  useEffect(() => {
    anchorRectRef.current = null;
  }, [vp.w, vp.h, carouselWellH]);

  const frameRef = useRef(-1);
  const winRef = useRef({ w: 0, h: 0 });

  // ── Window size tracking ──────────────────────────────────────────
  useEffect(() => {
    const sync = () => {
      winRef.current = { w: window.innerWidth, h: window.innerHeight };
    };
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);

  // ── Progressive frame loading ─────────────────────────────────────
  useEffect(() => {
    // Pick the tier from the pixels the canvas will actually paint. The canvas
    // is full-viewport and its backing store is capped at 2x, so this is
    // viewport width x min(dpr, 2). Phones land on the 960w tier (~4.2MB);
    // anything wider gets 1440w (~7.1MB) rather than an upscaled blur.
    const needed =
      window.innerWidth * Math.min(window.devicePixelRatio || 1, 2);
    const tier: "hd" | "sd" = needed <= 1150 ? "sd" : "hd";

    imagesRef.current = new Array(FRAME_COUNT);
    readyRef.current = new Array(FRAME_COUNT).fill(false);

    let cancelled = false;
    let done = 0;
    let cursor = 0;
    const pending: HTMLImageElement[] = [];

    const loadOne = (i: number) =>
      new Promise<void>((resolve) => {
        const img = new Image();
        pending.push(img);
        const finish = () => {
          done++;
          if (!cancelled) {
            readyRef.current[i] = img.naturalWidth > 0;
            imagesRef.current[i] = img;
            setLoadProgress(Math.round((done / FRAME_COUNT) * 100));
            if (done === READY_FRAMES) setCanPlay(true);
          }
          resolve();
        };
        img.onload = finish;
        img.onerror = finish;
        img.src = frameSrc(i, tier);
      });

    // Fixed-size worker pool walking the frames in order, so the earliest
    // frames — the ones the user reaches first — decode first.
    const worker = async (): Promise<void> => {
      while (!cancelled && cursor < FRAME_COUNT) {
        const i = cursor++;
        await loadOne(i);
      }
    };
    Promise.all(
      Array.from({ length: LOAD_CONCURRENCY }, worker),
    ).then(() => {
      // Fewer than READY_FRAMES total (or all errored) — unblock anyway.
      if (!cancelled) setCanPlay(true);
    });

    return () => {
      cancelled = true;
      pending.forEach((i) => {
        i.onload = null;
        i.onerror = null;
      });
    };
  }, []);

  // ── Draw a frame on the canvas (cover mode, retina) ───────────────
  const drawFrame = useCallback((idx: number) => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;

    // Fall back to the nearest already-decoded frame so scrubbing ahead of the
    // download degrades to a held frame instead of a blank canvas.
    let i = idx;
    while (i >= 0 && !readyRef.current[i]) i--;
    if (i < 0) return;
    const img = imagesRef.current[i];
    if (!img?.complete || !img.naturalWidth) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const { w, h } = winRef.current;
    const tw = Math.round(w * dpr);
    const th = Math.round(h * dpr);
    if (c.width !== tw || c.height !== th) {
      c.width = tw;
      c.height = th;
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const ir = img.naturalWidth / img.naturalHeight;
    const cr = w / h;
    let dw: number, dh: number;
    if (ir > cr) {
      dh = h;
      dw = h * ir;
    } else {
      dw = w;
      dh = w / ir;
    }
    ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
  }, []);

  // ── Main scroll handler ───────────────────────────────────────────
  const navbarHiddenRef = useRef(false);

  useEffect(() => {
    if (!canPlay) return;
    drawFrame(0);

    const update = () => {
      const section = sectionRef.current;
      const sticky = stickyRef.current;
      const content = contentRef.current;
      const canvas = canvasRef.current;
      const pBar = progressBarRef.current;
      const pWrap = progressWrapRef.current;
      if (!section || !sticky || !content || !canvas) return;

      const rect = section.getBoundingClientRect();
      const { w: vw, h: vh } = winRef.current;

      // ── BEFORE: section top below viewport top ──
      if (rect.top > 0) {
        content.style.opacity = "1";
        content.style.transform = "none";
        canvas.style.opacity = "0";
        canvas.style.clipPath = "";
        canvas.style.filter = "";
        canvas.style.willChange = "auto";
        sticky.style.backgroundColor = "#F8F4F1";
        if (pWrap) pWrap.style.opacity = "0";
        // Show navbar when before the section
        if (navbarHiddenRef.current) {
          navbarHiddenRef.current = false;
          window.dispatchEvent(new Event("navbar:show"));
        }
        return;
      }

      // ── AFTER: section fully scrolled past ──
      if (rect.bottom <= vh) {
        content.style.opacity = "0";
        // Keep the final zoomed-out state so it doesn't snap back to full-screen
        canvas.style.clipPath = "inset(30px 40px 30px 40px round 24px)";
        canvas.style.opacity = "0.6"; // Matches (1 - 1.0 * 0.4)
        canvas.style.transform = "scale(0.92)"; // Matches (1 - 1.0 * 0.08)
        canvas.style.filter = "none";
        canvas.style.willChange = "auto";
        sticky.style.backgroundColor = "#0a0a0a";
        if (frameRef.current !== FRAME_COUNT - 1) {
          frameRef.current = FRAME_COUNT - 1;
          drawFrame(FRAME_COUNT - 1);
        }
        if (pWrap) pWrap.style.opacity = "0";
        // Keep navbar hidden after the hero
        if (!navbarHiddenRef.current) {
          navbarHiddenRef.current = true;
          window.dispatchEvent(new Event("navbar:hide"));
        }
        return;
      }

      // ── PINNED ──
      const scrolled = -rect.top;
      const range = section.offsetHeight - vh;
      const progress = clamp01(scrolled / range);

      // Only promote the canvas to its own layer while it is actually animating.
      canvas.style.willChange = "clip-path, opacity, transform";

      // ── Navbar hide/show based on scroll progress ──
      if (progress >= CONTENT_FADE_START && !navbarHiddenRef.current) {
        navbarHiddenRef.current = true;
        window.dispatchEvent(new Event("navbar:hide"));
      } else if (progress < CONTENT_FADE_START && navbarHiddenRef.current) {
        navbarHiddenRef.current = false;
        window.dispatchEvent(new Event("navbar:show"));
      }

      // ─── Hero content fade ───
      if (progress < CONTENT_FADE_START) {
        content.style.opacity = "1";
        content.style.transform = "none";
      } else {
        const ft = clamp01(
          (progress - CONTENT_FADE_START) /
          (CONTENT_FADE_END - CONTENT_FADE_START)
        );
        content.style.opacity = String(1 - ft);
        content.style.transform = `translateY(${-ft * 60}px) scale(${1 - ft * 0.04})`;
      }

      // ─── Canvas: zoom via clip-path → then full-screen frames ───
      if (progress < CANVAS_APPEAR) {
        // Hidden
        canvas.style.opacity = "0";
        if (pWrap) pWrap.style.opacity = "0";
      } else if (progress < ZOOM_END) {
        // ── ZOOM PHASE: single canvas revealed through expanding clip-path ──
        const appear = clamp01(
          (progress - CANVAS_APPEAR) / (CANVAS_SOLID - CANVAS_APPEAR)
        );
        canvas.style.opacity = String(appear);

        // Clip-path: card-sized center rectangle → full viewport
        const zr = clamp01(
          (progress - ZOOM_START) / (ZOOM_END - ZOOM_START)
        );
        const zt = easeOutCubic(zr);

        // Measure the anchor once per layout and cache it — this is the only
        // forced layout read in the scroll path, so it must not run per frame.
        if (!anchorRectRef.current && zoomAnchorRef.current) {
          const m = offsetWithin(zoomAnchorRef.current, sticky);
          if (m.w > 0 && m.h > 0) anchorRectRef.current = m;
        }
        const fb = getCardDims(vw);
        const a =
          anchorRectRef.current ??
          {
            x: (vw - fb.cw) / 2,
            y: (vh - fb.ch) / 2,
            w: fb.cw,
            h: fb.ch,
          };

        const top = lerp(a.y, 0, zt);
        const left = lerp(a.x, 0, zt);
        const right = lerp(Math.max(0, vw - (a.x + a.w)), 0, zt);
        const bottom = lerp(Math.max(0, vh - (a.y + a.h)), 0, zt);
        const rad = lerp(CARD_RADIUS, 0, zt);
        canvas.style.clipPath = `inset(${top}px ${right}px ${bottom}px ${left}px round ${rad}px)`;

        // Grayscale to match the carousel's centre card. The old code also ran a
        // drop-shadow() here — a per-pixel blur over the full viewport every
        // frame, and by far the most expensive thing in the sequence.
        const gs = lerp(100, 0, zt);
        canvas.style.filter = gs > 1 ? `grayscale(${gs}%)` : "none";

        // Show frame 0 during zoom
        if (frameRef.current !== 0) {
          frameRef.current = 0;
          drawFrame(0);
        }
        if (pWrap) pWrap.style.opacity = "0";
      } else if (progress < FRAMES_END) {
        // ── FRAME ANIMATION PHASE: full-screen canvas, frames 1→240 ──
        canvas.style.opacity = "1";
        canvas.style.clipPath = "none";
        canvas.style.filter = "none";
        canvas.style.transform = "none";
        canvas.style.borderRadius = "0";

        const fp = clamp01(
          (progress - FRAMES_START) / (FRAMES_END - FRAMES_START)
        );
        const idx = Math.round(fp * (FRAME_COUNT - 1));

        if (idx !== frameRef.current) {
          frameRef.current = idx;
          drawFrame(idx);
        }

        if (pBar) pBar.style.width = `${fp * 100}%`;
        if (pWrap) pWrap.style.opacity = fp < 0.95 ? "1" : "0";
      } else {
        // ── ZOOM-OUT PHASE: canvas shrinks into a card shape ──
        const zp = clamp01(
          (progress - ZOOMOUT_START) / (1.0 - ZOOMOUT_START)
        );
        const zt = easeOutCubic(zp);

        // Show last frame
        if (frameRef.current !== FRAME_COUNT - 1) {
          frameRef.current = FRAME_COUNT - 1;
          drawFrame(FRAME_COUNT - 1);
        }

        // Shrink canvas with clip-path inset + border-radius
        const insetX = lerp(0, 40, zt);
        const insetY = lerp(0, 30, zt);
        const rad = lerp(0, 24, zt);
        canvas.style.clipPath = `inset(${insetY}px ${insetX}px ${insetY}px ${insetX}px round ${rad}px)`;
        canvas.style.opacity = String(1 - zt * 0.4);
        canvas.style.transform = `scale(${1 - zt * 0.08})`;
        canvas.style.filter = "none";

        if (pWrap) pWrap.style.opacity = "0";
      }

      // ─── Background: light → dark ───
      if (progress < BG_START) {
        sticky.style.backgroundColor = "#F8F4F1";
      } else if (progress < BG_END) {
        const bt = easeOutCubic(
          clamp01((progress - BG_START) / (BG_END - BG_START))
        );
        sticky.style.backgroundColor = `rgb(${Math.round(lerp(248, 10, bt))},${Math.round(lerp(244, 10, bt))},${Math.round(lerp(241, 10, bt))})`;
      } else {
        sticky.style.backgroundColor = "#0a0a0a";
      }
    };

    // Coalesce scroll into one rAF per frame. Previously `update` ran styles
    // synchronously inside the scroll event, right after reading
    // getBoundingClientRect — a forced layout on every event.
    let ticking = false;
    let raf = 0;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      raf = requestAnimationFrame(() => {
        ticking = false;
        update();
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    const onResize = () => {
      anchorRectRef.current = null;
      drawFrame(frameRef.current < 0 ? 0 : frameRef.current);
      onScroll();
    };
    window.addEventListener("resize", onResize);
    update();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(raf);
    };
  }, [canPlay, drawFrame]);

  const active = slides[slide] ?? slides[0];

  // ── Render ────────────────────────────────────────────────────────
  return (
    <section
      ref={sectionRef}
      style={{
        position: "relative",
        height: `${SECTION_HEIGHT_VH}vh`,
        backgroundColor: "#0a0a0a",
      }}
    >
      {/* Marquee keyframes — kept off in reduced-motion. */}
      <style>{`
        @keyframes neuron-ticker {
          from { transform: translate3d(0, 0, 0); }
          to   { transform: translate3d(-50%, 0, 0); }
        }
        .neuron-ticker-track {
          display: flex;
          width: max-content;
          animation: neuron-ticker 38s linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .neuron-ticker-track { animation: none; }
        }
        .neuron-rail {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 92px clamp(20px, 5vw, 56px) 0;
        }
        .neuron-rail span { white-space: nowrap; }
        .neuron-ticker-wrap { padding: 13px 0; }
        /* Shrink rather than wrap — a two-line status rail reads as a bug. */
        @media (max-width: 620px) {
          .neuron-rail { padding: 76px 16px 0; gap: 10px; }
          .neuron-rail span { font-size: 10px !important; letter-spacing: 0.8px !important; }
        }

        /* ── Editorial split ──────────────────────────────────────────
           Copy on the left, the showcase deck on the right. The columns
           are minmax(0, …) so a long word can't blow the grid open. */
        .neuron-stage {
          flex: 1;
          min-height: 0;
          display: grid;
          grid-template-columns: minmax(0, 0.92fr) minmax(0, 1.08fr);
          align-items: center;
          gap: clamp(24px, 4vw, 72px);
          width: 100%;
          max-width: 1440px;
          margin: 0 auto;
          padding: 0 clamp(20px, 5vw, 56px);
        }
        .neuron-copy {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }
        .neuron-showcase {
          display: flex;
          flex-direction: column;
          align-items: center;
          min-width: 0;
        }
        /* The headline's hairline — the only rule on the page, so it reads
           as a deliberate divider rather than a border. */
        .neuron-hairline {
          width: clamp(48px, 6vw, 88px);
          height: 1px;
          background: rgba(26, 26, 26, 0.28);
          margin: clamp(14px, 2.4vh, 26px) 0;
          flex-shrink: 0;
        }
        .neuron-ctl {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: 1px solid rgba(26, 26, 26, 0.16);
          background: transparent;
          color: #4A443E;
          cursor: pointer;
          transition: background-color 0.2s ease, border-color 0.2s ease;
        }
        .neuron-ctl:hover {
          background: rgba(26, 26, 26, 0.05);
          border-color: rgba(26, 26, 26, 0.4);
        }
        /* Secondary CTA. min-height carries the 44px touch target while the
           underline stays tight to the text. */
        .neuron-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          min-height: 44px;
          padding: 0 2px;
          color: #1a1a1a;
          font-size: 14px;
          font-weight: 600;
          text-decoration: none;
        }
        .neuron-link-label {
          border-bottom: 1px solid rgba(26, 26, 26, 0.3);
          padding-bottom: 2px;
          transition: border-color 0.2s ease;
        }
        .neuron-link:hover .neuron-link-label { border-color: #1a1a1a; }
        .neuron-arrow { transition: transform 0.2s ease; }
        .neuron-link:hover .neuron-arrow { transform: translateX(3px); }

        /* Stack below the split's breakpoint. Vertical rhythm switches to vh
           units here because the whole composition has to survive inside one
           100vh sticky pane on a short phone. */
        @media (max-width: 900px) {
          .neuron-stage {
            grid-template-columns: minmax(0, 1fr);
            align-content: center;
            /* The safe keyword keeps overflow off the top edge, so a short
               phone can never push the headline up into the status rail.
               Declared second so browsers that cannot parse it keep the
               plain center value above. */
            align-content: safe center;
            gap: clamp(12px, 2.4vh, 26px);
            padding: 0 clamp(20px, 6vw, 40px);
          }
          .neuron-copy { align-items: center; text-align: center; }
          .neuron-copy .neuron-hairline { margin: clamp(10px, 1.6vh, 18px) 0; }
        }

        /* Short viewports — small phones, and anything in landscape. Tighten
           every gap rather than dropping content; the alternative is the
           caption sliding under the stack ticker. The !important flags are
           there to beat the inline styles on those two elements. */
        @media (max-height: 620px) {
          .neuron-rail { padding-top: 66px; }
          .neuron-lede {
            font-size: 14px !important;
            line-height: 1.45 !important;
          }
          .neuron-copy .neuron-hairline { margin: 8px 0; }
          .neuron-caption { margin-top: 4px !important; }
          .neuron-ticker-wrap { padding: 7px 0; }
        }
      `}</style>

      <div
        ref={stickyRef}
        style={{
          position: "sticky",
          top: 0,
          width: "100%",
          height: "100vh",
          overflow: "hidden",
          backgroundColor: "#F8F4F1",
        }}
      >
        {/* Navbar rendered in page.tsx to stay above all stacking contexts */}

        {/* ──── Hero content (fades out on scroll) ──── */}
        <div
          ref={contentRef}
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            zIndex: 1,
            willChange: "opacity, transform",
          }}
        >
          {/* ═══ Status rail ═══ */}
          <div className="neuron-rail">
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "9px",
                fontFamily: MONO,
                fontSize: "11px",
                letterSpacing: "1.5px",
                textTransform: "uppercase",
                color: "#4A443E",
              }}
            >
              <span
                aria-hidden
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  backgroundColor: "#1145A0",
                  boxShadow: "0 0 0 3px rgba(17,69,160,0.16)",
                  flexShrink: 0,
                }}
              />
              {AVAILABILITY}
            </span>
            <StudioClock />
          </div>

          {/* ═══ Editorial split: copy left, showcase deck right ═══ */}
          <div className="neuron-stage">
            {/* ── Left column: the claim ── */}
            <div className="neuron-copy">
              <h1
                style={{
                  margin: 0,
                  fontWeight: 400,
                  display: "flex",
                  flexDirection: "column",
                  userSelect: "none",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-title), cursive",
                    fontSize: "clamp(40px, 7vw, 124px)",
                    lineHeight: 1,
                    color: "#1a1a1a",
                    letterSpacing: "-1px",
                    whiteSpace: "nowrap",
                    // Pivot from the left so the tilt doesn't push the word off
                    // the column edge the second line is flush to.
                    transform: "rotate(-1.5deg)",
                    transformOrigin: "left bottom",
                  }}
                >
                  Make
                </span>
                <span
                  style={{
                    fontSize: "clamp(36px, 6.3vw, 112px)",
                    lineHeight: 0.92,
                    color: "#1a1a1a",
                    fontWeight: 700,
                    letterSpacing: "-0.035em",
                    whiteSpace: "nowrap",
                  }}
                >
                  it real
                </span>
              </h1>

              <div className="neuron-hairline" aria-hidden />

              <p
                className="neuron-lede"
                style={{
                  maxWidth: "34ch",
                  margin: 0,
                  color: "#4A443E",
                  fontSize: "clamp(15px, 1.5vw, 18px)",
                  lineHeight: 1.55,
                  letterSpacing: "-0.1px",
                }}
              >
                We design and build the interface layer for commerce,
                dashboards, and brand-led product.
              </p>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "clamp(12px, 2vw, 22px)",
                  marginTop: "clamp(14px, 2.6vh, 30px)",
                  flexWrap: "wrap",
                }}
              >
                <a
                  href="#contact"
                  onClick={(e) => {
                    e.preventDefault();
                    document
                      .querySelector("#contact")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                  style={{
                    backgroundColor: "#1145A0",
                    color: "#fff",
                    fontSize: "14px",
                    fontWeight: 600,
                    padding: "14px 28px",
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
                  Start a project
                </a>
                <a
                  href="#projects"
                  className="neuron-link"
                  onClick={(e) => {
                    e.preventDefault();
                    document
                      .querySelector("#projects")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  <span className="neuron-link-label">See the work</span>
                  <span className="neuron-arrow" aria-hidden>
                    →
                  </span>
                </a>
              </div>
            </div>

            {/* ── Right column: the showcase deck ── */}
            <div className="neuron-showcase">
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  height: `${carouselWellH}px`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Carousel
                  index={slide}
                  onIndexChange={handleSlide}
                  layout="deck"
                  showArrows={false}
                />

                {/* Zoom origin for the canvas sequence. Positioned with calc()
                    rather than a translate because the scroll handler reads it
                    via offsetLeft/offsetTop, which ignore transforms. */}
                <div
                  ref={zoomAnchorRef}
                  aria-hidden
                  style={{
                    position: "absolute",
                    left: `calc(50% - ${cardDims.cw / 2}px)`,
                    top: `calc(50% - ${cardDims.ch / 2}px)`,
                    width: `${cardDims.cw}px`,
                    height: `${cardDims.ch}px`,
                    pointerEvents: "none",
                  }}
                />
              </div>

              {/* Discipline switcher — turns three unlabelled cards into the
                  service list, and gives the deck a real control. */}
              <div
                aria-live="polite"
                className="neuron-caption"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  width: "100%",
                  marginTop: "clamp(6px, 1.6vh, 18px)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <button
                    type="button"
                    className="neuron-ctl"
                    onClick={() => step(-1)}
                    aria-label="Previous discipline"
                  >
                    <ChevronLeft size={16} aria-hidden />
                  </button>
                  <span
                    style={{
                      fontFamily: MONO,
                      fontSize: "11px",
                      letterSpacing: "2px",
                      textTransform: "uppercase",
                      color: "#1145A0",
                      minWidth: "92px",
                      textAlign: "center",
                    }}
                  >
                    {active.discipline}
                  </span>
                  <button
                    type="button"
                    className="neuron-ctl"
                    onClick={() => step(1)}
                    aria-label="Next discipline"
                  >
                    <ChevronRight size={16} aria-hidden />
                  </button>
                </div>

                <p
                  style={{
                    margin: "8px 0 0",
                    maxWidth: "34ch",
                    padding: "0 12px",
                    textAlign: "center",
                    fontSize: "13px",
                    color: "#6B6560",
                    lineHeight: 1.45,
                  }}
                >
                  {active.note}
                </p>
              </div>
            </div>
          </div>

          {/* ═══ Stack ticker — bottom frame element ═══ */}
          <div
            aria-hidden
            className="neuron-ticker-wrap"
            style={{
              width: "100%",
              borderTop: "1px solid rgba(26,26,26,0.08)",
              overflow: "hidden",
              maskImage:
                "linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)",
              WebkitMaskImage:
                "linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)",
            }}
          >
            <div className="neuron-ticker-track">
              {[0, 1].map((copy) => (
                <div key={copy} style={{ display: "flex", flexShrink: 0 }}>
                  {STACK.map((s) => (
                    <span
                      key={`${copy}-${s}`}
                      style={{
                        fontFamily: MONO,
                        fontSize: "11px",
                        letterSpacing: "2.5px",
                        color: "#6B6560",
                        padding: "0 26px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ──── Single canvas: clip-path zoom + frame animation ──── */}
        <canvas
          ref={canvasRef}
          aria-hidden
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            opacity: 0,
            zIndex: 10,
            pointerEvents: "none",
          }}
        />

        {/* ──── Load bar, pinned to the top edge so it collides with nothing ──── */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "2px",
            zIndex: 30,
            opacity: loadProgress >= 100 ? 0 : 1,
            transition: "opacity 0.4s ease",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              width: `${loadProgress}%`,
              height: "100%",
              backgroundColor: "#1145A0",
              transition: "width 0.2s ease-out",
            }}
          />
        </div>

        {/* ──── Scroll progress indicator (frames phase) ──── */}
        <div
          ref={progressWrapRef}
          style={{
            position: "absolute",
            bottom: 32,
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "10px",
            opacity: 0,
            transition: "opacity 0.4s ease",
            pointerEvents: "none",
            zIndex: 20,
          }}
        >
          <div
            style={{
              width: "120px",
              height: "2px",
              backgroundColor: "rgba(255,255,255,0.15)",
              borderRadius: "1px",
              overflow: "hidden",
            }}
          >
            <div
              ref={progressBarRef}
              style={{
                width: "0%",
                height: "100%",
                backgroundColor: "rgba(255,255,255,0.5)",
                borderRadius: "1px",
              }}
            />
          </div>
          <span
            style={{
              color: "rgba(255,255,255,0.3)",
              fontSize: "11px",
              fontWeight: 400,
              letterSpacing: "1px",
              textTransform: "uppercase" as const,
            }}
          >
            Scroll to explore
          </span>
        </div>
      </div>
    </section>
  );
};

export default Hero;
