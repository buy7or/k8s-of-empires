const NAMESPACES = {
  default: 0x4f8df7,
  'kube-system': 0x9365df,
  frontend: 0x54c6b2,
  backend: 0xf28b45,
  database: 0xf4cc3f,
  monitoring: 0xee77a7,
};

const nodeData = [
  { name: 'node-01', ip: '192.168.1.101', cpu: 21, memory: 43, pods: [
    { name: 'frontend-7d8f', ns: 'frontend', image: 'nginx:1.27', containers: 1 },
    { name: 'frontend-56bc', ns: 'frontend', image: 'nginx:1.27', containers: 1 },
    { name: 'postgres-0', ns: 'database', image: 'postgres:16', containers: 1 },
  ]},
  { name: 'node-02', ip: '192.168.1.102', cpu: 34, memory: 51, pods: [
    { name: 'api-67bb', ns: 'backend', image: 'ghcr.io/demo/api:1.0', containers: 1 },
    { name: 'worker-7f4c', ns: 'backend', image: 'ghcr.io/demo/worker:1.0', containers: 1 },
    { name: 'coredns-6f9', ns: 'kube-system', image: 'coredns:1.11', containers: 1 },
    { name: 'prometheus-0', ns: 'monitoring', image: 'prom/prometheus:v2.53', containers: 2 },
  ]},
  { name: 'node-03', ip: '192.168.1.103', cpu: 18, memory: 39, pods: [
    { name: 'grafana-5c9', ns: 'monitoring', image: 'grafana/grafana:11', containers: 1 },
    { name: 'traefik-7cc', ns: 'kube-system', image: 'traefik:v3.1', containers: 1 },
    { name: 'redis-0', ns: 'database', image: 'redis:7.2', containers: 1 },
    { name: 'landing-6df', ns: 'default', image: 'nginx:1.27', containers: 1 },
  ]},
];

const sceneRoot = document.getElementById('scene');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf4f8ff);
scene.fog = new THREE.Fog(0xf4f8ff, 75, 145);

const aspect = innerWidth / innerHeight;
const frustum = 42;
const camera = new THREE.OrthographicCamera(-frustum * aspect, frustum * aspect, frustum, -frustum, 0.1, 300);
camera.position.set(56, 52, 64);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputEncoding = THREE.sRGBEncoding;
sceneRoot.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xffffff, 0xb7c8a3, 1.25));
const sun = new THREE.DirectionalLight(0xfff7df, 2.0);
sun.position.set(-28, 52, 26);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -90, right: 90, top: 70, bottom: -70, near: 1, far: 180 });
scene.add(sun);

const MAT = {
  grass: new THREE.MeshStandardMaterial({ color: 0xb9e681, roughness: 0.95 }),
  grassEdge: new THREE.MeshStandardMaterial({ color: 0x8dc65a, roughness: 1 }),
  stone: new THREE.MeshStandardMaterial({ color: 0xe8ebef, roughness: 0.92 }),
  stoneDark: new THREE.MeshStandardMaterial({ color: 0xb9c0c8, roughness: 0.95 }),
  wood: new THREE.MeshStandardMaterial({ color: 0x8b572a, roughness: 0.9 }),
  road: new THREE.MeshStandardMaterial({ color: 0xf4d698, roughness: 1 }),
};
const box = new THREE.BoxGeometry(1, 1, 1);
const world = new THREE.Group();
scene.add(world);
const pickables = [];

function mesh(geometry, material, scale, position) {
  const m = new THREE.Mesh(geometry, material);
  m.scale.set(...scale);
  m.position.set(...position);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function colorMat(hex, opacity = 1) {
  return new THREE.MeshStandardMaterial({ color: hex, roughness: 0.78, transparent: opacity < 1, opacity });
}

function canvasLabel(text, opts = {}) {
  const { width = 300, height = 82, bg = 'rgba(255,255,255,.96)', fg = '#25324a', accent = '#4f8df7', font = 28 } = opts;
  const c = document.createElement('canvas'); c.width = width; c.height = height;
  const x = c.getContext('2d');
  x.fillStyle = bg; roundedRect(x, 4, 4, width - 8, height - 8, 18); x.fill();
  x.strokeStyle = accent; x.lineWidth = 4; roundedRect(x, 4, 4, width - 8, height - 8, 18); x.stroke();
  x.font = `700 ${font}px Inter`; x.fillStyle = fg; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText(text, width / 2, height / 2 + 1);
  const texture = new THREE.CanvasTexture(c); texture.encoding = THREE.sRGBEncoding;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false }));
  sprite.scale.set(width / 70, height / 70, 1);
  return sprite;
}

function roundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r);
  ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath();
}

function buildHouse(pod, scale = 1) {
  const g = new THREE.Group();
  const nsColor = NAMESPACES[pod.ns] ?? 0x8aa0b8;
  const walls = mesh(box, colorMat(0xf9f6ee), [1.65, 1.3, 1.55], [0, 0.65, 0]);
  g.add(walls);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(1.45, 1.35, 4), colorMat(nsColor));
  roof.rotation.y = Math.PI / 4;
  roof.position.y = 1.78;
  roof.castShadow = true;
  g.add(roof);
  const door = mesh(box, MAT.wood, [.34, .62, .08], [0, .32, .82]); g.add(door);
  const chimney = mesh(box, colorMat(0xa06b3b), [.22, .65, .22], [.48, 2.05, 0]); g.add(chimney);
  const badge = canvasLabel(pod.name.split('-')[0], { width: 240, height: 62, accent: '#' + nsColor.toString(16).padStart(6,'0'), font: 24 });
  badge.position.set(0, -.25, 1.25); badge.scale.multiplyScalar(.75); g.add(badge);
  g.scale.setScalar(scale);
  g.userData.pick = { type: 'pod', pod };
  g.traverse(o => { if (o.isMesh) { o.userData.pick = g.userData.pick; pickables.push(o); } });
  return g;
}

function buildCastle(node, index) {
  const podCount = node.pods.length;
  const cols = Math.max(2, Math.ceil(Math.sqrt(podCount)));
  const rows = Math.ceil(podCount / cols);
  const plotW = Math.max(12, cols * 4.2 + 3.2);
  const plotD = Math.max(12, rows * 4.2 + 3.2);
  const g = new THREE.Group();
  g.userData.plotW = plotW; g.userData.plotD = plotD;

  const floor = mesh(box, colorMat(0xe8edf3), [plotW, .55, plotD], [0, -.18, 0]);
  floor.userData.pick = { type: 'node', node }; pickables.push(floor); g.add(floor);

  const wallH = 3.5, wallT = .65;
  const wallSpecs = [
    [plotW, wallH, wallT, 0, wallH/2, -plotD/2],
    [plotW, wallH, wallT, 0, wallH/2, plotD/2],
    [wallT, wallH, plotD, -plotW/2, wallH/2, 0],
    [wallT, wallH, plotD, plotW/2, wallH/2, 0],
  ];
  wallSpecs.forEach(s => {
    const w = mesh(box, MAT.stone, s.slice(0,3), s.slice(3));
    w.userData.pick = { type: 'node', node }; pickables.push(w); g.add(w);
  });

  const towerGeo = new THREE.CylinderGeometry(1.05, 1.15, 4.5, 12);
  [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([sx,sz]) => {
    const t = new THREE.Group();
    const body = new THREE.Mesh(towerGeo, MAT.stone); body.position.y = 2.1; body.castShadow = true; t.add(body);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(1.45, 1.6, 10), colorMat(0x6d9fe8)); roof.position.y = 5.1; roof.castShadow = true; t.add(roof);
    t.position.set(sx * plotW/2, 0, sz * plotD/2); g.add(t);
  });

  const gate = mesh(box, MAT.wood, [2.0, 2.45, .45], [0, 1.2, plotD/2 + .18]); g.add(gate);
  const stairs = mesh(box, MAT.stoneDark, [2.4, .35, 2.1], [0, .05, plotD/2 + 1.15]); g.add(stairs);

  const label = canvasLabel(node.name, { width: 290, height: 72, accent:'#d6deea', font: 28 });
  label.position.set(0, 6.6, -plotD/2 + .2); g.add(label);

  const grouped = new Map();
  node.pods.forEach(p => { if (!grouped.has(p.ns)) grouped.set(p.ns, []); grouped.get(p.ns).push(p); });
  const groups = [...grouped.entries()];
  const zoneCols = Math.max(1, Math.ceil(Math.sqrt(groups.length)));
  const zoneRows = Math.ceil(groups.length / zoneCols);
  const zoneW = (plotW - 3) / zoneCols;
  const zoneD = (plotD - 3) / zoneRows;

  groups.forEach(([ns, pods], i) => {
    const zx = i % zoneCols, zz = Math.floor(i / zoneCols);
    const cx = -plotW/2 + 1.5 + zoneW/2 + zx*zoneW;
    const cz = -plotD/2 + 1.5 + zoneD/2 + zz*zoneD;
    const nsColor = NAMESPACES[ns] ?? 0x8aa0b8;
    const zone = mesh(box, colorMat(nsColor, .24), [zoneW-.45, .15, zoneD-.45], [cx, .18, cz]);
    zone.userData.pick = { type: 'namespace', ns, node, count: pods.length }; pickables.push(zone); g.add(zone);

    const outline = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(zoneW-.45, .17, zoneD-.45)),
      new THREE.LineBasicMaterial({ color: nsColor })
    );
    outline.position.set(cx, .2, cz); g.add(outline);

    const pcols = Math.max(1, Math.ceil(Math.sqrt(pods.length)));
    const prows = Math.ceil(pods.length / pcols);
    const spacingX = Math.min(3.2, (zoneW - 1.6) / Math.max(1,pcols));
    const spacingZ = Math.min(3.2, (zoneD - 1.6) / Math.max(1,prows));
    pods.forEach((pod, pi) => {
      const px = pi % pcols, pz = Math.floor(pi / pcols);
      const house = buildHouse(pod, .78);
      house.position.set(cx + (px-(pcols-1)/2)*spacingX, .32, cz + (pz-(prows-1)/2)*spacingZ);
      g.add(house);
    });
  });

  g.userData.pick = { type:'node', node };
  return g;
}

const castles = nodeData.map(buildCastle);
let x = -34;
castles.forEach((c, i) => {
  c.position.set(x + c.userData.plotW/2, 0, 0);
  x += c.userData.plotW + 7;
  world.add(c);
});
const totalW = x + 27;
world.position.x = -totalW / 2 + 3;

const islandW = totalW + 10;
const islandD = 31;
const island = mesh(box, MAT.grass, [islandW, 1.25, islandD], [0, -1.05, 0]);
world.add(island);
const islandEdge = mesh(box, MAT.grassEdge, [islandW-1.2, 1.8, islandD-1.2], [0, -2.1, 0]);
world.add(islandEdge);
const road = mesh(box, MAT.road, [islandW-8, .18, 3.2], [0, -.3, 12.1]);
world.add(road);
castles.forEach(c => {
  const spur = mesh(box, MAT.road, [2.7, .18, 5.2], [c.position.x, -.28, 9.6]); world.add(spur);
});

function addTree(x,z,s=1) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(.18,.28,1.1,7), colorMat(0x8a6035), [1,1,1], [0,.55,0]));
  const crown = new THREE.Mesh(new THREE.ConeGeometry(.9,1.8,8), colorMat(0x79bd58)); crown.position.y=1.8; crown.castShadow=true; g.add(crown);
  g.position.set(x,-.35,z); g.scale.setScalar(s); world.add(g);
}
for(let i=0;i<18;i++) {
  const tx = -islandW/2 + 3 + Math.random()*(islandW-6);
  const tz = (Math.random()<.5 ? -1 : 1) * (12.5 + Math.random()*1.5);
  addTree(tx,tz,.65+Math.random()*.35);
}

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const infoPanel = document.getElementById('infoPanel');
const infoRows = document.getElementById('infoRows');

function showInfo(pick) {
  const rows = [];
  if (pick.type === 'pod') {
    document.getElementById('infoKind').textContent = 'Pod';
    document.getElementById('infoTitle').textContent = pick.pod.name;
    rows.push(['Namespace', pick.pod.ns], ['Imagen', pick.pod.image], ['Contenedores', pick.pod.containers], ['Estado', 'Running']);
  } else if (pick.type === 'node') {
    document.getElementById('infoKind').textContent = 'Nodo';
    document.getElementById('infoTitle').textContent = pick.node.name;
    rows.push(['IP', pick.node.ip], ['Pods', pick.node.pods.length], ['CPU', pick.node.cpu + '%'], ['RAM', pick.node.memory + '%'], ['Estado', 'Ready']);
  } else {
    document.getElementById('infoKind').textContent = 'Namespace';
    document.getElementById('infoTitle').textContent = pick.ns;
    rows.push(['Nodo', pick.node.name], ['Pods', pick.count], ['Estado', 'Active']);
  }
  infoRows.innerHTML = rows.map(([k,v]) => `<div class="info-row"><span>${k}</span><span>${v}</span></div>`).join('');
  infoPanel.classList.add('show');
}
document.getElementById('closeInfo').onclick = () => infoPanel.classList.remove('show');

let dragging = false, moved = false, lastX = 0, lastY = 0;
let yaw = .72, pitch = .66, distance = 76;
const target = new THREE.Vector3(0, 1, 0);

renderer.domElement.addEventListener('pointerdown', e => { dragging = true; moved = false; lastX=e.clientX; lastY=e.clientY; });
addEventListener('pointerup', e => {
  if (dragging && !moved) {
    pointer.x = (e.clientX/innerWidth)*2-1; pointer.y = -(e.clientY/innerHeight)*2+1;
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(pickables, false)[0];
    if (hit?.object?.userData?.pick) showInfo(hit.object.userData.pick);
  }
  dragging = false;
});
addEventListener('pointermove', e => {
  if (!dragging) return;
  const dx=e.clientX-lastX, dy=e.clientY-lastY;
  if (Math.hypot(dx,dy)>2) moved=true;
  yaw -= dx*.005; pitch = Math.max(.38, Math.min(1.05, pitch-dy*.004));
  lastX=e.clientX; lastY=e.clientY;
});
renderer.domElement.addEventListener('wheel', e => {
  e.preventDefault();
  distance = Math.max(48, Math.min(108, distance + e.deltaY*.04));
}, { passive:false });

function updateHud() {
  const pods = nodeData.flatMap(n=>n.pods);
  const namespaces = [...new Set(pods.map(p=>p.ns))];
  const containers = pods.reduce((a,p)=>a+p.containers,0);
  document.getElementById('nodeCount').textContent = nodeData.length;
  document.getElementById('podCount').textContent = pods.length;
  document.getElementById('statPods').textContent = pods.length;
  document.getElementById('statNodes').textContent = nodeData.length;
  document.getElementById('statNamespaces').textContent = namespaces.length;
  document.getElementById('statContainers').textContent = containers;
  const legend = document.getElementById('namespaceLegend');
  legend.innerHTML = namespaces.map(ns => {
    const c = '#' + (NAMESPACES[ns] ?? 0x8aa0b8).toString(16).padStart(6,'0');
    return `<div class="namespace-item"><span class="namespace-dot" style="background:${c}"></span>${ns}</div>`;
  }).join('');
}
updateHud();

function resize() {
  const a = innerWidth / innerHeight;
  camera.left = -frustum*a; camera.right = frustum*a;
  camera.top = frustum; camera.bottom = -frustum;
  camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight);
}
addEventListener('resize', resize);

function animate() {
  requestAnimationFrame(animate);
  camera.position.set(
    target.x + distance*Math.sin(yaw)*Math.cos(pitch),
    target.y + distance*Math.sin(pitch),
    target.z + distance*Math.cos(yaw)*Math.cos(pitch)
  );
  camera.lookAt(target);
  renderer.render(scene, camera);
}
animate();
