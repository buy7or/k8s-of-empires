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
      d.innerHTML = `<span class="namespace-dot" style="background:${hex}"></span><span class="namespace-name">${ns}</span>`;

      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'namespace-toggle';

      const syncToggle = () => {
        const visible = isNamespaceVisible(ns);
        toggle.innerHTML = visible
          ? `<svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"/>
              <circle cx="12" cy="12" r="2.7"/>
            </svg>`
          : `<svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3 3l18 18"/>
              <path d="M10.6 6.1A10 10 0 0 1 12 6c6 0 9.5 6 9.5 6a15 15 0 0 1-2.1 2.8M6.2 6.2C3.8 8 2.5 12 2.5 12s3.5 6 9.5 6a9.8 9.8 0 0 0 3-.5M9.9 9.9a3 3 0 0 0 4.2 4.2"/>
            </svg>`;
        toggle.title = `${visible ? 'Ocultar' : 'Mostrar'} namespace ${ns}`;
        toggle.setAttribute('aria-label', toggle.title);
        toggle.setAttribute('aria-pressed', String(!visible));
        d.classList.toggle('is-hidden', !visible);
      };

      toggle.addEventListener('click', () => {
        setNamespaceVisibility(ns, !isNamespaceVisible(ns));
        syncToggle();
      });

      syncToggle();
      d.appendChild(toggle);
      legend.appendChild(d);
    });
  }
}

const infoPanel = document.getElementById('infoPanel');
const infoKind = document.getElementById('infoKind');
const infoTitle = document.getElementById('infoTitle');
const infoRows = document.getElementById('infoRows');
document.getElementById('closeInfo')?.addEventListener('click', () => infoPanel.classList.remove('show'));

function hideInfo() {
  infoPanel?.classList.remove('show');
}

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
    row('IP', n.ip);
    row('Pods', n.pods.length);
    row('Namespaces', new Set(n.pods.map(p => p.ns)).size);
    row('Contenedores', n.pods.reduce((a, p) => a + p.containers, 0));
    row('Estado', 'Ready');
  }
  infoPanel.classList.add('show');
}
