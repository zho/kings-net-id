/**
 * main.js
 * ------------------------------------------------------------
 * Global bootstrap: feature detection flags and small decorative
 * touches that don't warrant their own module. Three.js scenes are
 * initialized by hero-network.js / java-map.js; GSAP interactions
 * by animations.js. This file just wires shared capability flags.
 * ------------------------------------------------------------
 */

function detectWebGL(){
  try{
    const canvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
  }catch(e){
    return false;
  }
}

function applyCapabilityFlags(){
  const html = document.documentElement;
  html.classList.toggle('no-webgl', !detectWebGL());
  html.classList.toggle('reduced-motion', window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  html.classList.toggle('is-touch', 'ontouchstart' in window);
}

/** Small network-node icon dropped into each service card corner for visual rhythm. */
function decorateServiceCards(){
  const cards = document.querySelectorAll('.service-card');
  cards.forEach((card) => {
    const wrap = document.createElement('div');
    wrap.className = 'card-viz';
    wrap.innerHTML = `
      <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <circle class="spark" cx="90" cy="30" r="2.5" fill="#24e0ff"/>
        <circle class="spark" cx="60" cy="60" r="1.8" fill="#2e6bff" opacity="0.7"/>
        <circle class="spark" cx="100" cy="70" r="1.5" fill="#24e0ff" opacity="0.5"/>
        <path d="M90 30 L60 60 L100 70" stroke="#2e6bff" stroke-width="0.75" opacity="0.4"/>
      </svg>`;
    card.appendChild(wrap);
  });
}

function init(){
  applyCapabilityFlags();
  decorateServiceCards();
}

if (document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
