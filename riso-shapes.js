import * as THREE from "three";

// Riso-print look shared by the 3D teardrop shapes (and matched by riso-head.js):
// cream paper, flat ink floods and screen-space halftone dots that stay put on
// screen while the object turns, like ink on a real print.

export const RISO_GLSL = `
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
float ht(vec2 p, float ang, float cell, float amt){          // halftone dot coverage for an ink amount 0..1
  float ca=cos(ang), sa=sin(ang); vec2 q = vec2(ca*p.x+sa*p.y, -sa*p.x+ca*p.y)/cell; vec2 f = fract(q)-0.5;
  return smoothstep(sqrt(clamp(amt,0.0,1.0))*0.76+0.1, sqrt(clamp(amt,0.0,1.0))*0.76-0.1, length(f)); }
`;

export const RISO_VERT = `
varying vec2 vUv; varying vec3 vN; varying vec3 vV;
void main(){ vUv=uv; vN=normalize(normalMatrix*normal);
  vec4 mv=modelViewMatrix*vec4(position,1.0); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }`;

export const INKS = {
  blue: [0.0, 0.4, 0.8],
  pink: [1.0, 0.28, 0.52],
  yellow: [1.0, 0.82, 0.12],
};

// A teardrop with a curved tail, like the printed comma: round head, long taper
// to a sharp tip. Ribs run along its length (constant u).
export function teardropGeometry(segments = 90, ring = 56) {
  const P0 = new THREE.Vector2(0.25, 0.3);
  const P1 = new THREE.Vector2(-0.45, -0.05);
  const P2 = new THREE.Vector2(-0.35, -1.0);
  const R = 0.4;
  const Z_SQUASH = 0.9;

  const pos = [];
  const uv = [];
  const idx = [];
  for (let i = 0; i <= segments; i++) {
    const s = Math.pow(i / segments, 1.6); // more rings near the round head
    const o = 1 - s;
    const sp = new THREE.Vector2(
      o * o * P0.x + 2 * o * s * P1.x + s * s * P2.x,
      o * o * P0.y + 2 * o * s * P1.y + s * s * P2.y,
    );
    const tan = new THREE.Vector2(
      2 * o * (P1.x - P0.x) + 2 * s * (P2.x - P1.x),
      2 * o * (P1.y - P0.y) + 2 * s * (P2.y - P1.y),
    ).normalize();
    const nrm = new THREE.Vector2(-tan.y, tan.x);
    const r = R * Math.sin(Math.PI * Math.pow(s, 0.55));
    for (let j = 0; j <= ring; j++) {
      const th = (j / ring) * Math.PI * 2;
      const c = Math.cos(th) * r;
      const z = Math.sin(th) * r * Z_SQUASH;
      pos.push(sp.x + nrm.x * c, sp.y + nrm.y * c, z);
      uv.push(j / ring, s);
    }
  }
  const row = ring + 1;
  for (let i = 0; i < segments; i++) {
    for (let j = 0; j < ring; j++) {
      const a = i * row + j;
      const b = a + row;
      idx.push(a, a + 1, b, b, a + 1, b + 1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();

  // the u = 0 and u = 1 columns are the same line on the surface: share their normals
  const n = g.attributes.normal;
  for (let i = 0; i <= segments; i++) {
    const a = i * row;
    const b = a + ring;
    const x = n.getX(a) + n.getX(b);
    const y = n.getY(a) + n.getY(b);
    const z = n.getZ(a) + n.getZ(b);
    const l = Math.hypot(x, y, z) || 1;
    n.setXYZ(a, x / l, y / l, z / l);
    n.setXYZ(b, x / l, y / l, z / l);
  }

  g.computeBoundingBox();
  const size = g.boundingBox.getSize(new THREE.Vector3());
  const center = g.boundingBox.getCenter(new THREE.Vector3());
  g.translate(-center.x, -center.y, -center.z);
  g.scale(1 / size.y, 1 / size.y, 1 / size.y); // 1 unit tall
  return g;
}

// flood: an ink laid down flat over the whole shape (or null for bare paper),
// shade: the ink whose halftone dots build the shadows,
// accent: an optional second ink in a coarser, off-register halftone.
export function risoShapeMaterial({ flood = null, shade = "blue", accent = null, pr }) {
  const col = (c) => new THREE.Vector3(...c);
  return new THREE.ShaderMaterial({
    uniforms: {
      pr,
      flood: { value: col(flood ? INKS[flood] : [1, 1, 1]) },
      floodAmt: { value: flood ? 0.92 : 0 },
      shadeInk: { value: col(INKS[shade]) },
      accentInk: { value: col(accent ? INKS[accent] : [1, 1, 1]) },
      accentAmt: { value: accent ? 1 : 0 },
    },
    vertexShader: RISO_VERT,
    fragmentShader: `
      uniform float pr; uniform vec3 flood; uniform float floodAmt;
      uniform vec3 shadeInk; uniform vec3 accentInk; uniform float accentAmt;
      varying vec2 vUv; varying vec3 vN; varying vec3 vV;
      ${RISO_GLSL}
      void main(){
        vec3 n = normalize(vN);
        float s = dot(n, normalize(vec3(0.4,0.6,0.7)))*0.5+0.5;
        float rim = pow(1.0-max(dot(n, normalize(vV)),0.0), 2.0);
        float rib = sin(vUv.x*6.2831*44.0);
        float l = clamp(s*1.05 - rim*0.28 + rib*0.07, 0.0, 1.0);
        vec2 p = gl_FragCoord.xy/pr;
        float a = ht(p, 0.7854, 3.4, pow(1.0-l, 1.5)*0.95);
        float b = ht(p + vec2(2.0,-1.5), 0.2618, 4.4, (1.0-l)*0.6 + 0.04) * accentAmt;
        vec3 paper = vec3(0.96,0.92,0.83) * (0.97 + 0.06*hash(p));
        vec3 col = paper * mix(vec3(1.0), flood, floodAmt);
        col *= mix(vec3(1.0), shadeInk, a*0.95);
        col *= mix(vec3(1.0), accentInk, b*0.9);
        gl_FragColor = vec4(pow(col, vec3(2.2)), 1.0);
        #include <colorspace_fragment>
      }`,
    side: THREE.DoubleSide,
  });
}

// the four looks used around the site
export const SHAPE_LOOKS = [
  { flood: "pink", shade: "blue" },
  { flood: "blue", shade: "pink" },
  { flood: null, shade: "blue", accent: "pink" },
  { flood: "yellow", shade: "blue", accent: "pink" },
];
