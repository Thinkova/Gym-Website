gsap.registerPlugin(ScrollTrigger);

const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;

let lenis = null;

// INIT LENIS SMOOTH SCROLL
function initSmoothScroll() {
  if (typeof Lenis !== "undefined") {
    lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.5,
    });

    lenis.on("scroll", ScrollTrigger.update);

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);
  }
}

function splitIntoLetters(el) {
  if (!el) return [];
  const text = el.textContent || "";
  el.textContent = "";
  text.split("").forEach((char) => {
    const span = document.createElement("span");
    span.className = "letter";
    span.textContent = char;
    el.appendChild(span);
  });
  return el.querySelectorAll(".letter");
}

function runIntro() {
  const intro = document.getElementById("intro");
  if (!intro) return;

  let isDismissed = false;

  const dismissIntro = () => {
    if (isDismissed) return;
    isDismissed = true;
    clearTimeout(safetyTimeout);
    document.body.style.overflow = "";
    intro.classList.add("is-dismissed");
    if (lenis) lenis.start();
  };

  // 2.5s Safety fallback: guarantees page unblocks no matter what
  const safetyTimeout = setTimeout(dismissIntro, 2500);

  // Allow clicking anywhere to skip immediately
  intro.addEventListener("click", dismissIntro);

  if (prefersReducedMotion || sessionStorage.getItem("empire_intro_seen")) {
    dismissIntro();
    return;
  }
  sessionStorage.setItem("empire_intro_seen", "true");

  document.body.style.overflow = "hidden";
  if (lenis) lenis.stop();

  const line1 = document.getElementById("intro-line-1");
  const line2 = document.getElementById("intro-line-2");
  const letters1 = splitIntoLetters(line1);
  const letters2 = splitIntoLetters(line2);
  const mark = document.querySelector(".intro-mark");
  const coord = document.querySelector(".intro-coord");
  const panelLeft = document.querySelector(".intro-panel--left");
  const panelRight = document.querySelector(".intro-panel--right");

  const tl = gsap.timeline({
    onComplete: dismissIntro,
  });

  tl.to([...letters1, ...letters2], {
    opacity: 1,
    y: 0,
    duration: 0.45,
    ease: "power3.out",
    stagger: 0.035,
  })
    .to(
      mark,
      { opacity: 1, rotate: 90, duration: 0.4, ease: "power2.out" },
      "-=0.15",
    )
    .to(coord, { opacity: 1, duration: 0.3, ease: "power1.out" }, "-=0.15")
    .to({}, { duration: 0.25 })
    .to(
      panelLeft,
      { xPercent: -100, duration: 0.8, ease: "power3.inOut" },
      "+=0",
    )
    .to(panelRight, { xPercent: 100, duration: 0.8, ease: "power3.inOut" }, "<")
    .to(
      ".intro-content",
      { opacity: 0, duration: 0.4, ease: "power2.out" },
      "<",
    );
}

// NAV & ANCHOR SCROLL
function initNav() {
  const nav = document.getElementById("navbar");
  if (nav) {
    ScrollTrigger.create({
      start: 50,
      end: 99999,
      onUpdate: (self) => {
        nav.classList.toggle("is-scrolled", self.scroll() > 50);
      },
    });
  }

  const menuBtn = document.getElementById("menu-btn");
  const mobileMenu = document.getElementById("mobile-menu");
  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener("click", () => {
      mobileMenu.classList.toggle("is-open");
    });
    document.querySelectorAll(".mobile-link").forEach((link) => {
      link.addEventListener("click", () =>
        mobileMenu.classList.remove("is-open"),
      );
    });
  }

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", (e) => {
      const targetId = anchor.getAttribute("href");
      if (!targetId || targetId === "#") return;
      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        const headerOffset = 80;
        const elementPosition = targetEl.getBoundingClientRect().top;
        const currentScroll = lenis ? lenis.scroll : window.pageYOffset;
        const offsetPosition = elementPosition + currentScroll - headerOffset;

        if (lenis) {
          lenis.scrollTo(offsetPosition, { duration: 1.2 });
        } else {
          window.scrollTo({
            top: offsetPosition,
            behavior: "smooth",
          });
        }
      }
    });
  });

  // Force video playback
  const video = document.querySelector(".hero-video-bg");
  if (video) {
    video.play().catch(() => {});
  }
}

// SCROLL REVEALS
function initReveals() {
  const ease = prefersReducedMotion ? "none" : "power2.out";
  const duration = prefersReducedMotion ? 0.01 : 0.7;

  gsap.utils.toArray("[data-reveal]").forEach((el) => {
    gsap.fromTo(
      el,
      { opacity: 0, y: prefersReducedMotion ? 0 : 28 },
      {
        opacity: 1,
        y: 0,
        duration,
        ease,
        scrollTrigger: { trigger: el, start: "top 85%" },
      },
    );
  });

  gsap.utils.toArray(".program-grid, .pricing-grid").forEach((grid) => {
    const cards = grid.querySelectorAll(".program-card, .price-card");
    if (cards.length) {
      gsap.fromTo(
        cards,
        { opacity: 0, y: prefersReducedMotion ? 0 : 24 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: "power2.out",
          stagger: 0.08,
          scrollTrigger: { trigger: grid, start: "top 85%" },
        },
      );
    }
  });
}

// HUD STAT COUNT-UP
function initCounters() {
  document.querySelectorAll("[data-count]").forEach((el) => {
    const target = parseInt(el.getAttribute("data-count"), 10);
    if (isNaN(target)) return;
    ScrollTrigger.create({
      trigger: el,
      start: "top 90%",
      once: true,
      onEnter: () => {
        if (prefersReducedMotion) {
          el.textContent = target;
          return;
        }
        gsap.to(el, {
          textContent: target,
          duration: 1.4,
          ease: "power1.out",
          snap: { textContent: 1 },
        });
      },
    });
  });
}

// SCRUBBED ANIMATIONS
function initScrub() {
  if (prefersReducedMotion) return;

  const frame = document.querySelector(".hero-frame");
  if (frame) {
    gsap.to("#scan-line", {
      top: "100%",
      ease: "none",
      scrollTrigger: {
        trigger: "#hero",
        start: "top top",
        end: "bottom top",
        scrub: true,
      },
    });
  }

  const fill = document.getElementById("about-fill");
  if (fill) {
    gsap.to(fill, {
      height: "100%",
      ease: "none",
      scrollTrigger: {
        trigger: "#about",
        start: "top 70%",
        end: "bottom 60%",
        scrub: true,
      },
    });
  }
}

// CTA FORM
function initForm() {
  const form = document.getElementById("cta-form");
  if (!form) return;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const btn = form.querySelector("button");
    if (btn) {
      const original = btn.textContent;
      btn.textContent = "ENVOYÉ ✓";
      setTimeout(() => (btn.textContent = original), 2200);
    }
    form.reset();
  });
}

// FOOTER YEAR
function initYear() {
  const el = document.getElementById("current-year");
  if (el) el.textContent = new Date().getFullYear();
}

// INIT
document.addEventListener("DOMContentLoaded", () => {
  initSmoothScroll();
  runIntro();
  initNav();
  initReveals();
  initCounters();
  initScrub();
  initForm();
  initYear();
});
