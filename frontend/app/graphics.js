/* ---------------- HELPERS ---------------- */
function createSurfaceTexture() {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);

  // Variaciones tonales deterministas: manchas suaves y grano muy fino.
  let seed = 918273;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  for (let i = 0; i < 90; i++) {
    const x = random() * size;
    const y = random() * size;
    const radius = 1.5 + random() * 5;
    const cool = random() > 0.48;
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, cool ? 'rgba(96,132,176,.09)' : 'rgba(188,137,82,.075)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }

  for (let i = 0; i < 170; i++) {
    const alpha = 0.03 + random() * 0.04;
    ctx.fillStyle = random() > 0.45
      ? `rgba(43,62,86,${alpha})`
      : `rgba(181,124,70,${alpha * 0.8})`;
    const grain = 3.2 + random() * 4.8;
    ctx.fillRect(random() * size, random() * size, grain, grain);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1.6, 1.6);
  texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
  return texture;
}

const surfaceTexture = createSurfaceTexture();

function mat(color, opts = {}) {
  return new THREE.MeshLambertMaterial({ color, ...opts });
}

function texturedMat(color, opts = {}) {
  return new THREE.MeshLambertMaterial({ color, map: surfaceTexture, ...opts });
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
  return spriteFromCanvas(c, 12.6, 3.6);
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
  return spriteFromCanvas(c, 4.8, 1.82);
}

/* ---------------- CONSTRUCTORES ---------------- */

function markPodMeshes(group, podData) {
  group.traverse(object => {
    if (object.isMesh) object.userData.pick = { type: 'pod', pod: podData };
  });
  return group;
}

// Running: casa terminada y operativa.
function buildRunningHouse(p) {
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

  return markPodMeshes(g, p);
}

// Pending: estructura todavía en construcción.
function buildPendingHouse(p) {
  const g = new THREE.Group();
  const w = 2.5, d = 2.35;

  const foundation = box(w, 0.25, d, COLORS.pendingDark);
  foundation.position.y = 0.125;
  foundation.receiveShadow = true;
  g.add(foundation);

  // Pilares y vigas hacen que se reconozca incluso sin depender del color.
  [[-1, -0.9], [1, -0.9], [-1, 0.9], [1, 0.9]].forEach(([x, z]) => {
    const post = box(0.18, 1.75, 0.18, COLORS.wood);
    post.position.set(x, 1.1, z);
    post.castShadow = true;
    g.add(post);
  });
  [-0.9, 0.9].forEach(z => {
    const beam = box(2.2, 0.18, 0.18, COLORS.woodDark);
    beam.position.set(0, 1.92, z);
    g.add(beam);
  });

  const partialWall = box(1.35, 0.85, d - 0.3, COLORS.houseWallAlt);
  partialWall.position.set(-0.48, 0.68, 0);
  partialWall.castShadow = true;
  g.add(partialWall);

  const roofFrame = gableRoof(w + 0.35, d + 0.35, 1.55, COLORS.pending);
  roofFrame.position.y = 2;
  roofFrame.material = new THREE.MeshLambertMaterial({ color: COLORS.pending, wireframe: true });
  g.add(roofFrame);

  const marker = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 10, 8),
    mat(COLORS.pending, { emissive: COLORS.pendingDark, emissiveIntensity: 0.35 })
  );
  marker.position.set(0, 3.75, 0);
  g.add(marker);

  return markPodMeshes(g, p);
}

// Error: edificio dañado, alarma y humo para agrupar cualquier fallo técnico.
function buildErrorHouse(p) {
  const g = new THREE.Group();
  const namespaceColor = NAMESPACES[p.ns] ?? 0x94a3b8;
  const w = 2.5, d = 2.35, wallH = 1.6;

  const body = box(w, wallH, d, 0xc8b9b4);
  body.position.y = wallH / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  g.add(body);

  const roof = gableRoof(w + 0.4, d + 0.4, 1.65, COLORS.errorDark);
  roof.position.set(0.12, wallH + 0.05, 0);
  roof.rotation.z = -0.1;
  g.add(roof);

  const door = box(0.56, 0.78, 0.09, COLORS.woodDark);
  door.position.set(0, 0.39, d / 2 + 0.02);
  g.add(door);

  // Grietas frontales.
  [[-0.65, 1.05, -0.35], [0.72, 0.82, 0.3]].forEach(([x, y, angle]) => {
    const crack = box(0.08, 0.68, 0.1, COLORS.errorDark);
    crack.position.set(x, y, d / 2 + 0.04);
    crack.rotation.z = angle;
    g.add(crack);
  });

  const alarm = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 10, 8),
    mat(COLORS.error, { emissive: COLORS.error, emissiveIntensity: 0.8 })
  );
  alarm.position.set(-0.72, wallH + 1.6, 0);
  g.add(alarm);

  // El pequeño estandarte conserva el color del namespace.
  const flag = box(0.75, 0.34, 0.06, namespaceColor);
  flag.position.set(0.38, wallH + 1.25, d / 2 + 0.12);
  g.add(flag);

  [0, 1, 2].forEach(i => {
    const smoke = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.25 + i * 0.08, 1),
      mat(COLORS.smoke, { transparent: true, opacity: 0.72 - i * 0.14 })
    );
    smoke.position.set(0.72 + i * 0.12, wallH + 1.7 + i * 0.48, -0.3);
    smoke.scale.set(1.1, 0.85, 1);
    g.add(smoke);
  });

  return markPodMeshes(g, p);
}

function buildHouse(p) {
  let house;
  if (p.status === 'Pending') house = buildPendingHouse(p);
  else if (p.status === 'Error') house = buildErrorHouse(p);
  else house = buildRunningHouse(p);
  house.userData.podStatus = p.status;
  house.userData.podData = p;
  return house;
}

// zona de namespace: rectángulo redondeado con borde de color
function buildZone(ns, pods, node) {
  const g = new THREE.Group();
  g.userData.namespaceZone = ns;
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
  const inner = new THREE.Mesh(roundedBox(w - 0.5, 0.16, d - 0.5, 0.75), texturedMat(COLORS.floorDark));
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
  const body = horizontal
    ? box(len, H, T, COLORS.wall, { map: surfaceTexture })
    : box(T, H, len, COLORS.wall, { map: surfaceTexture });
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
      ? box(mW, 0.8, T, COLORS.wallTop, { map: surfaceTexture })
      : box(T, 0.8, mW, COLORS.wallTop, { map: surfaceTexture });
    m.position.set(horizontal ? off : 0, H + 0.4, horizontal ? 0 : off);
    m.castShadow = true;
    grp.add(m);
  }
  return grp;
}

function cornerTower() {
  const g = new THREE.Group();
  const H = 5.4, R = 1.35;
  const body = new THREE.Mesh(new THREE.CylinderGeometry(R, R * 1.06, H, 14), texturedMat(COLORS.wall));
  body.position.y = H / 2; body.castShadow = true; body.receiveShadow = true;
  g.add(body);
  // anillo de almenas
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    const m = box(0.36, 0.55, 0.36, COLORS.wallTop, { map: surfaceTexture });
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
  const floor = new THREE.Mesh(roundedBox(W - 0.6, 0.3, D - 0.6, 1.2), texturedMat(COLORS.floor));
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

  // portón
  const gate = new THREE.Group();
  const arch = new THREE.Mesh(
    new THREE.CylinderGeometry(1.5, 1.5, 1.1, 16, 1, false, 0, Math.PI),
    mat(COLORS.wood)
  );
  arch.rotation.z = Math.PI / 2; arch.rotation.y = Math.PI / 2;
  arch.position.set(0, 2.5, hd);
  gate.add(arch);
  const doorPanel = box(3.0, 2.5, 1.1, COLORS.wood);
  doorPanel.position.set(0, 1.25, hd);
  gate.add(doorPanel);
  gate.traverse(o => { if (o.isMesh) o.userData.pick = { type: 'node', node }; });
  g.add(gate);

  // etiqueta flotante del nodo
  const label = nodeLabelSprite(node.name);
  label.position.set(0, 11.5, 0);
  g.add(label);

  return g;
}
