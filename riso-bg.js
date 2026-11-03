import * as THREE from "three";
import { teardropGeometry, risoShapeMaterial, SHAPE_LOOKS } from "./riso-shapes.js";

// A few riso-printed teardrops floating behind every page. They are real 3D
// objects: they turn slowly, tumble a little, and scrolling spins them further.

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const small = window.innerWidth < 768;
const isHome = document.body.classList.contains("home-page");

// ax / ay: where the shape lives on screen (-1..1), size: fraction of viewport
// height, speed: parallax against scrolling, spin: radians per second around y
const DEFS = [
  { look: 1, ax: 0.8, ay: 0.3, size: 0.46, speed: 0.55, spin: 0.35, tilt: 0.5, roll: 2.4 },
  { look: 0, ax: -0.82, ay: 0.62, size: 0.34, speed: 0.25, spin: -0.28, tilt: -0.4, roll: 0.9 },
  { look: 2, ax: -0.6, ay: -0.72, size: 0.3, speed: 0.9, spin: 0.22, tilt: 0.9, roll: -0.6 },
  { look: 3, ax: 0.6, ay: -0.8, size: 0.26, speed: 0.15, spin: -0.4, tilt: -0.8, roll: 1.7 },
].slice(0, small ? 3 : 4);

const canvas = document.createElement("canvas");
canvas.className = "shapes-canvas";
canvas.setAttribute("aria-hidden", "true");
document.body.insertBefore(canvas, document.body.firstChild);

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
} catch (err) {
  canvas.remove();
}

if (renderer) {
  const pr = { value: Math.min(window.devicePixelRatio, 1.5) };
  renderer.setPixelRatio(pr.value);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  camera.position.set(0, 0, 10);
  const VIS_H = 2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(15));

  const geo = teardropGeometry();
  const mats = SHAPE_LOOKS.map((l) => risoShapeMaterial({ ...l, pr }));
  const shapes = DEFS.map((d, i) => {
    const spinner = new THREE.Group(); // turns around its own vertical axis
    const mesh = new THREE.Mesh(geo, mats[d.look]);
    spinner.add(mesh);
    const holder = new THREE.Group(); // fixed tilt + roll, then position
    holder.rotation.set(d.tilt * 0.4, 0, d.roll);
    holder.add(spinner);
    scene.add(holder);
    return { d, holder, spinner, phase: i * 1.9 };
  });

  let vw = 1;
  let vh = 1;
  let scrollNow = window.scrollY;
  let scrollSmooth = scrollNow;
  let spinBoost = 0;
  let time = 0;
  let last = 0;

  function layout() {
    vw = window.innerWidth;
    vh = window.innerHeight;
    renderer.setSize(vw, vh, false);
    camera.aspect = vw / vh;
    camera.updateProjectionMatrix();
    shapes.forEach((s) => s.holder.scale.setScalar(s.d.size * VIS_H));
  }

  function place(t) {
    const visW = VIS_H * (vw / vh);
    shapes.forEach((s) => {
      const size = s.d.size * VIS_H;
      const span = VIS_H + size * 3; // wrap vertically, off screen
      // on the home page the pinned hero keeps them where they are
      const hold = isHome ? 1.8 * vh : 0;
      const scrollWorld = (Math.max(0, scrollSmooth - hold) / vh) * VIS_H;
      let y = s.d.ay * (VIS_H / 2) + scrollWorld * s.d.speed;
      y = (((y + span / 2) % span) + span) % span - span / 2;
      const x = s.d.ax * (visW / 2) + Math.sin(t * 0.3 + s.phase) * size * 0.12;
      s.holder.position.set(x, y, 0);
      s.spinner.rotation.y = s.phase + t * s.d.spin + spinBoost * Math.sign(s.d.spin);
      s.holder.rotation.x = s.d.tilt * 0.4 + Math.sin(t * 0.45 + s.phase) * 0.18;
    });
  }

  function draw() {
    renderer.render(scene, camera);
  }

  let raf = 0;
  function loop(now) {
    raf = requestAnimationFrame(loop);
    const dt = Math.min((now - last) / 1000 || 0, 0.05);
    last = now;
    time += dt;
    const prev = scrollSmooth;
    scrollSmooth += (scrollNow - scrollSmooth) * 0.09;
    spinBoost += (scrollSmooth - prev) * 0.004; // scrolling turns them
    place(time);
    draw();
  }

  window.addEventListener(
    "scroll",
    () => {
      scrollNow = window.scrollY;
      if (reduceMotion) {
        scrollSmooth = scrollNow;
        place(0);
        draw();
      }
    },
    { passive: true },
  );
  window.addEventListener("resize", () => {
    layout();
    if (reduceMotion) {
      place(0);
      draw();
    }
  });

  layout();
  place(0);
  draw();
  canvas.classList.add("is-ready");

  if (!reduceMotion) {
    last = performance.now();
    raf = requestAnimationFrame(loop);
    document.addEventListener("visibilitychange", () => {
      cancelAnimationFrame(raf);
      if (!document.hidden) {
        last = performance.now();
        raf = requestAnimationFrame(loop);
      }
    });
  }
}
