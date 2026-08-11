/**
 * hero-network.js
 * ------------------------------------------------------------
 * Reusable Three.js "island network" scene: extruded Java Island
 * silhouette, glowing hub + regional nodes, animated fiber routes,
 * and traveling data particles. Exported as createIslandScene()
 * so both the hero stage and the coverage map (java-map.js) can
 * build their own instance with different interaction settings.
 * ------------------------------------------------------------
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import DATA from './coverage-data.js';

const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const IS_MOBILE = window.innerWidth < 760;

const COLOR = {
  blue: 0x2e6bff,
  cyan: 0x24e0ff,
  violet: 0x8b6bff,
  navy: 0x0a1830,
  navyDeep: 0x061020
};

function statusColor(status){
  if (status === 'connected') return COLOR.cyan;
  if (status === 'planned') return COLOR.blue;
  return 0x5f7196; // coming-soon / dim
}

/** Build a flat circular "glow" sprite texture used for node halos + particles. */
function makeGlowTexture(){
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.35, 'rgba(255,255,255,0.55)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  return tex;
}

/**
 * Creates a full island-network scene inside `container`.
 * options: { interactive:boolean, autoRotate:boolean, allowZoom:boolean,
 *            onHover:fn(regionKey|null), onClick:fn(regionKey) }
 */
export function createIslandScene(container, options = {}){
  const opts = Object.assign({
    interactive: true,
    autoRotate: true,
    allowZoom: true,
    allowPan: false,
    onHover: null,
    onClick: null
  }, options);

  let renderer;
  try{
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  }catch(e){
    return null; // caller shows fallback
  }
  if (!renderer) return null;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(0, 6.2, 8.2);

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, IS_MOBILE ? 1.5 : 2));
  container.appendChild(renderer.domElement);

  // ---- lighting ----
  scene.add(new THREE.AmbientLight(0x24406e, 1.1));
  const key = new THREE.DirectionalLight(0x9db8ff, 0.9);
  key.position.set(4, 8, 6);
  scene.add(key);
  const hubLight = new THREE.PointLight(COLOR.cyan, 6, 8, 2);
  scene.add(hubLight);

  // ---- island group (centered) ----
  const island = DATA.island;
  const bounds = island.outline.reduce((b,[x,y])=>({
    minX: Math.min(b.minX,x), maxX: Math.max(b.maxX,x),
    minY: Math.min(b.minY,y), maxY: Math.max(b.maxY,y)
  }), {minX:Infinity,maxX:-Infinity,minY:Infinity,maxY:-Infinity});
  const cx = (bounds.minX + bounds.maxX)/2;
  const cy = (bounds.minY + bounds.maxY)/2;
  const scale = 5.6 / (bounds.maxX - bounds.minX);

  const toWorld = ([x,y]) => new THREE.Vector3((x-cx)*scale, 0, (y-cy)*scale);

  const shape = new THREE.Shape();
  island.outline.forEach(([x,y], i) => {
    const p = toWorld([x,y]);
    if (i===0) shape.moveTo(p.x, p.z); else shape.lineTo(p.x, p.z);
  });
  const extrudeGeo = new THREE.ExtrudeGeometry(shape, { depth: 0.22, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.04, bevelSegments: 2 });
  extrudeGeo.rotateX(Math.PI/2);
  const islandMat = new THREE.MeshStandardMaterial({ color: COLOR.navy, roughness: 0.55, metalness: 0.3, emissive: 0x040d1c, emissiveIntensity: 0.6 });
  const islandMesh = new THREE.Mesh(extrudeGeo, islandMat);
  islandMesh.position.y = -0.22;
  scene.add(islandMesh);

  // grid-line overlay for a technical terrain feel
  const edges = new THREE.EdgesGeometry(extrudeGeo, 1);
  const edgeLines = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: COLOR.blue, transparent: true, opacity: 0.35 }));
  edgeLines.position.y = -0.22;
  scene.add(edgeLines);

  // soft ground glow disc under the island
  const discGeo = new THREE.CircleGeometry(4.6, 48);
  discGeo.rotateX(-Math.PI/2);
  const discMat = new THREE.MeshBasicMaterial({ color: COLOR.blue, transparent: true, opacity: 0.05 });
  const disc = new THREE.Mesh(discGeo, discMat);
  disc.position.y = -0.5;
  scene.add(disc);

  // ---- nodes ----
  const glowTex = makeGlowTexture();
  const nodeMeshes = {}; // key -> { mesh, halo, data }
  const nodeGroup = new THREE.Group();
  scene.add(nodeGroup);

  Object.entries(DATA.regions).forEach(([key, region]) => {
    const pos = toWorld(region.position);
    const isHub = region.type === 'core';
    const color = isHub ? COLOR.cyan : statusColor(region.status);

    const geo = new THREE.SphereGeometry(isHub ? 0.11 : 0.065, 16, 16);
    const mat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: isHub ? 1.4 : 0.8, roughness: 0.3 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(pos.x, isHub ? 0.32 : 0.18, pos.z);
    mesh.userData.key = key;
    nodeGroup.add(mesh);

    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color, transparent: true, opacity: isHub ? 0.9 : 0.55, depthWrite: false, blending: THREE.AdditiveBlending }));
    halo.scale.setScalar(isHub ? 1.15 : 0.6);
    halo.position.copy(mesh.position);
    nodeGroup.add(halo);

    if (isHub){
      hubLight.position.set(pos.x, 1.2, pos.z);
    }

    nodeMeshes[key] = { mesh, halo, region, isHub, basePos: mesh.position.clone() };
  });

  // ---- routes (curved lines) + traveling particles ----
  const routeCurves = [];
  DATA.routes.forEach(([a,b]) => {
    const pa = nodeMeshes[a].basePos, pb = nodeMeshes[b].basePos;
    const mid = pa.clone().lerp(pb, 0.5);
    mid.y += 0.55 + pa.distanceTo(pb) * 0.12;
    const curve = new THREE.QuadraticBezierCurve3(pa, mid, pb);
    const points = curve.getPoints(32);
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({ color: COLOR.blue, transparent: true, opacity: 0.45 });
    scene.add(new THREE.Line(geo, mat));
    routeCurves.push(curve);
  });

  const PARTICLES_PER_ROUTE = IS_MOBILE ? 1 : (REDUCED_MOTION ? 0 : 2);
  const particleCount = routeCurves.length * PARTICLES_PER_ROUTE;
  let particles = null, particleData = [];
  if (particleCount > 0){
    const pGeo = new THREE.SphereGeometry(0.035, 8, 8);
    const pMat = new THREE.MeshBasicMaterial({ color: COLOR.cyan, transparent: true, opacity: 0.9 });
    particles = new THREE.InstancedMesh(pGeo, pMat, particleCount);
    let idx = 0;
    routeCurves.forEach((curve) => {
      for (let i=0; i<PARTICLES_PER_ROUTE; i++){
        particleData.push({ curve, t: i / PARTICLES_PER_ROUTE, speed: 0.12 + Math.random()*0.06, idx });
        idx++;
      }
    });
    scene.add(particles);
  }

  // ---- controls ----
  const orbit = new OrbitControls(camera, renderer.domElement);
  orbit.enableDamping = true;
  orbit.dampingFactor = 0.08;
  orbit.enablePan = opts.allowPan;
  orbit.enableZoom = opts.allowZoom;
  orbit.minDistance = 5;
  orbit.maxDistance = 13;
  orbit.maxPolarAngle = Math.PI/2.1;
  orbit.minPolarAngle = Math.PI/6;
  orbit.autoRotate = opts.autoRotate && !REDUCED_MOTION;
  orbit.autoRotateSpeed = 0.5;
  orbit.target.set(0,0,0);

  let userInteracting = false;
  orbit.addEventListener('start', () => { userInteracting = true; });
  orbit.addEventListener('end', () => { setTimeout(()=>{ userInteracting = false; }, 2200); });

  // ---- raycasting (hover + click) ----
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  let hovered = null;

  function pickAtEvent(clientX, clientY){
    const rect = container.getBoundingClientRect();
    mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const meshes = Object.values(nodeMeshes).map(n => n.mesh);
    const hits = raycaster.intersectObjects(meshes);
    return hits.length ? hits[0].object.userData.key : null;
  }

  if (opts.interactive){
    renderer.domElement.addEventListener('pointermove', (e) => {
      const key = pickAtEvent(e.clientX, e.clientY);
      if (key !== hovered){
        hovered = key;
        renderer.domElement.style.cursor = key ? 'pointer' : 'grab';
        if (opts.onHover) opts.onHover(key, e);
      } else if (key && opts.onHover) {
        opts.onHover(key, e);
      }
    });
    renderer.domElement.addEventListener('pointerleave', () => {
      hovered = null;
      if (opts.onHover) opts.onHover(null);
    });
    renderer.domElement.addEventListener('click', (e) => {
      const key = pickAtEvent(e.clientX, e.clientY);
      if (key && opts.onClick) opts.onClick(key);
    });
  }

  // ---- resize ----
  function resize(){
    const w = container.clientWidth, h = container.clientHeight;
    if (!w || !h) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }
  const ro = new ResizeObserver(resize);
  ro.observe(container);
  resize();

  // ---- animation loop ----
  const clock = new THREE.Clock();
  let raf = null;
  let running = true;

  function tick(){
    if (!running) return;
    raf = requestAnimationFrame(tick);
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;

    // pulsing halos
    Object.values(nodeMeshes).forEach(({halo, isHub}, i) => {
      const base = isHub ? 1.15 : 0.6;
      const pulse = base * (1 + Math.sin(t*1.6 + i) * (isHub ? 0.14 : 0.1));
      halo.scale.setScalar(pulse);
    });

    // particles traveling along curves
    if (particles && !REDUCED_MOTION){
      const dummy = new THREE.Object3D();
      particleData.forEach((p) => {
        p.t = (p.t + dt * p.speed) % 1;
        const pos = p.curve.getPointAt(p.t);
        dummy.position.copy(pos);
        dummy.scale.setScalar(1);
        dummy.updateMatrix();
        particles.setMatrixAt(p.idx, dummy.matrix);
      });
      particles.instanceMatrix.needsUpdate = true;
    }

    if (!REDUCED_MOTION) orbit.autoRotate = opts.autoRotate && !userInteracting;
    orbit.update();
    renderer.render(scene, camera);
  }
  tick();

  document.addEventListener('visibilitychange', () => {
    running = document.visibilityState === 'visible';
    if (running) tick();
  });

  return {
    scene, camera, renderer, orbit, nodeMeshes,
    dispose(){
      running = false;
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.dispose();
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
    },
    focusOn(key){
      const n = nodeMeshes[key];
      if (!n) return;
      const targetPos = n.mesh.position;
      const dist = 4.5;
      const dir = camera.position.clone().sub(orbit.target).normalize();
      const newCamPos = targetPos.clone().add(dir.multiplyScalar(dist));
      if (window.gsap){
        window.gsap.to(camera.position, { x:newCamPos.x, y: Math.max(newCamPos.y, 2.6), z:newCamPos.z, duration: 1.1, ease:'power3.inOut' });
        window.gsap.to(orbit.target, { x:targetPos.x, y:0, z:targetPos.z, duration: 1.1, ease:'power3.inOut' });
      } else {
        camera.position.copy(newCamPos);
        orbit.target.copy(targetPos);
      }
    }
  };
}

/* -------------------- Hero stage bootstrap -------------------- */
function initHero(){
  const container = document.getElementById('hero-stage');
  if (!container) return;
  const tooltip = document.getElementById('hero-tooltip');
  const tooltipName = document.getElementById('hero-tooltip-name');
  const fallback = document.getElementById('hero-fallback');

  const instance = createIslandScene(container, {
    interactive: true,
    autoRotate: true,
    allowZoom: true,
    allowPan: false,
    onHover(key, evt){
      if (!key){ tooltip.classList.remove('show'); return; }
      const region = DATA.regions[key];
      tooltipName.textContent = `${region.label} — ${region.sublabel}`;
      if (evt){
        const rect = container.getBoundingClientRect();
        tooltip.style.left = (evt.clientX - rect.left) + 'px';
        tooltip.style.top = (evt.clientY - rect.top) + 'px';
      }
      tooltip.classList.add('show');
    }
  });

  if (!instance){
    fallback.hidden = false;
    return;
  }
  window.__kingsHero = instance;
}

if (document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', initHero);
} else {
  initHero();
}
