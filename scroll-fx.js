// Scroll-linked motion for the contact, projects and project pages. Blocks slide,
// tilt and scale into place as they come up the screen (and back out if you
// scroll up again), images drift inside their frames, the big titles pull apart
// and a thin bar tracks how far you've read. Uses the individual translate /
// rotate / scale properties so hover transforms keep working.
(function () {
  const cls = document.body.classList;
  const page = cls.contains("contact-page")
    ? "contact"
    : cls.contains("projects-page")
      ? "projects"
      : cls.contains("project-detail-page")
        ? "detail"
        : null;
  if (!page || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const clamp = (v, a = 0, b = 1) => Math.min(Math.max(v, a), b);
  const out = (t) => 1 - Math.pow(1 - t, 3);
  const back = (t) => 1 + 2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2);
  const small = () => window.innerWidth < 768;
  const X = () => (small() ? 0.4 : 1); // horizontal travel, kept short on phones

  // ---- what moves, per page ---------------------------------------------------
  const MAP = {
    contact: [
      [".contact-header .title-line", "drift"],
      [".contact-header .contact-intro", "rise"],
      [".contact-form .form-group", "left"],
      [".contact-form .btn-submit", "pop"],
      [".contact-form .form-note", "rise"],
      [".contact-info-card", "right"],
      [".faq-section .section-title", "rise"],
      [".faq-item", "flip"],
    ],
    projects: [
      [".projects-header .title-line", "drift"],
      [".projects-header p", "rise"],
      [".filter-bar", "rise"],
      [".project-card", "card"],
      [".project-card .project-image img", "par"],
    ],
    detail: [
      [".project-header .back-button, .back-button", "left"],
      [".project-meta", "rise"],
      [".project-title", "rise"],
      [".project-subtitle", "rise"],
      [".hero-image-placeholder", "hero"],
      [".detail-item", "pop"],
      [".content-sidebar h2", "left"],
      [".content-main > p, .content-main > .change-grid, .content-main > .feedback-box", "rise"],
      [".change-grid .feedback-box", "flip"],
      [
        ".shot, .project-image-large, .inline-image, .week-grid-item, .project-image-item, " +
          ".video-container, .audio-card, .cluster, .inline-carousel, .page-strip, " +
          ".strip-title, .project-images-section > h3, .project-images-section > .image-caption",
        "card",
      ],
      [".sub-icon, .strip-page", "pop"],
      [".project-navigation .nav-link-btn", "rise"],
    ],
  }[page];

  const items = [];
  const seen = new Set();
  const NESTED_OK = ".sub-icon, .strip-page, .feedback-box, .project-image img";
  MAP.forEach(([sel, kind]) => {
    document.querySelectorAll(sel).forEach((el) => {
      if (seen.has(el)) return;
      const parent = el.parentElement && el.parentElement.closest("[data-fx]");
      if (parent && !el.matches(NESTED_OK)) return;
      seen.add(el);
      el.setAttribute("data-fx", kind);
      items.push({ el, kind, idx: 0, dir: 1, ty: 0, s: 1, lag: 0 });
    });
  });

  // alternate sides / stagger inside each group
  const counters = {};
  items.forEach((it) => {
    const key = it.kind + "|" + (it.el.parentElement ? it.el.parentElement.className : "");
    counters[key] = (counters[key] || 0) + 1;
    it.idx = counters[key] - 1;
    it.dir = it.idx % 2 ? 1 : -1;
    it.lag = Math.min(it.idx % 4, 3);
  });
  items.forEach((it) => {
    if (it.kind === "drift") it.dir = it.idx % 2 ? 1 : -1;
  });

  // ---- reading progress bar ---------------------------------------------------
  let bar = null;
  if (page === "detail") {
    bar = document.createElement("div");
    bar.className = "read-progress";
    bar.setAttribute("aria-hidden", "true");
    document.body.appendChild(bar);
  }

  // ---- the loop -----------------------------------------------------------------
  const t0 = performance.now();
  let raf = 0;
  let scrollY = window.scrollY;

  function draw() {
    raf = 0;
    try { run(); } catch (err) { console.error('scroll-fx', err); }
  }

  function run() {
    const now = performance.now();
    const vh = window.innerHeight;
    scrollY = window.scrollY;
    const maxScroll = Math.max(0, document.documentElement.scrollHeight - vh);
    const k = X();
    let intro = false;

    items.forEach((it) => {
      const { el, kind } = it;
      const r = el.getBoundingClientRect();
      if (kind === "drift") {
        const d = clamp(scrollY, 0, 700) * 0.22 * k;
        el.style.translate = `${(it.dir * d).toFixed(1)}px 0`;
        return;
      }
      // where the element would sit without our own movement
      const h = r.height / it.s || r.height;
      const top = r.top - it.ty - (h * (1 - it.s)) / 2;
      const mid = top + h / 2;
      const v = clamp((mid - vh / 2) / (vh / 2 + h / 2), -1, 1); // -1 above .. 1 below

      // enter progress: 0 when it appears at the bottom, 1 a little way up the screen
      const minTop = top + scrollY - maxScroll; // highest it can ever get
      const full = Math.max(vh * 0.72, minTop + 2);
      const span = vh * 0.3;
      const start = full + span + it.lag * vh * 0.035;
      let e = clamp((start - top) / (start - full));
      // things already on screen at load play in on a timer instead
      const ramp = clamp((now - t0 - 120 - it.lag * 90) / 850);
      if (ramp < 1) {
        e = Math.min(e, ramp);
        intro = true;
      }
      e = out(e);
      const q = 1 - e;
      const s = el.style;
      let ty = 0;
      let sc = 1;

      switch (kind) {
        case "rise":
          ty = q * 70;
          sc = 0.95 + 0.05 * e;
          s.opacity = e.toFixed(3);
          s.translate = `0 ${ty.toFixed(1)}px`;
          break;
        case "left":
        case "right": {
          const sign = kind === "left" ? -1 : 1;
          ty = q * 24;
          s.opacity = clamp(e * 1.4).toFixed(3);
          s.translate = `${(sign * q * 110 * k).toFixed(1)}px ${ty.toFixed(1)}px`;
          s.rotate = `${(sign * q * 4).toFixed(2)}deg`;
          break;
        }
        case "flip":
          ty = q * 60;
          sc = 0.88 + 0.12 * e;
          s.opacity = clamp(e * 1.3).toFixed(3);
          s.translate = `0 ${ty.toFixed(1)}px`;
          s.rotate = `${(it.dir * q * 7).toFixed(2)}deg`;
          break;
        case "pop": {
          const b = clamp(back(e), 0, 1.15);
          ty = q * 36;
          sc = 0.6 + 0.4 * b;
          s.opacity = clamp(e * 2.2).toFixed(3);
          s.translate = `0 ${ty.toFixed(1)}px`;
          break;
        }
        case "card": {
          ty = q * 80;
          sc = 0.9 + 0.1 * e;
          s.opacity = clamp(e * 1.5).toFixed(3);
          s.translate = `${(it.dir * q * 120 * k).toFixed(1)}px ${ty.toFixed(1)}px`;
          // a little sway while it travels up the screen
          s.rotate = `${(it.dir * q * 6 + v * 0.9).toFixed(2)}deg`;
          break;
        }
        case "hero": {
          // clip open on the way in, then shrink and fade as it leaves at the top
          const leave = clamp(-top / (h * 0.9));
          const c = q * 14;
          ty = leave * 50;
          sc = (0.92 + 0.08 * e) * (1 - leave * 0.1);
          s.opacity = (clamp(e * 2) * (1 - leave * 0.5)).toFixed(3);
          s.clipPath = `inset(${c.toFixed(2)}% ${(c * 0.7).toFixed(2)}% round 22px)`;
          s.translate = `0 ${ty.toFixed(1)}px`;
          break;
        }
        case "par":
          // image drifts inside its frame
          s.translate = `0 ${(v * -7).toFixed(2)}%`;
          s.scale = "1.18";
          return;
      }
      s.scale = sc.toFixed(4);
      it.ty = ty;
      it.s = sc;
    });

    if (bar) {
      bar.style.transform = `scaleX(${maxScroll ? clamp(scrollY / maxScroll).toFixed(4) : 0})`;
    }
    if (intro) request();
  }

  function request() {
    if (!raf) raf = requestAnimationFrame(draw);
  }

  window.addEventListener("scroll", request, { passive: true });
  window.addEventListener("resize", request);
  window.addEventListener("load", request);
  draw(); // set the starting state before first paint
  request();
})();
