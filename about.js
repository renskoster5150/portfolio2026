// About page: pinned intro timeline, words that light up as you read, the
// riso-printed photo, and the skill stack that unfolds on scroll.
(function () {
  const clamp = (v, a = 0, b = 1) => Math.min(Math.max(v, a), b);
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  // ---- Riso-printed photo ---------------------------------------------------
  // Same recipe as the 3D head: blue + pink halftone on cream paper, the pink
  // ink printed a hair off-register. Done once on a canvas, no WebGL needed.
  function risoPhoto(img) {
    const draw = () => {
      const css = img.clientWidth || 480;
      const size = Math.round(Math.min(css * Math.min(window.devicePixelRatio, 2), 1100));
      const cell = Math.max(4, size / 105); // dot pitch in canvas pixels

      const src = document.createElement("canvas");
      src.width = src.height = size;
      const sx = src.getContext("2d", { willReadFrequently: true });
      // cover-crop to a square
      const s = Math.min(img.naturalWidth, img.naturalHeight);
      sx.drawImage(
        img,
        (img.naturalWidth - s) / 2,
        (img.naturalHeight - s) / 2,
        s,
        s,
        0,
        0,
        size,
        size,
      );
      const data = sx.getImageData(0, 0, size, size).data;

      const out = document.createElement("canvas");
      out.width = out.height = size;
      out.className = "riso-photo";
      out.setAttribute("role", "img");
      out.setAttribute("aria-label", img.alt || "Portrait of Rens");
      const ox = out.getContext("2d");
      const px = ox.createImageData(size, size);
      const o = px.data;

      const smooth = (a, b, x) => {
        const t = clamp((x - a) / (b - a));
        return t * t * (3 - 2 * t);
      };
      const hash = (x, y) => {
        const v = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
        return v - Math.floor(v);
      };
      const halftone = (x, y, ang, amt) => {
        const ca = Math.cos(ang);
        const sa = Math.sin(ang);
        const qx = (ca * x + sa * y) / cell;
        const qy = (-sa * x + ca * y) / cell;
        const fx = qx - Math.floor(qx) - 0.5;
        const fy = qy - Math.floor(qy) - 0.5;
        const r = Math.sqrt(clamp(amt));
        return smooth(r * 0.76 + 0.1, r * 0.76 - 0.1, Math.hypot(fx, fy));
      };
      const off = Math.max(1, Math.round(size * 0.0014));

      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const i = (y * size + x) * 4;
          const lum =
            (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255;
          const j = (Math.min(size - 1, y + off) * size + Math.min(size - 1, x + off)) * 4;
          const red = data[j] / 255;
          const l1s = clamp((lum * 1.08 - 0.14) / 0.62);
          const l2s = clamp((red * 0.98 - 0.22) / 0.55);
          const blue = halftone(x, y, 0.7854, Math.pow(1 - l1s, 2) * 0.9);
          const pink = halftone(x, y, 0.2618, (1 - l2s) * 0.68 + 0.03);
          const grain = 0.97 + 0.06 * hash(x, y);
          // cream paper x blue ink x pink ink
          const bk = blue * 0.95;
          const pk = pink * 0.9;
          o[i] = 255 * 0.96 * grain * (1 - bk * (1 - 0.0)) * (1 - pk * (1 - 1.0));
          o[i + 1] = 255 * 0.92 * grain * (1 - bk * (1 - 0.4)) * (1 - pk * (1 - 0.28));
          o[i + 2] = 255 * 0.83 * grain * (1 - bk * (1 - 0.8)) * (1 - pk * (1 - 0.52));
          o[i + 3] = 255;
        }
      }
      ox.putImageData(px, 0, 0);
      img.hidden = true;
      img.after(out);
    };
    if (img.complete && img.naturalWidth) draw();
    else img.addEventListener("load", draw, { once: true });
  }
  const profileImg = document.querySelector(".placeholder-profile img");
  if (profileImg) risoPhoto(profileImg);

  // ---- Words that light up as you scroll through the intro -----------------
  const words = [];
  document.querySelectorAll(".intro-text .intro-p1, .intro-text .intro-p2").forEach((p) => {
    const parts = p.textContent.trim().split(/\s+/);
    p.textContent = "";
    parts.forEach((w, i) => {
      const span = document.createElement("span");
      span.className = "w";
      span.textContent = w;
      p.append(span, i < parts.length - 1 ? " " : "");
      words.push(span);
    });
  });
  let litAt = -1;
  function applyRead(read) {
    const key = Math.round(read * 1000);
    if (key === litAt) return;
    litAt = key;
    const n = words.length;
    const front = 5; // words in the soft edge
    words.forEach((w, i) => {
      const o = clamp((read * (n + front) - i) / front);
      w.style.opacity = (0.2 + 0.8 * o).toFixed(3);
    });
  }

  // ---- Intro: title -> photo + card, pinned while you scroll ----------------
  const scroller = document.querySelector(".about-scroll");
  const card = document.querySelector(".intro-text");
  const pinnedQuery = window.matchMedia(
    "(min-width: 961px) and (min-height: 700px)",
  );
  let introTarget = 0;
  let introP = 0;
  let readTarget = 0;
  let readP = 0;

  function readIntro() {
    if (!scroller) return;
    if (reduceMotion) {
      introTarget = 1;
      readTarget = 1;
      return;
    }
    if (!pinnedQuery.matches) {
      introTarget = 1;
      // not pinned: light the words as the card moves up the screen
      const r = card.getBoundingClientRect();
      const vh = window.innerHeight;
      readTarget = clamp((vh * 0.85 - r.top) / (r.height * 0.8 + vh * 0.1));
      return;
    }
    const rect = scroller.getBoundingClientRect();
    const run = scroller.offsetHeight - window.innerHeight;
    introTarget = clamp(-rect.top / run);
    readTarget = clamp((introTarget - 0.32) / 0.58);
  }

  function applyIntro(p) {
    if (!scroller) return;
    if (!pinnedQuery.matches || reduceMotion) {
      ["--a1", "--a2"].forEach((v) => scroller.style.removeProperty(v));
      return;
    }
    scroller.style.setProperty("--a1", easeOut(clamp(p / 0.2)).toFixed(4));
    scroller.style.setProperty("--a2", easeOut(clamp((p - 0.12) / 0.24)).toFixed(4));
  }

  // ---- Skill stack: collapsed deck -> fanned list ---------------------------
  const stack = document.querySelector(".skill-stack");
  let openTarget = 0;
  let openP = 0;
  let hovering = false;

  function readStack() {
    if (!stack) return;
    if (reduceMotion) {
      openTarget = 1;
      return;
    }
    const top = stack.getBoundingClientRect().top;
    const vh = window.innerHeight;
    openTarget = clamp((vh * 0.92 - top) / (vh * 0.42));
  }

  if (stack) {
    const grab = () => {
      hovering = true;
    };
    const drop = () => {
      hovering = stack.contains(document.activeElement);
    };
    stack.addEventListener("pointerenter", grab);
    stack.addEventListener("pointerleave", drop);
    stack.addEventListener("focusin", grab);
    stack.addEventListener("focusout", () => {
      hovering = stack.matches(":hover");
    });
  }

  // ---- One loop for all of it -------------------------------------------------
  let raf = 0;
  function loop() {
    const k = reduceMotion ? 1 : 0.12;
    introP += (introTarget - introP) * k;
    if (Math.abs(introTarget - introP) < 0.0005) introP = introTarget;
    applyIntro(introP);

    readP += (readTarget - readP) * (reduceMotion ? 1 : 0.14);
    if (Math.abs(readTarget - readP) < 0.0005) readP = readTarget;
    applyRead(readP);

    if (stack) {
      const want = hovering ? 1 : openTarget;
      openP += (want - openP) * (reduceMotion ? 1 : 0.1);
      if (Math.abs(want - openP) < 0.0005) openP = want;
      stack.style.setProperty("--open", openP.toFixed(4));
    }
    raf = requestAnimationFrame(loop);
  }

  function readAll() {
    readIntro();
    readStack();
  }

  window.addEventListener("scroll", readAll, { passive: true });
  window.addEventListener("resize", readAll);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) cancelAnimationFrame(raf);
    else raf = requestAnimationFrame(loop);
  });

  readAll();
  introP = introTarget; // refreshing mid-page shouldn't replay the intro
  readP = readTarget;
  openP = openTarget;
  raf = requestAnimationFrame(loop);
})();
