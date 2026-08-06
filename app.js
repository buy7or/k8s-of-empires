/* =========================================================
   Kubernetes Cluster Village — escena 3D
   ========================================================= */

/* ---------------- PALETA ---------------- */
const COLORS = {
  platformTop:  0x74ac4b,
  platformSide: 0x639641,
  platformEdge: 0x578438,
  floor:        0x4b5566,   // suelo interior (pizarra)
  floorDark:    0x424b5a,
  wall:         0xe9ecef,
  wallShade:    0xd6dae0,
  wallTop:      0xf2f4f6,
  towerRoof:    0x5b8ac8,
  towerRoofDark:0x4a76b4,
  wood:         0x8b5e3c,
  woodDark:     0x6f4a2f,
  steps:        0xeef1f4,
  path:         0xf0d9a8,
  houseWall:    0xf5f5f2,
  houseWallAlt: 0xeceae4,
  trunk:        0x6d4c33,
  leaf1:        0x5fb84a,
  leaf2:        0x4da33c,
  rock:         0xc8cdd4,
  flag:         0x6fa2dc
};

const NAMESPACES = {
  "default":     0x3b82f6,
  "kube-system": 0x8b5cf6,
  "frontend":    0x14b8a6,
  "backend":     0xf97316,
  "database":    0xeab308,
  "monitoring":  0xec4899
};

/* ---------------- DATOS ---------------- */
let podSeq = 0;
function pod(name, ns, containers = 1) {
  return { name: name || ("pod-" + (++podSeq)), ns, containers, image: "nginx:1.27", port: 8080 };
}

const nodeData = [
  { name: "node-01", region: "eu-west-1a", pods: [
    pod("api-gateway", "default", 2), pod("auth-service", "default", 1),
    pod("worker-queue", "backend", 2)
  ]},
  { name: "node-02", region: "eu-west-1b", pods: [
    pod("web-frontend", "frontend", 1), pod("web-static", "frontend", 1),
    pod("coredns", "kube-system", 1),
    pod("postgres", "database", 2),
    pod("order-api", "backend", 2)
  ]},
  { name: "node-03", region: "eu-west-1c", pods: [
    pod("cdn-edge", "default", 1),
    pod("grafana", "monitoring", 2),
    pod("checkout-ui", "frontend", 1),
    pod("redis-cache", "database", 1)
  ]},
  { name: "node-04", region: "eu-west-1a", pods: [
    pod("api-gateway", "default", 2), pod("auth-service", "default", 1),
    pod("worker-queue", "backend", 2)
  ]}
];

/* ---------------- THREE: ESCENA ---------------- */
const sceneEl = document.getElementById('scene');
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(38, innerWidth / innerHeight, 0.5, 2000);
let camYaw = 0.0, camPitch = 0.47, camDist = 150;
const camTarget = new THREE.Vector3(0, 0, 0);
let tweenDist = camDist, tweening = false;
const tweenTarget = camTarget.clone();

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
sceneEl.appendChild(renderer.domElement);

// luz difusa y suave (nada de sol duro)
scene.add(new THREE.HemisphereLight(0xffffff, 0xdfe8f2, 0.82));
const key = new THREE.DirectionalLight(0xffffff, 0.55);
key.position.set(40, 90, 60);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
Object.assign(key.shadow.camera, { left: -120, right: 120, top: 120, bottom: -120, near: 1, far: 320 });
key.shadow.bias = -0.0006;
key.shadow.normalBias = 0.03;
key.shadow.radius = 4;
scene.add(key);
const rim = new THREE.DirectionalLight(0xdce9ff, 0.25);
rim.position.set(-60, 40, -40);
scene.add(rim);

/* ---------------- HELPERS ---------------- */
function mat(color, opts = {}) {
  return new THREE.MeshLambertMaterial({ color, ...opts });
}

// caja con esquinas redondeadas (base en y=0, crece hacia +Y)
function roundedBox(w, h, d, r, seg = 5) {
  r = Math.min(r, w / 2 - 0.01, d / 2 - 0.01);
  const s = new THREE.Shape();
  const x = -w / 2, y = -d / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + d - r);
  s.quadraticCurveTo(x + w, y + d, x + w - r, y + d);
  s.lineTo(x + r, y + d);
  s.quadraticCurveTo(x, y + d, x, y + d - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  const g = new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: false, curveSegments: seg });
  g.rotateX(-Math.PI / 2);
  return g; // ocupa y ∈ [0, h]
}

const BOX = new THREE.BoxGeometry(1, 1, 1);
function box(w, h, d, color, opts) {
  const m = new THREE.Mesh(BOX, mat(color, opts));
  m.scale.set(w, h, d);
  return m;
}

// tejado a dos aguas (prisma triangular)
function gableRoof(w, d, h, color) {
  const g = new THREE.BufferGeometry();
  const hw = w / 2, hd = d / 2;
  const v = [
    -hw, 0, hd,  hw, 0, hd,  0, h, hd,
    -hw, 0, -hd, hw, 0, -hd, 0, h, -hd
  ];
  const idx = [0, 1, 2, 3, 5, 4, 0, 2, 5, 0, 5, 3, 1, 4, 5, 1, 5, 2, 0, 3, 4, 0, 4, 1];
  g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, mat(color));
  m.castShadow = true;
  return m;
}

function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// sprite con textura de canvas
function spriteFromCanvas(c, scaleX, scaleY) {
  const t = new THREE.CanvasTexture(c);
  t.minFilter = THREE.LinearFilter;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false }));
  sp.scale.set(scaleX, scaleY, 1);
  sp.renderOrder = 10;
  return sp;
}

// etiqueta blanca tipo "chincheta" con el nombre del nodo
function nodeLabelSprite(name) {
  const W = 420, H = 120, c = document.createElement('canvas');
  c.width = W; c.height = H;
  const x = c.getContext('2d');
  x.shadowColor = 'rgba(60,80,120,0.28)'; x.shadowBlur = 18; x.shadowOffsetY = 6;
  x.fillStyle = '#ffffff';
  roundRectPath(x, 14, 14, W - 28, 72, 14); x.fill();
  // pico inferior
  x.beginPath(); x.moveTo(W / 2 - 14, 84); x.lineTo(W / 2 + 14, 84); x.lineTo(W / 2, 104); x.closePath(); x.fill();
  x.shadowColor = 'transparent';
  // icono servidor
  x.fillStyle = '#8fa2bf';
  for (let i = 0; i < 3; i++) { roundRectPath(x, 40, 30 + i * 14, 26, 10, 3); x.fill(); }
  // texto
  x.fillStyle = '#1c2b47';
  x.font = '700 34px Inter, system-ui, sans-serif';
  x.textBaseline = 'middle';
  x.fillText(name, 82, 51);
  // punto verde
  const tw = x.measureText(name).width;
  x.fillStyle = '#35c878';
  x.beginPath(); x.arc(82 + tw + 22, 51, 9, 0, Math.PI * 2); x.fill();
  return spriteFromCanvas(c, 15, 4.3);
}

// píldora blanca "N pods"
function podPillSprite(n) {
  const W = 240, H = 90, c = document.createElement('canvas');
  c.width = W; c.height = H;
  const x = c.getContext('2d');
  x.shadowColor = 'rgba(50,70,110,0.30)'; x.shadowBlur = 14; x.shadowOffsetY = 4;
  x.fillStyle = '#ffffff';
  roundRectPath(x, 20, 22, W - 40, 46, 12); x.fill();
  x.shadowColor = 'transparent';
  x.fillStyle = '#22314e';
  x.font = '600 26px Inter, system-ui, sans-serif';
  x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText(n + (n === 1 ? ' pod' : ' pods'), W / 2, 46);
  return spriteFromCanvas(c, 5.4, 2.05);
}

/* ---------------- CONSTRUCTORES ---------------- */

// casita: muros claros + tejado del color del namespace
function buildHouse(p) {
  const g = new THREE.Group();
  const col = NAMESPACES[p.ns] ?? 0x94a3b8;
  const w = 2.5, d = 2.35, wallH = 1.75;

  const body = box(w, wallH, d, Math.random() < 0.5 ? COLORS.houseWall : COLORS.houseWallAlt);
  body.position.y = wallH / 2;
  body.castShadow = true; body.receiveShadow = true;
  g.add(body);

  const roof = gableRoof(w + 0.4, d + 0.4, 1.75, col);
  roof.position.y = wallH;
  g.add(roof);

  // remate del caballete
  const ridge = box(0.16, 0.16, d + 0.4, col);
  ridge.position.y = wallH + 1.75;
  g.add(ridge);

  // puerta
  const door = box(0.5, 0.72, 0.08, COLORS.wood);
  door.position.set(0, 0.36, d / 2 + 0.02);
  g.add(door);

  // ventanas
  [-0.62, 0.62].forEach(x => {
    const win = box(0.34, 0.34, 0.08, 0xbcd2ea);
    win.position.set(x, 0.92, d / 2 + 0.02);
    g.add(win);
  });

  // chimenea
  const ch = box(0.26, 0.7, 0.26, COLORS.houseWallAlt);
  ch.position.set(w * 0.28, wallH + 0.9, -d * 0.2);
  ch.castShadow = true;
  g.add(ch);

  g.traverse(o => { if (o.isMesh) o.userData.pick = { type: 'pod', pod: p }; });
  return g;
}

// zona de namespace: rectángulo redondeado con borde de color
function buildZone(ns, pods, node) {
  const g = new THREE.Group();
  const col = NAMESPACES[ns] ?? 0x94a3b8;
  const cols = Math.min(pods.length, 2);
  const rows = Math.ceil(pods.length / 2);
  const w = cols * 3.6 + 2.0;
  const d = rows * 3.6 + 2.6;

  // borde de color
  const border = new THREE.Mesh(roundedBox(w, 0.14, d, 0.9), mat(col));
  border.position.y = 0.02;
  border.receiveShadow = true;
  g.add(border);
  // relleno oscuro (deja ver el borde)
  const inner = new THREE.Mesh(roundedBox(w - 0.5, 0.16, d - 0.5, 0.75), mat(COLORS.floorDark));
  inner.position.y = 0.03;
  inner.receiveShadow = true;
  g.add(inner);

  // casitas
  pods.forEach((p, i) => {
    const cx = i % 2, cz = Math.floor(i / 2);
    const h = buildHouse(p);
    h.position.set(
      -(cols - 1) * 1.8 + cx * 3.6,
      0.19,
      -(rows - 1) * 1.8 + cz * 3.6 - 0.4
    );
    g.add(h);
  });

  // píldora con el número de pods
  const pill = podPillSprite(pods.length);
  pill.position.set(0, 1.5, d / 2 - 0.9);
  g.add(pill);

  g.userData.size = { w, d };
  [border, inner].forEach(m => m.userData.pick = { type: 'namespace', ns, node, count: pods.length });
  return g;
}

// muralla con almenas
function crenellatedWall(len, horizontal, gapWidth = 0) {
  const grp = new THREE.Group();
  const H = 4.0, T = 0.9;
  const body = horizontal ? box(len, H, T, COLORS.wall) : box(T, H, len, COLORS.wall);
  body.position.y = H / 2;
  body.castShadow = true; body.receiveShadow = true;
  grp.add(body);

  const mW = 0.85, gap = 0.65, step = mW + gap;
  const n = Math.floor(len / step);
  const start = -(n * step) / 2 + step / 2;
  for (let i = 0; i < n; i++) {
    const off = start + i * step;
    if (Math.abs(off) < gapWidth / 2) continue;
    const m = horizontal
      ? box(mW, 0.8, T, COLORS.wallTop)
      : box(T, 0.8, mW, COLORS.wallTop);
    m.position.set(horizontal ? off : 0, H + 0.4, horizontal ? 0 : off);
    m.castShadow = true;
    grp.add(m);
  }
  return grp;
}

function cornerTower() {
  const g = new THREE.Group();
  const H = 5.4, R = 1.35;
  const body = new THREE.Mesh(new THREE.CylinderGeometry(R, R * 1.06, H, 14), mat(COLORS.wall));
  body.position.y = H / 2; body.castShadow = true; body.receiveShadow = true;
  g.add(body);
  // anillo de almenas
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    const m = box(0.36, 0.55, 0.36, COLORS.wallTop);
    m.position.set(Math.cos(a) * (R - 0.1), H + 0.27, Math.sin(a) * (R - 0.1));
    g.add(m);
  }
  // techo cónico azul
  const roof = new THREE.Mesh(new THREE.ConeGeometry(R * 1.25, 2.4, 14), mat(COLORS.towerRoof));
  roof.position.y = H + 1.75; roof.castShadow = true;
  g.add(roof);
  // asta + banderín
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.6, 6), mat(0xb9c4d2));
  pole.position.y = H + 3.6; g.add(pole);
  const flag = box(0.9, 0.5, 0.06, COLORS.flag);
  flag.position.set(0.45, H + 4.1, 0);
  g.add(flag);
  return g;
}

// nodo completo: recinto amurallado con sus zonas dentro
function buildNode(node) {
  const g = new THREE.Group();
  g.userData.node = node;

  // agrupar pods por namespace
  const byNs = new Map();
  node.pods.forEach(p => {
    if (!byNs.has(p.ns)) byNs.set(p.ns, []);
    byNs.get(p.ns).push(p);
  });
  const zones = [...byNs.entries()].map(([ns, pods]) => ({ ns, pods, obj: buildZone(ns, pods, node) }));

  // rejilla 2 columnas de zonas
  const zCols = Math.min(zones.length, 2);
  const zRows = Math.ceil(zones.length / 2);
  const cellW = Math.max(...zones.map(z => z.obj.userData.size.w)) + 1.4;
  const cellD = Math.max(...zones.map(z => z.obj.userData.size.d)) + 1.4;

  const innerW = zCols * cellW;
  const innerD = zRows * cellD;
  const PAD = 3.2;                       // separación zona ↔ muralla
  const W = innerW + PAD * 2;
  const D = innerD + PAD * 2;
  g.userData.size = { W, D };

  // suelo interior oscuro
  const floor = new THREE.Mesh(roundedBox(W - 0.6, 0.3, D - 0.6, 1.2), mat(COLORS.floor));
  floor.position.y = 0;
  floor.receiveShadow = true;
  floor.userData.pick = { type: 'node', node };
  g.add(floor);

  // zonas colocadas
  zones.forEach((z, i) => {
    const cx = i % 2, cz = Math.floor(i / 2);
    z.obj.position.set(
      -(zCols - 1) * cellW / 2 + cx * cellW,
      0.3,
      -(zRows - 1) * cellD / 2 + cz * cellD
    );
    g.add(z.obj);
  });

  // murallas
  const hw = W / 2, hd = D / 2;
  const north = crenellatedWall(W, true);      north.position.set(0, 0, -hd);
  const south = crenellatedWall(W, true, 4.2); south.position.set(0, 0, hd);
  const west  = crenellatedWall(D, false);     west.position.set(-hw, 0, 0);
  const east  = crenellatedWall(D, false);     east.position.set(hw, 0, 0);
  g.add(north, south, west, east);

  // torres: esquinas + intermedias en los lados largos
  const towerSpots = [[-hw, -hd], [hw, -hd], [-hw, hd], [hw, hd]];
  if (W > 26) { towerSpots.push([0, -hd]); }
  if (D > 22) { towerSpots.push([-hw, 0], [hw, 0]); }
  towerSpots.forEach(([x, z]) => {
    const t = cornerTower();
    t.position.set(x, 0, z);
    g.add(t);
  });

  // portón + escaleras
  const gate = new THREE.Group();
  const arch = new THREE.Mesh(
    new THREE.CylinderGeometry(1.5, 1.5, 1.1, 16, 1, false, 0, Math.PI),
    mat(COLORS.wood)
  );
  arch.rotation.z = Math.PI / 2; arch.rotation.y = Math.PI / 2;
  arch.position.set(0, 2.5, hd);
  gate.add(arch);
  const doorPanel = box(3.0, 2.5, 1.1, COLORS.woodDark);
  doorPanel.position.set(0, 1.25, hd);
  gate.add(doorPanel);
  // escalones hacia el exterior
  for (let i = 0; i < 3; i++) {
    const st = box(3.8 + i * 0.5, 0.28, 0.75, COLORS.steps);
    st.position.set(0, 0.14 - i * 0.16, hd + 0.9 + i * 0.7);
    st.receiveShadow = true;
    gate.add(st);
  }
  gate.traverse(o => { if (o.isMesh) o.userData.pick = { type: 'node', node }; });
  g.add(gate);

  // etiqueta flotante del nodo
  const label = nodeLabelSprite(node.name);
  label.position.set(0, 11.5, 0);
  g.add(label);

  return g;
}

/* ---------------- MUNDO ---------------- */
const nodeGroups = [];
const platform = new THREE.Group();
scene.add(platform);
const worldGroup = new THREE.Group();
scene.add(worldGroup);

let platformMesh = null, platformSide = null;
const decoGroup = new THREE.Group();
scene.add(decoGroup);

function rng(seed) {
  let a = seed >>> 0;
  return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

function buildWorld() {
  // limpiar
  while (worldGroup.children.length) worldGroup.remove(worldGroup.children[0]);
  while (platform.children.length) platform.remove(platform.children[0]);
  while (decoGroup.children.length) decoGroup.remove(decoGroup.children[0]);
  nodeGroups.length = 0;

  // nodos en fila
  const GAP = 7;
  const groups = nodeData.map(n => buildNode(n));
  const totalW = groups.reduce((a, g) => a + g.userData.size.W, 0) + GAP * (groups.length - 1);
  let x = -totalW / 2;
  let maxD = 0;
  groups.forEach(g => {
    const w = g.userData.size.W;
    g.position.x = x + w / 2;
    x += w + GAP;
    maxD = Math.max(maxD, g.userData.size.D);
    worldGroup.add(g);
    nodeGroups.push(g);
  });

  // plataforma verde
  const MARGIN = 8.5;
  const pw = totalW + MARGIN * 2;
  const pd = maxD + MARGIN * 2;
  const PH = 2.6;

  platformMesh = new THREE.Mesh(roundedBox(pw, PH, pd, 3.5), mat(COLORS.platformTop));
  platformMesh.position.y = -PH;
  platformMesh.receiveShadow = true;
  platform.add(platformMesh);
  // faldón inferior algo más oscuro para dar grosor
  const skirt = new THREE.Mesh(roundedBox(pw - 0.7, 1.1, pd - 0.7, 3.2), mat(COLORS.platformEdge));
  skirt.position.y = -PH - 1.0;
  platform.add(skirt);

  // camino de arena delante de los portones
  const roadZ = maxD / 2 + 6.5;
  const road = new THREE.Mesh(roundedBox(totalW + 6, 0.12, 4.6, 1.2), mat(COLORS.path));
  road.position.set(0, 0.0, roadZ);
  road.receiveShadow = true;
  worldGroup.add(road);
  nodeGroups.forEach(g => {
    const hd = g.userData.size.D / 2;
    const len = roadZ - hd - 1.0;
    if (len <= 0.5) return;
    const spur = new THREE.Mesh(roundedBox(3.6, 0.12, len, 1.0), mat(COLORS.path));
    spur.position.set(g.position.x, 0.0, hd + 1.0 + len / 2);
    spur.receiveShadow = true;
    worldGroup.add(spur);
  });

  decorate(pw, pd, maxD, roadZ);
  updateCameraFraming(pw);
  refreshUI();
}

// árboles, arbustos y rocas por el césped
function decorate(pw, pd, maxD, roadZ) {
  const r = rng(4242);

  function tree(x, z, s) {
    const t = new THREE.Group();
    const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 1.3, 7), mat(COLORS.trunk));
    tr.position.y = 0.65; tr.castShadow = true; t.add(tr);
    const c1 = new THREE.Mesh(new THREE.ConeGeometry(1.5, 2.6, 9), mat(COLORS.leaf1));
    c1.position.y = 2.4; c1.castShadow = true; t.add(c1);
    const c2 = new THREE.Mesh(new THREE.ConeGeometry(1.15, 2.0, 9), mat(COLORS.leaf2));
    c2.position.y = 3.5; c2.castShadow = true; t.add(c2);
    t.position.set(x, 0, z); t.scale.setScalar(s);
    decoGroup.add(t);
  }
  function bush(x, z, s) {
    const b = new THREE.Mesh(new THREE.IcosahedronGeometry(0.75, 0), mat(COLORS.leaf1));
    b.position.set(x, 0.4, z); b.scale.set(s, s * 0.8, s);
    b.rotation.y = r() * 3; b.castShadow = true;
    decoGroup.add(b);
  }
  function rock(x, z, s) {
    const k = new THREE.Mesh(new THREE.DodecahedronGeometry(0.5, 0), mat(COLORS.rock));
    k.position.set(x, 0.25, z); k.scale.set(s, s * 0.7, s);
    k.rotation.set(r(), r(), r()); k.castShadow = true;
    decoGroup.add(k);
  }

  const hx = pw / 2 - 3.6, hz = pd / 2 - 3.6;

  // franja trasera: pocos y pequeños, pegados al borde
  for (let x = -hx; x <= hx; x += 12) {
    const jx = (r() - 0.5) * 2.5;
    const z = -hz + (r() - 0.5) * 1.6;
    r() < 0.6 ? tree(x + jx, z, 0.55 + r() * 0.25) : bush(x + jx, z, 0.7 + r() * 0.3);
  }
  // franja delantera, siempre por delante del camino
  for (let x = -hx; x <= hx; x += 13) {
    const jx = (r() - 0.5) * 2.5;
    const z = hz + (r() - 0.5) * 1.4;
    if (z < roadZ + 3.5) continue;
    r() < 0.5 ? tree(x + jx, z, 0.55 + r() * 0.25) : rock(x + jx, z, 0.7 + r() * 0.4);
  }
  // esquinas laterales
  [-hx, hx].forEach(x => {
    [-hz + 6, 0, hz - 6].forEach(z => {
      const jz = (r() - 0.5) * 2.0;
      r() < 0.55 ? tree(x + (r() - 0.5) * 1.2, z + jz, 0.55 + r() * 0.25)
                 : bush(x, z + jz, 0.7 + r() * 0.3);
    });
  });
}

function updateCameraFraming(pw) {
  camDist = pw * 1.02;
  tweenDist = camDist;
}

/* ---------------- UI ---------------- */
function refreshUI() {
  const pods = nodeData.reduce((a, n) => a + n.pods.length, 0);
  const containers = nodeData.reduce((a, n) => a + n.pods.reduce((b, p) => b + p.containers, 0), 0);
  const nss = new Set();
  nodeData.forEach(n => n.pods.forEach(p => nss.add(p.ns)));

  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set('nodeCount', nodeData.length);
  set('podCount', pods);
  set('statPods', pods);
  set('statNodes', nodeData.length);
  set('statNamespaces', nss.size);
  set('statContainers', containers);

  const legend = document.getElementById('namespaceLegend');
  if (legend) {
    legend.innerHTML = '';
    Object.keys(NAMESPACES).forEach(ns => {
      if (!nss.has(ns)) return;
      const hex = '#' + NAMESPACES[ns].toString(16).padStart(6, '0');
      const d = document.createElement('div');
      d.className = 'namespace-item';
      d.innerHTML = `<span class="namespace-dot" style="background:${hex}"></span>${ns}`;
      legend.appendChild(d);
    });
  }
}

const infoPanel = document.getElementById('infoPanel');
const infoKind = document.getElementById('infoKind');
const infoTitle = document.getElementById('infoTitle');
const infoRows = document.getElementById('infoRows');
document.getElementById('closeInfo')?.addEventListener('click', () => infoPanel.classList.remove('show'));

function showInfo(pick) {
  if (!infoPanel) return;
  infoRows.innerHTML = '';
  const row = (k, v) => {
    const d = document.createElement('div');
    d.className = 'info-row';
    d.innerHTML = `<span>${k}</span><span>${v}</span>`;
    infoRows.appendChild(d);
  };

  if (pick.type === 'pod') {
    const p = pick.pod;
    infoKind.textContent = 'Pod';
    infoTitle.textContent = p.name;
    row('Namespace', p.ns);
    row('Contenedores', p.containers);
    row('Imagen', p.image);
    row('Puerto', ':' + p.port);
    const owner = nodeData.find(n => n.pods.includes(p));
    row('Nodo', owner ? owner.name : '—');
    row('Estado', 'Running');
  } else if (pick.type === 'namespace') {
    infoKind.textContent = 'Namespace';
    infoTitle.textContent = pick.ns;
    row('En el nodo', pick.node.name);
    row('Pods aquí', pick.count);
    const total = nodeData.reduce((a, n) => a + n.pods.filter(p => p.ns === pick.ns).length, 0);
    row('Pods totales', total);
    row('Nodos', nodeData.filter(n => n.pods.some(p => p.ns === pick.ns)).length);
  } else if (pick.type === 'node') {
    const n = pick.node;
    infoKind.textContent = 'Nodo';
    infoTitle.textContent = n.name;
    row('Región', n.region);
    row('Pods', n.pods.length);
    row('Namespaces', new Set(n.pods.map(p => p.ns)).size);
    row('Contenedores', n.pods.reduce((a, p) => a + p.containers, 0));
    row('Estado', 'Ready');
  }
  infoPanel.classList.add('show');
}

/* ---------------- INTERACCIÓN ---------------- */
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let dragging = false, moved = false, lastX = 0, lastY = 0;

renderer.domElement.addEventListener('pointerdown', e => {
  dragging = true; moved = false; lastX = e.clientX; lastY = e.clientY; tweening = false;
});
addEventListener('pointerup', () => dragging = false);
addEventListener('pointermove', e => {
  if (!dragging) return;
  if (Math.hypot(e.clientX - lastX, e.clientY - lastY) > 4) moved = true;
  camYaw -= (e.clientX - lastX) * 0.005;
  camPitch = Math.max(0.12, Math.min(1.15, camPitch - (e.clientY - lastY) * 0.004));
  lastX = e.clientX; lastY = e.clientY;
});

renderer.domElement.addEventListener('click', e => {
  if (moved) return;
  mouse.x = (e.clientX / innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(worldGroup.children, true);
  for (const h of hits) {
    if (h.object.userData && h.object.userData.pick) { showInfo(h.object.userData.pick); return; }
  }
  infoPanel?.classList.remove('show');
});

renderer.domElement.addEventListener('wheel', e => {
  e.preventDefault();
  tweening = false;
  const old = camDist;
  camDist = Math.max(35, Math.min(420, camDist + e.deltaY * 0.12));
  mouse.x = (e.clientX / innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const hit = new THREE.Vector3();
  if (raycaster.ray.intersectPlane(plane, hit)) {
    const t = 1 - camDist / old;
    camTarget.lerp(hit, t * 0.85);
    camTarget.y = 0;
  }
}, { passive: false });

renderer.domElement.addEventListener('dblclick', e => {
  mouse.x = (e.clientX / innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(worldGroup.children, true);
  for (const h of hits) {
    if (h.object.userData && h.object.userData.pick) {
      const p = h.object.userData.pick;
      const c = new THREE.Vector3();
      if (p.type === 'node') {
        const ng = nodeGroups.find(g => g.userData.node === p.node);
        if (ng) new THREE.Box3().setFromObject(ng).getCenter(c);
        tweenDist = 90;
      } else {
        c.copy(h.point); tweenDist = p.type === 'pod' ? 42 : 62;
      }
      c.y = 0;
      tweenTarget.copy(c); tweening = true;
      return;
    }
  }
});

// desplazamiento con WASD / flechas
const keys = {};
const PAN = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D'];
addEventListener('keydown', e => { if (PAN.includes(e.key)) { keys[e.key.toLowerCase()] = true; tweening = false; e.preventDefault(); } });
addEventListener('keyup', e => { if (PAN.includes(e.key)) keys[e.key.toLowerCase()] = false; });
const panVel = new THREE.Vector3();
function updatePan() {
  const up = keys['arrowup'] || keys['w'], down = keys['arrowdown'] || keys['s'];
  const left = keys['arrowleft'] || keys['a'], right = keys['arrowright'] || keys['d'];
  const fwd = new THREE.Vector3(-Math.sin(camYaw), 0, -Math.cos(camYaw));
  const rt = new THREE.Vector3(Math.cos(camYaw), 0, -Math.sin(camYaw));
  const dir = new THREE.Vector3();
  if (up) dir.add(fwd); if (down) dir.sub(fwd);
  if (right) dir.add(rt); if (left) dir.sub(rt);
  const max = camDist * 0.006;
  const target = dir.lengthSq() > 0 ? dir.normalize().multiplyScalar(max) : new THREE.Vector3();
  panVel.lerp(target, dir.lengthSq() > 0 ? 0.12 : 0.08);
  if (panVel.lengthSq() > 1e-7) camTarget.add(panVel);
}

/* ---------------- LOOP ---------------- */
function animate() {
  requestAnimationFrame(animate);
  updatePan();
  if (tweening) {
    camTarget.lerp(tweenTarget, 0.05);
    camDist += (tweenDist - camDist) * 0.05;
    if (camTarget.distanceTo(tweenTarget) < 0.1 && Math.abs(camDist - tweenDist) < 0.2) tweening = false;
  }
  camera.position.set(
    camTarget.x + camDist * Math.sin(camYaw) * Math.cos(camPitch),
    camTarget.y + camDist * Math.sin(camPitch),
    camTarget.z + camDist * Math.cos(camYaw) * Math.cos(camPitch)
  );
  camera.lookAt(camTarget);
  renderer.render(scene, camera);
}

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

buildWorld();
animate();
