// The riso-print look shared by every 3D object on the site: cream paper,
// flat ink floods and screen-space halftone dots that stay put on screen while
// the object turns, like ink on a real print.

import * as THREE from "three";

export const RISO_GLSL = /* glsl */ `
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  // halftone dot coverage (0..1) for an ink amount, on a grid rotated by ang
  float ht(vec2 p, float ang, float cell, float amt) {
    float ca = cos(ang), sa = sin(ang);
    vec2 f = fract(vec2(ca * p.x + sa * p.y, -sa * p.x + ca * p.y) / cell) - 0.5;
    float r = sqrt(clamp(amt, 0.0, 1.0)) * 0.76;
    return smoothstep(r + 0.1, r - 0.1, length(f));
  }
`;

export const RISO_VERT = /* glsl */ `
  varying vec2 vUv; varying vec3 vN; varying vec3 vV;
  void main() {
    vUv = uv;
    vN = normalize(normalMatrix * normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vV = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

const INKS = {
  blue: [0.0, 0.4, 0.8],
  pink: [1.0, 0.28, 0.52],
  yellow: [1.0, 0.82, 0.12],
};

/**
 * A teardrop with a curved tail, like a printed comma: round head, long taper
 * to a sharp tip, ribs running along its length. 1 unit tall, centred.
 */
export function teardropGeometry(segments = 90, ring = 56) {
  const P0 = new THREE.Vector2(0.25, 0.3);
  const P1 = new THREE.Vector2(-0.45, -0.05);
  const P2 = new THREE.Vector2(-0.35, -1.0);
  const RADIUS = 0.4;
  const Z_SQUASH = 0.9;

  const positions = [];
  const uvs = [];
  const indices = [];
  for (let i = 0; i <= segments; i++) {
    const s = (i / segments) ** 1.6; // more rings near the round head
    const o = 1 - s;
    const spine = new THREE.Vector2(
      o * o * P0.x + 2 * o * s * P1.x + s * s * P2.x,
      o * o * P0.y + 2 * o * s * P1.y + s * s * P2.y,
    );
    const tangent = new THREE.Vector2(
      2 * o * (P1.x - P0.x) + 2 * s * (P2.x - P1.x),
      2 * o * (P1.y - P0.y) + 2 * s * (P2.y - P1.y),
    ).normalize();
    const normal = new THREE.Vector2(-tangent.y, tangent.x);
    const r = RADIUS * Math.sin(Math.PI * s ** 0.55);
    for (let j = 0; j <= ring; j++) {
      const angle = (j / ring) * Math.PI * 2;
      const c = Math.cos(angle) * r;
      positions.push(spine.x + normal.x * c, spine.y + normal.y * c, Math.sin(angle) * r * Z_SQUASH);
      uvs.push(j / ring, s);
    }
  }
  const row = ring + 1;
  for (let i = 0; i < segments; i++) {
    for (let j = 0; j < ring; j++) {
      const a = i * row + j;
      const b = a + row;
      indices.push(a, a + 1, b, b, a + 1, b + 1);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  // the first and last column are the same seam on the surface: share their normals
  const normals = geometry.attributes.normal;
  for (let i = 0; i <= segments; i++) {
    const a = i * row;
    const b = a + ring;
    const n = new THREE.Vector3(
      normals.getX(a) + normals.getX(b),
      normals.getY(a) + normals.getY(b),
      normals.getZ(a) + normals.getZ(b),
    ).normalize();
    normals.setXYZ(a, n.x, n.y, n.z);
    normals.setXYZ(b, n.x, n.y, n.z);
  }

  geometry.computeBoundingBox();
  const size = geometry.boundingBox.getSize(new THREE.Vector3());
  const center = geometry.boundingBox.getCenter(new THREE.Vector3());
  geometry.translate(-center.x, -center.y, -center.z);
  geometry.scale(1 / size.y, 1 / size.y, 1 / size.y);
  return geometry;
}

/**
 * flood:  an ink laid flat over the whole shape (null for bare paper)
 * shade:  the ink whose halftone dots build the shadows
 * accent: an optional second ink in a coarser, off-register halftone
 * pr:     shared { value: pixelRatio } uniform, keeps the dots the same size on every screen
 */
export function risoShapeMaterial({ flood = null, shade = "blue", accent = null, pr }) {
  const color = (rgb) => new THREE.Vector3(...rgb);
  return new THREE.ShaderMaterial({
    uniforms: {
      pr,
      flood: { value: color(flood ? INKS[flood] : [1, 1, 1]) },
      floodAmt: { value: flood ? 0.92 : 0 },
      shadeInk: { value: color(INKS[shade]) },
      accentInk: { value: color(accent ? INKS[accent] : [1, 1, 1]) },
      accentAmt: { value: accent ? 1 : 0 },
    },
    vertexShader: RISO_VERT,
    fragmentShader: /* glsl */ `
      uniform float pr; uniform vec3 flood; uniform float floodAmt;
      uniform vec3 shadeInk; uniform vec3 accentInk; uniform float accentAmt;
      varying vec2 vUv; varying vec3 vN; varying vec3 vV;
      ${RISO_GLSL}
      void main() {
        vec3 n = normalize(vN);
        float light = dot(n, normalize(vec3(0.4, 0.6, 0.7))) * 0.5 + 0.5;
        float rim = pow(1.0 - max(dot(n, normalize(vV)), 0.0), 2.0);
        float rib = sin(vUv.x * 6.2831 * 44.0);
        float l = clamp(light * 1.05 - rim * 0.28 + rib * 0.07, 0.0, 1.0);
        vec2 p = gl_FragCoord.xy / pr;
        float a = ht(p, 0.7854, 3.4, pow(1.0 - l, 1.5) * 0.95);
        float b = ht(p + vec2(2.0, -1.5), 0.2618, 4.4, (1.0 - l) * 0.6 + 0.04) * accentAmt;
        vec3 paper = vec3(0.96, 0.92, 0.83) * (0.97 + 0.06 * hash(p));
        vec3 col = paper * mix(vec3(1.0), flood, floodAmt);
        col *= mix(vec3(1.0), shadeInk, a * 0.95);
        col *= mix(vec3(1.0), accentInk, b * 0.9);
        gl_FragColor = vec4(pow(col, vec3(2.2)), 1.0);
        #include <colorspace_fragment>
      }`,
    side: THREE.DoubleSide,
  });
}

/** The four ink combinations used around the site. */
export const SHAPE_LOOKS = [
  { flood: "pink", shade: "blue" },
  { flood: "blue", shade: "pink" },
  { flood: null, shade: "blue", accent: "pink" },
  { flood: "yellow", shade: "blue", accent: "pink" },
];

/** A transparent WebGL renderer for the given canvas, or null when WebGL isn't available. */
export function createRenderer(canvas, maxPixelRatio = 2) {
  try {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxPixelRatio));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    return renderer;
  } catch {
    return null;
  }
}
