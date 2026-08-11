/**
 * animations.js
 * ------------------------------------------------------------
 * GSAP-driven scroll reveals + nav behavior, plus a lightweight
 * canvas 2D "convergence" effect for the final CTA (network
 * particles collapsing into the Jakarta core). Kept as 2D canvas
 * rather than a third WebGL scene for performance.
 * ------------------------------------------------------------
 */

const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------------- Navbar ---------------- */
function initNav(){
  const nav = document.getElementById('navbar');
  const toggle = document.getElementById('nav-toggle');
  const mobile = document.getElementById('nav-mobile');

  const onScroll = () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  if (toggle && mobile){
    toggle.addEventListener('click', () => {
      const open = toggle.classList.toggle('open');
      mobile.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', String(open));
    });
    mobile.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      toggle.classList.remove('open');
      mobile.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }));
  }
}

/* ---------------- Hero flowline cycling ---------------- */
function initFlowline(){
  const nodes = document.querySelectorAll('.hero-flowline .node');
  if (!nodes.length || REDUCED_MOTION) return;
  let i = 1; // "Kings Network" starts active
  setInterval(() => {
    nodes.forEach(n => n.classList.remove('active'));
    nodes[i].classList.add('active');
    i = (i + 1) % nodes.length;
  }, 1800);
}

/* ---------------- Scroll reveals ---------------- */
function initReveals(){
  const targets = document.querySelectorAll('.reveal');
  if (!window.gsap){
    targets.forEach(t => t.style.opacity = 1);
    return;
  }
  if (window.gsap.registerPlugin && window.ScrollTrigger) window.gsap.registerPlugin(window.ScrollTrigger);

  targets.forEach((t, i) => {
    if (REDUCED_MOTION){
      t.style.opacity = 1; t.style.transform = 'none';
      return;
    }
    window.gsap.fromTo(t,
      { opacity: 0, y: 28 },
      {
        opacity: 1, y: 0, duration: 0.9, ease: 'power3.out',
        delay: (i % 3) * 0.06,
        scrollTrigger: {
          trigger: t,
          start: 'top 88%',
          once: true
        }
      }
    );
  });
}

/* ---------------- CTA convergence canvas ---------------- */
function initCtaConvergence(){
  const container = document.getElementById('cta-stage');
  if (!container) return;

  const canvas = document.createElement('canvas');
  container.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  let w, h, dpr;
  function resize(){
    dpr = Math.min(window.devicePixelRatio, 2);
    w = container.clientWidth; h = container.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  const COUNT = window.innerWidth < 760 ? 26 : 56;
  const cx = () => w/2, cyc = () => h/2;
  const particles = Array.from({ length: COUNT }, () => {
    const angle = Math.random() * Math.PI * 2;
    const dist = 140 + Math.random() * 260;
    return {
      angle, dist, speed: 0.15 + Math.random() * 0.35,
      t: Math.random(),
      size: 1 + Math.random() * 1.8,
      hue: Math.random() > 0.5 ? '36,224,255' : '46,107,255'
    };
  });

  if (REDUCED_MOTION){
    // static core glow only
    function drawStatic(){
      ctx.clearRect(0,0,w,h);
      const grad = ctx.createRadialGradient(cx(), cyc(), 0, cx(), cyc(), 220);
      grad.addColorStop(0, 'rgba(36,224,255,0.35)');
      grad.addColorStop(1, 'rgba(36,224,255,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0,0,w,h);
    }
    drawStatic();
    return;
  }

  function frame(){
    requestAnimationFrame(frame);
    ctx.clearRect(0,0,w,h);

    // core glow
    const coreR = 60 + Math.sin(Date.now()*0.002)*8;
    const grad = ctx.createRadialGradient(cx(), cyc(), 0, cx(), cyc(), coreR*3.2);
    grad.addColorStop(0, 'rgba(36,224,255,0.4)');
    grad.addColorStop(0.4, 'rgba(46,107,255,0.12)');
    grad.addColorStop(1, 'rgba(46,107,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0,0,w,h);

    particles.forEach(p => {
      p.t += 0.0028 * p.speed * 16;
      if (p.t > 1) p.t = 0;
      const ease = p.t * p.t; // accelerate inward
      const d = p.dist * (1 - ease);
      const x = cx() + Math.cos(p.angle) * d;
      const y = cyc() + Math.sin(p.angle) * d * 0.6;
      const alpha = 0.15 + (1-p.t) * 0.55;
      ctx.beginPath();
      ctx.fillStyle = `rgba(${p.hue},${alpha})`;
      ctx.arc(x, y, p.size, 0, Math.PI*2);
      ctx.fill();
    });
  }
  frame();
}

/* ---------------- Footer year ---------------- */
function initFooterYear(){
  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
}

/* ---------------- Contact form ---------------- */
function initContactForm(){
  const form = document.getElementById('contact-form');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const original = btn.innerHTML;
    btn.innerHTML = 'Message sent ✓';
    btn.style.opacity = '0.85';
    form.reset();
    setTimeout(() => { btn.innerHTML = original; btn.style.opacity = ''; }, 2600);
  });
}

function init(){
  document.body.classList.add('js-ready');
  initNav();
  initFlowline();
  initReveals();
  initCtaConvergence();
  initFooterYear();
  initContactForm();
}

if (document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
