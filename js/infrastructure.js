/**
 * infrastructure.js
 * ------------------------------------------------------------
 * Lightweight SVG architecture diagrams (network infrastructure
 * stack + business solutions tree) with animated data packets.
 * Kept as SVG/CSS rather than a second/third WebGL scene to stay
 * performant — the 3D budget is spent on the hero + coverage map.
 * ------------------------------------------------------------
 */

const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const NS = 'http://www.w3.org/2000/svg';

function el(tag, attrs = {}){
  const node = document.createElementNS(NS, tag);
  Object.entries(attrs).forEach(([k,v]) => node.setAttribute(k, v));
  return node;
}

function packet(svg, pathId, dur, delay, color){
  const c = el('circle', { r: 3.2, fill: color || 'var(--cyan)' });
  svg.appendChild(c);
  if (REDUCED_MOTION) { c.setAttribute('opacity', '0'); return; }
  const anim = el('animateMotion', {
    dur: `${dur}s`, begin: `${delay}s`, repeatCount: 'indefinite',
    rotate: 'auto', keyPoints: '0;1', keyTimes: '0;1', calcMode: 'linear'
  });
  const mpath = el('mpath');
  mpath.setAttributeNS('http://www.w3.org/1999/xlink', 'href', `#${pathId}`);
  anim.appendChild(mpath);
  c.appendChild(anim);

  const fade = el('animate', { attributeName: 'opacity', values:'0;1;1;0', keyTimes:'0;0.08;0.85;1', dur:`${dur}s`, begin:`${delay}s`, repeatCount:'indefinite' });
  c.appendChild(fade);
}

/* ---------------- Network Infrastructure stack ---------------- */
function buildInfraDiagram(container){
  const W = 420, H = 480;
  const svg = el('svg', { viewBox: `0 0 ${W} ${H}` });

  const layers = [
    { label: 'INTERNET' },
    { label: 'GLOBAL NETWORK' },
    { label: 'JAKARTA CORE', hub: true },
    { label: 'JAVA BACKBONE' },
    { label: 'REGIONAL NODES' },
    { label: 'FIBER NETWORK' },
    { label: 'CUSTOMER NETWORK' }
  ];
  const cx = W/2;
  const top = 26, gap = (H-52)/(layers.length-1);

  // spine path
  const spinePath = el('path', {
    d: `M ${cx} ${top} L ${cx} ${top + gap*(layers.length-1)}`,
    id: 'infra-spine', fill:'none', stroke:'url(#infraGrad)', 'stroke-width': 1.5
  });

  const defs = el('defs');
  const grad = el('linearGradient', { id:'infraGrad', x1:'0', y1:'0', x2:'0', y2:'1' });
  grad.appendChild(el('stop', { offset:'0%', 'stop-color':'#24e0ff' }));
  grad.appendChild(el('stop', { offset:'100%', 'stop-color':'#2e6bff' }));
  defs.appendChild(grad);
  svg.appendChild(defs);
  svg.appendChild(spinePath);

  layers.forEach((layer, i) => {
    const y = top + gap*i;
    const isHub = layer.hub;
    const r = isHub ? 8.5 : 5.5;

    if (isHub){
      const halo = el('circle', { cx, cy:y, r: 20, fill:'#24e0ff', opacity:0.12 });
      svg.appendChild(halo);
    }
    const node = el('circle', { cx, cy:y, r, fill: isHub ? '#24e0ff' : '#0a1830', stroke: isHub ? '#24e0ff' : '#2e6bff', 'stroke-width': isHub ? 0 : 1.5 });
    svg.appendChild(node);

    const label = el('text', {
      x: cx + 22, y: y+4, class: isHub ? 'infra-node-label hub' : 'infra-node-label'
    });
    label.textContent = layer.label;
    svg.appendChild(label);
  });

  // packets traveling the spine
  [0, 1.6, 3.2].forEach((delay, i) => packet(svg, 'infra-spine', 4.2, delay, i%2 ? '#2e6bff' : '#24e0ff'));

  container.innerHTML = '';
  container.appendChild(svg);
}

/* ---------------- Business Solutions tree ---------------- */
function buildBizDiagram(container){
  const W = 480, H = 420;
  const svg = el('svg', { viewBox: `0 0 ${W} ${H}` });

  const internet = { x: W/2, y: 30, label: 'INTERNET' };
  const core =     { x: W/2, y: 110, label: 'JAKARTA CORE', hub:true };
  const branches = [
    { x: W*0.22, y: 200, label: 'HEAD OFFICE' },
    { x: W*0.5,  y: 200, label: 'CLOUD' },
    { x: W*0.78, y: 200, label: 'DATA CENTER' }
  ];
  const branchOffice = { x: W*0.22, y: 300, label: 'BRANCH OFFICE' };
  const remoteUsers =  { x: W*0.22, y: 385, label: 'REMOTE USERS' };

  const defs = el('defs');
  const grad = el('linearGradient', { id:'bizGrad', x1:'0', y1:'0', x2:'0', y2:'1' });
  grad.appendChild(el('stop', { offset:'0%', 'stop-color':'#8b6bff' }));
  grad.appendChild(el('stop', { offset:'100%', 'stop-color':'#24e0ff' }));
  defs.appendChild(grad);
  svg.appendChild(defs);

  function line(id, a, b){
    const d = `M ${a.x} ${a.y} L ${b.x} ${b.y}`;
    const p = el('path', { id, d, fill:'none', stroke:'url(#bizGrad)', 'stroke-width':1.4, opacity:0.7 });
    svg.appendChild(p);
    return id;
  }

  const paths = [];
  paths.push(line('biz-l1', internet, core));
  branches.forEach((b,i) => paths.push(line(`biz-l2-${i}`, core, b)));
  paths.push(line('biz-l3', branches[0], branchOffice));
  paths.push(line('biz-l4', branchOffice, remoteUsers));

  function node(pt, primary){
    const r = primary ? 8 : 5.5;
    if (primary){
      svg.appendChild(el('circle', { cx:pt.x, cy:pt.y, r:18, fill:'#24e0ff', opacity:0.12 }));
    }
    svg.appendChild(el('circle', { cx:pt.x, cy:pt.y, r, fill: primary ? '#24e0ff' : '#0a1830', stroke: primary ? 'none' : '#8b6bff', 'stroke-width':1.4 }));
    const t = el('text', { x: pt.x, y: pt.y + r + 16, 'text-anchor':'middle', class: primary ? 'infra-node-label hub' : 'infra-node-label' });
    t.textContent = pt.label;
    svg.appendChild(t);
  }

  node(internet, false);
  node(core, true);
  branches.forEach(b => node(b, false));
  node(branchOffice, false);
  node(remoteUsers, false);

  paths.forEach((id, i) => packet(svg, id, 2.6, i*0.5, i%2 ? '#8b6bff' : '#24e0ff'));

  container.innerHTML = '';
  container.appendChild(svg);
}

function init(){
  const infra = document.getElementById('infra-diagram');
  const biz = document.getElementById('biz-diagram');
  if (infra) buildInfraDiagram(infra);
  if (biz) buildBizDiagram(biz);
}

if (document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
