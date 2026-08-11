/**
 * java-map.js
 * ------------------------------------------------------------
 * Initializes the interactive coverage-section 3D map. Reuses
 * createIslandScene() from hero-network.js with click-to-inspect
 * region details and a live stats panel driven by coverage-data.js.
 * ------------------------------------------------------------
 */
import { createIslandScene } from './hero-network.js';
import DATA from './coverage-data.js';

function fillStats(){
  const nodesEl = document.getElementById('stat-nodes');
  const fiberEl = document.getElementById('stat-fiber');
  const count = Object.keys(DATA.regions).length;
  if (nodesEl) nodesEl.textContent = DATA.stats.networkNodes === '—' ? String(count) : DATA.stats.networkNodes;
  if (fiberEl) fiberEl.textContent = `${DATA.stats.fiberRoutesKm} km`;
}

function showRegion(key){
  const panel = document.getElementById('region-detail');
  const nameEl = document.getElementById('region-name');
  const statusEl = document.getElementById('region-status');
  const listEl = document.getElementById('region-services');
  if (!panel || !key) return;

  const region = DATA.regions[key];
  nameEl.textContent = `${region.label}`;
  statusEl.textContent = `${region.sublabel} · ${DATA.statusLabels[region.status] || region.status}`;
  listEl.innerHTML = '';
  region.services.forEach(s => {
    const li = document.createElement('li');
    li.textContent = s;
    listEl.appendChild(li);
  });
  panel.classList.add('show');
}

function hideRegion(){
  const panel = document.getElementById('region-detail');
  if (panel) panel.classList.remove('show');
}

function initCoverageMap(){
  const container = document.getElementById('coverage-stage');
  if (!container) return;

  fillStats();

  const instance = createIslandScene(container, {
    interactive: true,
    autoRotate: true,
    allowZoom: true,
    allowPan: false,
    onHover(key){
      container.style.cursor = key ? 'pointer' : 'grab';
    },
    onClick(key){
      showRegion(key);
      instance && instance.focusOn(key);
    }
  });

  const closeBtn = document.getElementById('region-close');
  if (closeBtn) closeBtn.addEventListener('click', hideRegion);

  window.__kingsCoverage = instance;
}

if (document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', initCoverageMap);
} else {
  initCoverageMap();
}
