// About page: pinned intro timeline, words that light up as you read, and the
// skill stack that unfolds on scroll.
(function () {
  const clamp = (v, a = 0, b = 1) => Math.min(Math.max(v, a), b);
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

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
    "(min-width: 961px) and (min-height: 640px)",
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
