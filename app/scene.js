const sceneEl = document.getElementById('scene');

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(38, innerWidth / innerHeight, 0.5, 2000);
const cameraState = {
  yaw: 0,
  pitch: 0.61,
  distance: 150,
  target: new THREE.Vector3(0, 0, 0),
  tweenDistance: 150,
  tweening: false,
  tweenTarget: new THREE.Vector3(0, 0, 0)
};

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
sceneEl.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xffffff, 0xdce7f2, 0.72));

const key = new THREE.DirectionalLight(0xfffdf8, 0.42);
key.position.set(40, 90, 60);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
Object.assign(key.shadow.camera, {
  left: -120,
  right: 120,
  top: 120,
  bottom: -120,
  near: 1,
  far: 320
});
key.shadow.bias = -0.0006;
key.shadow.normalBias = 0.03;
key.shadow.radius = 6;
scene.add(key);

const rim = new THREE.DirectionalLight(0xdce9ff, 0.18);
rim.position.set(-60, 40, -40);
scene.add(rim);
