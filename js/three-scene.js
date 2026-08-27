(function () {
  'use strict';

  var heroEl = document.querySelector('.hero');
  var canvas = document.getElementById('heroCanvas');
  if (!heroEl || !canvas) return;

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function supportsWebGL() {
    try {
      var testCanvas = document.createElement('canvas');
      return !!(window.WebGLRenderingContext &&
        (testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl')));
    } catch (e) {
      return false;
    }
  }

  if (typeof THREE === 'undefined' || !supportsWebGL()) {
    heroEl.classList.add('no-webgl');
    return;
  }

  var width = heroEl.clientWidth;
  var height = heroEl.clientHeight;

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
  camera.position.set(0, 0, 60);

  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
  } catch (e) {
    heroEl.classList.add('no-webgl');
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(width, height);

  var group = new THREE.Group();
  scene.add(group);

  /* ---------------------------------------------------------
     Palette (matches CSS tokens)
  --------------------------------------------------------- */
  var COLOR_PRIMARY = new THREE.Color(0x0b63f6);
  var COLOR_CYAN = new THREE.Color(0x06b6d4);
  var COLOR_VIOLET = new THREE.Color(0x7c6ef0);

  /* ---------------------------------------------------------
     Network nodes (stylised Jakarta / Bekasi / Java layout)
  --------------------------------------------------------- */
  var NODE_COUNT = 22;
  var nodes = [];
  var nodeGeometry = new THREE.SphereGeometry(0.5, 12, 12);

  for (var i = 0; i < NODE_COUNT; i++) {
    var color = i % 3 === 0 ? COLOR_CYAN : (i % 3 === 1 ? COLOR_PRIMARY : COLOR_VIOLET);
    var material = new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.85 });
    var mesh = new THREE.Mesh(nodeGeometry, material);

    var spread = 42;
    mesh.position.set(
      (Math.random() - 0.5) * spread * 1.8,
      (Math.random() - 0.5) * spread,
      (Math.random() - 0.5) * 18
    );
    mesh.userData.baseY = mesh.position.y;
    mesh.userData.floatSpeed = 0.4 + Math.random() * 0.6;
    mesh.userData.floatOffset = Math.random() * Math.PI * 2;
    group.add(mesh);
    nodes.push(mesh);
  }

  /* ---------------------------------------------------------
     Connecting fiber lines between nearby nodes
  --------------------------------------------------------- */
  var lineMaterial = new THREE.LineBasicMaterial({ color: COLOR_PRIMARY, transparent: true, opacity: 0.18 });
  var maxDist = 22;
  var linePositions = [];

  for (var a = 0; a < nodes.length; a++) {
    for (var b = a + 1; b < nodes.length; b++) {
      var d = nodes[a].position.distanceTo(nodes[b].position);
      if (d < maxDist) {
        linePositions.push(nodes[a].position.x, nodes[a].position.y, nodes[a].position.z);
        linePositions.push(nodes[b].position.x, nodes[b].position.y, nodes[b].position.z);
      }
    }
  }
  var lineGeometry = new THREE.BufferGeometry();
  lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
  var lineSegments = new THREE.LineSegments(lineGeometry, lineMaterial);
  group.add(lineSegments);

  /* ---------------------------------------------------------
     Flowing data particles
  --------------------------------------------------------- */
  var PARTICLE_COUNT = 140;
  var particlePositions = new Float32Array(PARTICLE_COUNT * 3);
  for (var p = 0; p < PARTICLE_COUNT; p++) {
    particlePositions[p * 3] = (Math.random() - 0.5) * 90;
    particlePositions[p * 3 + 1] = (Math.random() - 0.5) * 50;
    particlePositions[p * 3 + 2] = (Math.random() - 0.5) * 25;
  }
  var particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute('position', new THREE.Float32BufferAttribute(particlePositions, 3));
  var particleMaterial = new THREE.PointsMaterial({
    color: COLOR_CYAN,
    size: 0.6,
    transparent: true,
    opacity: 0.55,
    sizeAttenuation: true
  });
  var particles = new THREE.Points(particleGeometry, particleMaterial);
  group.add(particles);

  /* ---------------------------------------------------------
     Interaction — subtle mouse / scroll parallax
  --------------------------------------------------------- */
  var mouseX = 0, mouseY = 0;
  var targetRotX = 0, targetRotY = 0;

  if (!prefersReducedMotion) {
    window.addEventListener('mousemove', function (e) {
      mouseX = (e.clientX / window.innerWidth) - 0.5;
      mouseY = (e.clientY / window.innerHeight) - 0.5;
      targetRotY = mouseX * 0.25;
      targetRotX = mouseY * -0.15;
    }, { passive: true });
  }

  var scrollFactor = 0;
  window.addEventListener('scroll', function () {
    scrollFactor = Math.min(window.scrollY / (heroEl.clientHeight || 1), 1);
  }, { passive: true });

  /* ---------------------------------------------------------
     Resize handling
  --------------------------------------------------------- */
  function onResize() {
    width = heroEl.clientWidth;
    height = heroEl.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }
  window.addEventListener('resize', onResize);

  /* ---------------------------------------------------------
     Render loop
  --------------------------------------------------------- */
  var clock = new THREE.Clock();
  var isVisible = true;

  if ('IntersectionObserver' in window) {
    var visObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) { isVisible = entry.isIntersecting; });
    }, { threshold: 0 });
    visObserver.observe(heroEl);
  }

  function animate() {
    window.requestAnimationFrame(animate);
    if (!isVisible) return;

    var t = clock.getElapsedTime();

    if (!prefersReducedMotion) {
      nodes.forEach(function (n) {
        n.position.y = n.userData.baseY + Math.sin(t * n.userData.floatSpeed + n.userData.floatOffset) * 1.2;
      });

      var posAttr = particleGeometry.getAttribute('position');
      for (var pi = 0; pi < PARTICLE_COUNT; pi++) {
        var idx = pi * 3;
        posAttr.array[idx] += 0.03;
        if (posAttr.array[idx] > 45) posAttr.array[idx] = -45;
      }
      posAttr.needsUpdate = true;

      group.rotation.y += (targetRotY - group.rotation.y) * 0.04;
      group.rotation.x += (targetRotX - group.rotation.x) * 0.04;
    }

    group.position.y = scrollFactor * -6;
    group.rotation.z = scrollFactor * 0.05;

    renderer.render(scene, camera);
  }

  animate();
})();
