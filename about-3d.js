import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

// ---- Config ---------------------------------------------------------------
const MODEL_URL = "models/head.glb";
const FACE_FORWARD_Z = 0.12; // same pivot as the home hero: behind the face shell
// The scan has no back of the head, so the sway stays well inside the +/-35deg
// that was checked on the mesh.
const MAX_YAW = THREE.MathUtils.degToRad(24);
const TILTS = [-13, 9, -5, 15, -9, 6].map((d) => THREE.MathUtils.degToRad(d));
const BLOCKS = [
  { color: 0xffd23f, sides: 64, r: 0.56, rot: 0 },
  { color: 0xff8fc0, sides: 4, r: 0.7, rot: Math.PI / 4 },
  { color: 0xa99bff, sides: 64, r: 0.58, rot: 0 },
  { color: 0xff6b3d, sides: 3, r: 0.85, rot: Math.PI / 2 },
  { color: 0x6fe3a5, sides: 6, r: 0.6, rot: 0 },
];
const DRIFT = 0.16; // spacings per second
const SPACING = 1.5; // head widths between centres
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
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  camera.position.set(0, 0, 8);
  const VIS_H = 2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(15));

  scene.add(new THREE.HemisphereLight(0xffffff, 0x666666, 1.6));
  const key = new THREE.DirectionalLight(0xffffff, 2.0);
  key.position.set(2, 3, 4);
  scene.add(key);

  let template = null; // normalised head, 1 unit tall
  const box = { w: 0.745, h: 0.959 };
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

  const blockGeo = BLOCKS.map((b) => {
    const g = new THREE.CircleGeometry(b.r, b.sides);
    g.rotateZ(b.rot);
    return g;
  });
  const blockMat = BLOCKS.map((b) => new THREE.MeshBasicMaterial({ color: b.color }));

  function makeSlot(i) {
    const slot = new THREE.Group();
    const blockIdx = i % BLOCKS.length;
    const block = new THREE.Mesh(blockGeo[blockIdx], blockMat[blockIdx]);
    block.position.z = -0.6;
    slot.add(block);

    const pivot = new THREE.Group(); // yaw + nod
    const head = template.clone(true);
    pivot.add(head);
    slot.add(pivot);
    scene.add(slot);
    return { slot, pivot, i, baseTilt: TILTS[i % TILTS.length] };
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
    const headPx = Math.min(0.6 * h, (0.62 * w) / ratio);
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
      s.pivot.rotation.y = reduceMotion
        ? Math.sin(s.i * 1.7) * MAX_YAW * 0.6
        : Math.sin(t * 0.8 + s.i * 1.7) * MAX_YAW;
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

  new GLTFLoader().loadAsync(MODEL_URL).then(
    (gltf) => {
      const model = gltf.scene;
      const b = new THREE.Box3().setFromObject(model);
      const c = b.getCenter(new THREE.Vector3());
      box.w = b.max.x - b.min.x;
      box.h = b.max.y - b.min.y;
      model.position.set(-c.x, -c.y, -(b.min.z + FACE_FORWARD_Z));
      template = new THREE.Group();
      const holder = new THREE.Group();
      holder.scale.setScalar(1 / box.h);
      holder.add(model);
      template.add(holder);
      layout();
      section.classList.add("is-ready");
      if (visible) start();
    },
    () => section.classList.add("no-3d"),
  );
}
