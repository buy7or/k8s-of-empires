/* ---------------- MUNDO ---------------- */
const nodeGroups = [];
const platform = new THREE.Group();
scene.add(platform);
const worldGroup = new THREE.Group();
scene.add(worldGroup);

let platformMesh = null;
const decoGroup = new THREE.Group();
scene.add(decoGroup);
const hiddenPodStatuses = new Set();
const activePodLabelFilters = new Set();
const activePodNamespaceFilters = new Set();

function applyNamespaceVisibility() {
  worldGroup.traverse(object => {
    const namespace = object.userData.namespaceZone;
    if (namespace) object.visible = isPodNamespaceVisible(namespace);
  });
}

function isPodStatusVisible(status) {
  return !hiddenPodStatuses.has(status);
}

function setPodStatusVisibility(status, visible) {
  if (visible) hiddenPodStatuses.delete(status);
  else hiddenPodStatuses.add(status);
  applyPodFilters();
  hideInfo();
}

function isPodLabelVisible(podData) {
  return [...activePodLabelFilters].every(selector => {
    const separator = selector.indexOf('=');
    const key = selector.slice(0, separator);
    const value = selector.slice(separator + 1);
    return podData.labels?.[key] === value;
  });
}

function addPodLabelFilter(selector) {
  activePodLabelFilters.add(selector);
  applyPodFilters();
  hideInfo();
}

function removePodLabelFilter(selector) {
  activePodLabelFilters.delete(selector);
  applyPodFilters();
  hideInfo();
}

function getPodLabelFilters() {
  return [...activePodLabelFilters];
}

function isPodNamespaceVisible(namespace) {
  return activePodNamespaceFilters.size === 0 || activePodNamespaceFilters.has(namespace);
}

function togglePodNamespaceFilter(namespace) {
  if (activePodNamespaceFilters.has(namespace)) activePodNamespaceFilters.delete(namespace);
  else activePodNamespaceFilters.add(namespace);
  applyNamespaceVisibility();
  applyPodFilters();
  hideInfo();
}

function clearPodNamespaceFilters() {
  activePodNamespaceFilters.clear();
  applyNamespaceVisibility();
  applyPodFilters();
  hideInfo();
}

function getPodNamespaceFilters() {
  return [...activePodNamespaceFilters];
}

function isPodFilterVisible(podData) {
  return isPodLabelVisible(podData) && isPodNamespaceVisible(podData.ns);
}

function applyPodFilters() {
  worldGroup.traverse(object => {
    const podData = object.userData.podData;
    if (podData) {
      object.visible = isPodStatusVisible(podData.status) && isPodFilterVisible(podData);
    }
  });
}

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

  // nodos en una cuadrícula lo más cuadrada posible
  const COL_GAP = 7;
  const ROW_GAP = 13;
  const groups = nodeData.map(n => buildNode(n));
  if (!groups.length) {
    refreshUI();
    return;
  }
  const cols = Math.ceil(Math.sqrt(groups.length));
  const rows = Math.ceil(groups.length / cols);
  const rowGroups = Array.from({ length: rows }, (_, row) =>
    groups.slice(row * cols, Math.min((row + 1) * cols, groups.length))
  );
  const rowWidths = rowGroups.map(items =>
    items.reduce((sum, g) => sum + g.userData.size.W, 0) + COL_GAP * (items.length - 1)
  );
  const rowDepths = rowGroups.map(items =>
    Math.max(...items.map(g => g.userData.size.D))
  );
  const totalW = Math.max(...rowWidths);
  const totalD = rowDepths.reduce((sum, depth) => sum + depth, 0) + ROW_GAP * (rows - 1);
  const rowSouthEdges = [];
  let zCursor = -totalD / 2;

  rowGroups.forEach((items, row) => {
    const rowSouth = zCursor + rowDepths[row];
    rowSouthEdges.push(rowSouth);
    let xCursor = -rowWidths[row] / 2;

    items.forEach(g => {
      const { W, D } = g.userData.size;
      g.position.set(xCursor + W / 2, 0, rowSouth - D / 2);
      xCursor += W + COL_GAP;
      worldGroup.add(g);
      nodeGroups.push(g);
    });

    zCursor = rowSouth + ROW_GAP;
  });

  // plataforma verde
  const SIDE_MARGIN = 8.5;
  const BACK_MARGIN = 15;
  const FRONT_MARGIN = 12;
  const pw = totalW + SIDE_MARGIN * 2;
  const pd = totalD + BACK_MARGIN + FRONT_MARGIN;
  const platformZ = (FRONT_MARGIN - BACK_MARGIN) / 2;
  const PH = 2.6;

  platformMesh = new THREE.Mesh(roundedBox(pw, PH, pd, 3.5), texturedMat(COLORS.platformTop));
  platformMesh.position.set(0, -PH, platformZ);
  platformMesh.receiveShadow = true;
  platform.add(platformMesh);
  // faldón inferior algo más oscuro para dar grosor
  const skirt = new THREE.Mesh(roundedBox(pw - 0.7, 1.1, pd - 0.7, 3.2), texturedMat(COLORS.platformEdge));
  skirt.position.set(0, -PH - 1.0, platformZ);
  platform.add(skirt);

  // un camino de arena por cada fila, delante de sus portones
  let frontRoadZ = 0;
  for (let row = 0; row < rows; row++) {
    const roadZ = rowSouthEdges[row] + ROW_GAP / 2;
    frontRoadZ = roadZ;

    const road = new THREE.Mesh(roundedBox(totalW + 6, 0.12, 4.6, 1.2), texturedMat(COLORS.path));
    road.position.set(0, 0.0, roadZ);
    road.receiveShadow = true;
    worldGroup.add(road);

    rowGroups[row].forEach(g => {
      const hd = g.userData.size.D / 2;
      const gateZ = g.position.z + hd;
      const len = roadZ - gateZ;
      if (len <= 0.5) return;
      const spur = new THREE.Mesh(roundedBox(3.6, 0.12, len, 1.0), texturedMat(COLORS.path));
      spur.position.set(g.position.x, 0.0, gateZ + len / 2);
      spur.receiveShadow = true;
      worldGroup.add(spur);
    });
  }

  decorate(pw, pd, frontRoadZ, platformZ);
  applyNamespaceVisibility();
  applyPodFilters();
  updateCameraFraming(Math.max(pw, pd), platformZ);
  refreshUI();
}

// árboles, arbustos y rocas por el césped
function decorate(pw, pd, roadZ, platformZ = 0) {
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
  const backZ = platformZ - hz;
  const frontZ = platformZ + hz;

  // franja trasera: pocos y pequeños, pegados al borde
  for (let x = -hx; x <= hx; x += 12) {
    const jx = (r() - 0.5) * 2.5;
    const z = backZ + (r() - 0.5) * 1.6;
    r() < 0.6 ? tree(x + jx, z, 0.55 + r() * 0.25) : bush(x + jx, z, 0.7 + r() * 0.3);
  }
  // franja delantera, siempre por delante del camino
  for (let x = -hx; x <= hx; x += 13) {
    const jx = (r() - 0.5) * 2.5;
    const z = frontZ + (r() - 0.5) * 1.4;
    if (z < roadZ + 3.5) continue;
    r() < 0.5 ? tree(x + jx, z, 0.55 + r() * 0.25) : rock(x + jx, z, 0.7 + r() * 0.4);
  }
  // esquinas laterales
  [-hx, hx].forEach(x => {
    [backZ + 6, platformZ, frontZ - 6].forEach(z => {
      const jz = (r() - 0.5) * 2.0;
      r() < 0.55 ? tree(x + (r() - 0.5) * 1.2, z + jz, 0.55 + r() * 0.25)
                 : bush(x, z + jz, 0.7 + r() * 0.3);
    });
  });
}

function updateCameraFraming(size, centerZ) {
  cameraState.target.set(0, 0, centerZ);
  cameraState.tweenTarget.copy(cameraState.target);
  cameraState.distance = size * 1.8;
  cameraState.tweenDistance = cameraState.distance;
}
