const COLORS = {
  platformTop: 0x86bd59,
  platformSide: 0x6fa34c,
  platformEdge: 0x5d8d40,
  floor: 0x4b5566,
  floorDark: 0x424b5a,
  wall: 0xdfe4e8,
  wallShade: 0xcbd2d9,
  wallTop: 0xe9edf0,
  towerRoof: 0x5b8ac8,
  towerRoofDark: 0x4a76b4,
  wood: 0x8b5e3c,
  woodDark: 0x6f4a2f,
  steps: 0xeef1f4,
  path: 0xf0d9a8,
  houseWall: 0xf5f5f2,
  houseWallAlt: 0xeceae4,
  pending: 0xf2b84b,
  pendingDark: 0xb7791f,
  error: 0xdc4c4c,
  errorDark: 0x713838,
  smoke: 0x596273,
  trunk: 0x6d4c33,
  leaf1: 0x5fb84a,
  leaf2: 0x4da33c,
  rock: 0xc8cdd4,
  flag: 0x6fa2dc
};

const NAMESPACES = {
  default: 0x3b82f6,
  'kube-system': 0x8b5cf6,
  frontend: 0x14b8a6,
  backend: 0xf97316,
  database: 0xeab308,
  monitoring: 0xec4899
};

const NAMESPACE_PALETTE = [
  0x3b82f6, 0x8b5cf6, 0x14b8a6, 0xf97316, 0xeab308, 0xec4899,
  0x06b6d4, 0x84cc16, 0xef4444, 0x6366f1, 0xd946ef, 0x10b981
];

function namespaceColor(namespace) {
  if (NAMESPACES[namespace] !== undefined) return NAMESPACES[namespace];
  let hash = 0;
  for (let index = 0; index < namespace.length; index++) {
    hash = ((hash << 5) - hash + namespace.charCodeAt(index)) | 0;
  }
  return NAMESPACE_PALETTE[Math.abs(hash) % NAMESPACE_PALETTE.length];
}
