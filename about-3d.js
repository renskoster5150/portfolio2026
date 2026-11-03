import * as THREE from "three";
import { loadRisoHead } from "./riso-head.js";

// ---- Config ---------------------------------------------------------------
const MODEL_URL = "models/head-riso.glb";
const TILTS = [-13, 9, -5, 15, -9, 6].map((d) => THREE.MathUtils.degToRad(d));
const DRIFT = 0.16; // spacings per second
const SPACING = 1.55; // head widths between centres
// ---------------------------------------------------------------------------

const section = document.querySelector(".face-carousel");
const canvas = section && section.querySelector(".carousel-canvas");
if (section && canvas) init();

function init() {
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch (err) {
    section.classList.add("no-3d");
    return;
  }
  const pr = { value: Math.min(window.devicePixelRatio, 2) };
  renderer.setPixelRatio(pr.value);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  camera.position.set(0, 0, 8);
  const VIS_H = 2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(15));

  let template = null; // head normalised to 1 unit tall
  const box = { w: 0.81, h: 1 };
  let slots = [];
  let headH = 1; // world height of one head
  let spacing = 1;
  let visW = 1;
  let canvasH = 1;
  let offset = 0;
  let visible = false;
  let last = 0;
  let time = 0;
  let raf = 0;

  function makeSlot(i) {
    const slot = new THREE.Group();

    const pivot = new THREE.Group(); // yaw + nod
    pivot.add(template.clone(true));
    slot.add(pivot);
    scene.add(slot);
    const dir = i % 2 ? 1 : -1;
    return { slot, pivot, i, dir, baseTilt: TILTS[i % TILTS.length] };
  }

  function clearSlots() {
    slots.forEach((s) => scene.remove(s.slot));
    slots = [];
  }

  function layout() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    canvasH = h;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    visW = VIS_H * (w / h);

    const ratio = box.w / box.h;
    const headPx = Math.min(0.58 * h, (0.6 * w) / ratio);
    headH = (headPx / h) * VIS_H;
    spacing = headH * ratio * SPACING;

    if (template) {
      const need = Math.ceil((visW + 2 * headH) / spacing) + 1;
      if (slots.length !== need) {
        clearSlots();
        for (let i = 0; i < need; i++) slots.push(makeSlot(i));
      }
      slots.forEach((s) => s.slot.scale.setScalar(headH));
    }
    pose(0);
    draw();
  }

  function pose(t) {
    const total = slots.length * spacing;
    slots.forEach((s) => {
      let x = (s.i * spacing + offset) % total;
      if (x < 0) x += total;
      x -= total / 2;
      const bob = reduceMotion ? 0 : Math.sin(t * 1.4 + s.i * 1.3) * 0.07 * headH;
      s.slot.position.set(x, bob, 0);
      s.slot.rotation.z =
        s.baseTilt + (reduceMotion ? 0 : Math.sin(t * 0.9 + s.i * 2.1) * 0.07);
      // the new scan has a back, so the heads simply keep turning
      s.pivot.rotation.y = reduceMotion ? s.i * 0.9 : s.dir * t * 0.5 + s.i * 1.3;
      s.pivot.rotation.x = reduceMotion ? 0 : Math.sin(t * 1.1 + s.i * 0.9) * 0.06;
    });
  }

  function draw() {
    renderer.render(scene, camera);
  }

  function loop(now) {
    raf = requestAnimationFrame(loop);
    const dt = Math.min((now - last) / 1000 || 0, 0.05);
    last = now;
    time += dt;
    offset -= DRIFT * spacing * dt;
    pose(time);
    draw();
  }

  function start() {
    if (reduceMotion || raf || !template) return;
    last = performance.now();
    raf = requestAnimationFrame(loop);
  }
  function stop() {
    cancelAnimationFrame(raf);
    raf = 0;
  }

  // scrolling pushes the row along, so the page feels connected to it
  let lastY = window.scrollY;
  window.addEventListener(
    "scroll",
    () => {
      const dy = window.scrollY - lastY;
      lastY = window.scrollY;
      if (reduceMotion || !visible) return;
      offset -= dy * (VIS_H / canvasH) * 0.6;
    },
    { passive: true },
  );

  new IntersectionObserver(
    (entries) => {
      visible = entries[0].isIntersecting;
      if (visible && !document.hidden) start();
      else stop();
    },
    { rootMargin: "120px 0px" },
  ).observe(section);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else if (visible) start();
  });
  new ResizeObserver(layout).observe(canvas);

  loadRisoHead(MODEL_URL, pr).then(
    (head) => {
      box.w = head.width;
      box.h = head.height;
      template = new THREE.Group();
      const holder = new THREE.Group();
      holder.scale.setScalar(1 / box.h);
      holder.add(head.object);
      template.add(holder);
      layout();
      section.classList.add("is-ready");
      if (visible) start();
    },
    () => section.classList.add("no-3d"),
  );
}
