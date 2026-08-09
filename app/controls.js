/* ---------------- INTERACCIÓN ---------------- */
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let dragging = false, moved = false, lastX = 0, lastY = 0;

function isEffectivelyVisible(object) {
  for (let current = object; current; current = current.parent) {
    if (!current.visible) return false;
  }
  return true;
}

renderer.domElement.addEventListener('pointerdown', e => {
  dragging = true; moved = false; lastX = e.clientX; lastY = e.clientY; cameraState.tweening = false;
});
addEventListener('pointerup', () => dragging = false);
addEventListener('pointermove', e => {
  if (!dragging) return;
  if (Math.hypot(e.clientX - lastX, e.clientY - lastY) > 4) moved = true;
  cameraState.yaw -= (e.clientX - lastX) * 0.005;
  cameraState.pitch = Math.max(0.12, Math.min(1.15, cameraState.pitch - (e.clientY - lastY) * 0.004));
  lastX = e.clientX; lastY = e.clientY;
});

renderer.domElement.addEventListener('click', e => {
  if (moved) return;
  mouse.x = (e.clientX / innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(worldGroup.children, true);
  for (const h of hits) {
    if (isEffectivelyVisible(h.object) && h.object.userData?.pick) {
      showInfo(h.object.userData.pick);
      return;
    }
  }
  hideInfo();
});

renderer.domElement.addEventListener('wheel', e => {
  e.preventDefault();
  cameraState.tweening = false;
  const old = cameraState.distance;
  cameraState.distance = Math.max(35, Math.min(420, cameraState.distance + e.deltaY * 0.12));
  mouse.x = (e.clientX / innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const hit = new THREE.Vector3();
  if (raycaster.ray.intersectPlane(plane, hit)) {
    const t = 1 - cameraState.distance / old;
    cameraState.target.lerp(hit, t * 0.85);
    cameraState.target.y = 0;
  }
}, { passive: false });

renderer.domElement.addEventListener('dblclick', e => {
  mouse.x = (e.clientX / innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(worldGroup.children, true);
  for (const h of hits) {
    if (isEffectivelyVisible(h.object) && h.object.userData?.pick) {
      const p = h.object.userData.pick;
      const c = new THREE.Vector3();
      if (p.type === 'node') {
        const ng = nodeGroups.find(g => g.userData.node === p.node);
        if (ng) new THREE.Box3().setFromObject(ng).getCenter(c);
        cameraState.tweenDistance = 90;
      } else {
        c.copy(h.point); cameraState.tweenDistance = p.type === 'pod' ? 42 : 62;
      }
      c.y = 0;
      cameraState.tweenTarget.copy(c); cameraState.tweening = true;
      return;
    }
  }
});

// desplazamiento con WASD / flechas
const keys = {};
const PAN = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D'];
function isEditableTarget(target) {
  return target instanceof Element && Boolean(target.closest('input, textarea, select, [contenteditable="true"]'));
}

addEventListener('keydown', e => {
  if (isEditableTarget(e.target)) return;
  if (PAN.includes(e.key)) {
    keys[e.key.toLowerCase()] = true;
    cameraState.tweening = false;
    e.preventDefault();
  }
});
addEventListener('keyup', e => { if (PAN.includes(e.key)) keys[e.key.toLowerCase()] = false; });
const panVel = new THREE.Vector3();
function updatePan() {
  const up = keys['arrowup'] || keys['w'], down = keys['arrowdown'] || keys['s'];
  const left = keys['arrowleft'] || keys['a'], right = keys['arrowright'] || keys['d'];
  const fwd = new THREE.Vector3(-Math.sin(cameraState.yaw), 0, -Math.cos(cameraState.yaw));
  const rt = new THREE.Vector3(Math.cos(cameraState.yaw), 0, -Math.sin(cameraState.yaw));
  const dir = new THREE.Vector3();
  if (up) dir.add(fwd); if (down) dir.sub(fwd);
  if (right) dir.add(rt); if (left) dir.sub(rt);
  const max = cameraState.distance * 0.006;
  const target = dir.lengthSq() > 0 ? dir.normalize().multiplyScalar(max) : new THREE.Vector3();
  panVel.lerp(target, dir.lengthSq() > 0 ? 0.12 : 0.08);
  if (panVel.lengthSq() > 1e-7) cameraState.target.add(panVel);
}

/* ---------------- LOOP ---------------- */
function animate() {
  requestAnimationFrame(animate);
  updatePan();
  if (cameraState.tweening) {
    cameraState.target.lerp(cameraState.tweenTarget, 0.05);
    cameraState.distance += (cameraState.tweenDistance - cameraState.distance) * 0.05;
    if (cameraState.target.distanceTo(cameraState.tweenTarget) < 0.1 && Math.abs(cameraState.distance - cameraState.tweenDistance) < 0.2) cameraState.tweening = false;
  }
  camera.position.set(
    cameraState.target.x + cameraState.distance * Math.sin(cameraState.yaw) * Math.cos(cameraState.pitch),
    cameraState.target.y + cameraState.distance * Math.sin(cameraState.pitch),
    cameraState.target.z + cameraState.distance * Math.cos(cameraState.yaw) * Math.cos(cameraState.pitch)
  );
  camera.lookAt(cameraState.target);
  renderer.render(scene, camera);
}

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
