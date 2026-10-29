// About page: pinned intro timeline + the skill stack that unfolds on scroll.
(function () {
  const clamp = (v, a = 0, b = 1) => Math.min(Math.max(v, a), b);
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  // ---- Intro: title -> description, pinned while you scroll -----------------
  const scroller = document.querySelector(".about-scroll");
  const pinnedQuery = window.matchMedia(
    "(min-width: 861px) and (min-height: 620px)",
  );
  let introTarget = 0;
  let introP = 0;

  function readIntro() {
    if (!scroller) return;
    if (!pinnedQuery.matches || reduceMotion) {
      introTarget = 1;
      return;
    }
    const rect = scroller.getBoundingClientRect();
    const run = scroller.offsetHeight - window.innerHeight;
    introTarget = clamp(-rect.top / run);
  }

  function applyIntro(p) {
    if (!scroller) return;
    if (!pinnedQuery.matches || reduceMotion) {
      ["--a1", "--a2", "--a3"].forEach((v) => scroller.style.removeProperty(v));
      return;
    }
    // title lifts, then photo + intro, then the second paragraph
    scroller.style.setProperty("--a1", easeOut(clamp(p / 0.28)).toFixed(4));
    scroller.style.setProperty("--a2", easeOut(clamp((p - 0.18) / 0.34)).toFixed(4));
    scroller.style.setProperty("--a3", easeOut(clamp((p - 0.48) / 0.3)).toFixed(4));
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

  // ---- One loop for both -----------------------------------------------------
  let raf = 0;
  function loop() {
    const k = reduceMotion ? 1 : 0.12;
    introP += (introTarget - introP) * k;
    if (Math.abs(introTarget - introP) < 0.0005) introP = introTarget;
    applyIntro(introP);

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
  openP = openTarget;
  raf = requestAnimationFrame(loop);
})();
