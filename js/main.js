(function () {
  'use strict';

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------
     Sticky nav shadow/background on scroll
  --------------------------------------------------------- */
  var navWrap = document.getElementById('navWrap');
  function onScrollNav() {
    if (window.scrollY > 12) {
      navWrap.classList.add('scrolled');
    } else {
      navWrap.classList.remove('scrolled');
    }
  }
  onScrollNav();
  window.addEventListener('scroll', onScrollNav, { passive: true });

  /* ---------------------------------------------------------
     Mobile menu toggle
  --------------------------------------------------------- */
  var navToggle = document.getElementById('navToggle');
  var navMenu = document.getElementById('navMenu');

  function closeMenu() {
    navToggle.setAttribute('aria-expanded', 'false');
    navMenu.classList.remove('open');
    document.body.style.overflow = '';
  }
  function openMenu() {
    navToggle.setAttribute('aria-expanded', 'true');
    navMenu.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  navToggle.addEventListener('click', function () {
    var expanded = navToggle.getAttribute('aria-expanded') === 'true';
    if (expanded) { closeMenu(); } else { openMenu(); }
  });
  navMenu.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', closeMenu);
  });
  window.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeMenu();
  });

  /* ---------------------------------------------------------
     Scrollspy — highlight active nav link
  --------------------------------------------------------- */
  var sections = Array.prototype.slice.call(document.querySelectorAll('main section[id]'));
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav-link'));

  function setActiveLink(id) {
    navLinks.forEach(function (link) {
      var match = link.getAttribute('href') === '#' + id;
      link.classList.toggle('active', match);
      if (match) { link.setAttribute('aria-current', 'true'); } else { link.removeAttribute('aria-current'); }
    });
  }

  if ('IntersectionObserver' in window && sections.length) {
    var spyObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) setActiveLink(entry.target.id);
      });
    }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });
    sections.forEach(function (s) { spyObserver.observe(s); });
  }

  /* ---------------------------------------------------------
     Reveal-on-scroll
  --------------------------------------------------------- */
  var revealEls = Array.prototype.slice.call(document.querySelectorAll('.reveal-up'));
  if (prefersReducedMotion) {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  } else if ('IntersectionObserver' in window) {
    var revealObserver = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    revealEls.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------------------------------------------------------
     Animated stat counters (hero)
  --------------------------------------------------------- */
  var counters = Array.prototype.slice.call(document.querySelectorAll('.hero-stat-num'));

  function animateCounter(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var suffix = el.getAttribute('data-suffix') || '';
    var isFloat = String(target).indexOf('.') !== -1;
    if (prefersReducedMotion) {
      el.textContent = (isFloat ? target.toFixed(1) : target) + suffix;
      return;
    }
    var duration = 1400;
    var start = null;

    function step(ts) {
      if (start === null) start = ts;
      var progress = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var current = target * eased;
      el.textContent = (isFloat ? current.toFixed(1) : Math.round(current)) + suffix;
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        el.textContent = (isFloat ? target.toFixed(1) : target) + suffix;
      }
    }
    window.requestAnimationFrame(step);
  }

  if (counters.length) {
    if ('IntersectionObserver' in window) {
      var counterObserver = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            obs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.6 });
      counters.forEach(function (c) { counterObserver.observe(c); });
    } else {
      counters.forEach(animateCounter);
    }
  }

  /* ---------------------------------------------------------
     Testimonial carousel
  --------------------------------------------------------- */
  var track = document.getElementById('testimonialTrack');
  var dotsWrap = document.getElementById('testimonialDots');
  if (track && dotsWrap) {
    var cards = Array.prototype.slice.call(track.querySelectorAll('.testimonial-card'));
    var current = 0;
    var timer = null;

    cards.forEach(function (card, i) {
      var dot = document.createElement('button');
      dot.type = 'button';
      dot.setAttribute('aria-label', 'Tampilkan testimoni ' + (i + 1));
      dot.addEventListener('click', function () { goTo(i); resetTimer(); });
      dotsWrap.appendChild(dot);
    });
    var dots = Array.prototype.slice.call(dotsWrap.querySelectorAll('button'));

    function goTo(index) {
      cards[current].classList.remove('is-active');
      dots[current].classList.remove('is-active');
      current = (index + cards.length) % cards.length;
      cards[current].classList.add('is-active');
      dots[current].classList.add('is-active');
    }
    function next() { goTo(current + 1); }
    function resetTimer() {
      if (prefersReducedMotion) return;
      if (timer) clearInterval(timer);
      timer = setInterval(next, 6000);
    }

    goTo(0);
    resetTimer();
  }

  /* ---------------------------------------------------------
     Coverage-check form (client-side demo interaction)
  --------------------------------------------------------- */
  var coverageForm = document.getElementById('coverageForm');
  var coverageResult = document.getElementById('coverageResult');
  if (coverageForm) {
    coverageForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var value = document.getElementById('coverageInput').value.trim();
      if (!value) {
        coverageResult.textContent = 'Masukkan alamat atau kode pos terlebih dahulu.';
        return;
      }
      var lower = value.toLowerCase();
      var isCovered = lower.indexOf('jakarta') !== -1 || lower.indexOf('bekasi') !== -1;
      coverageResult.textContent = isCovered
        ? 'Kabar baik — area "' + value + '" berada dalam jangkauan aktif kami. Lanjutkan ke formulir kontak untuk pemasangan.'
        : 'Area "' + value + '" belum aktif, namun masuk dalam peta ekspansi kami. Tim akan menghubungi Anda saat tersedia — isi formulir kontak untuk mendaftar prioritas.';
      var needSelect = document.getElementById('need');
      window.setTimeout(function () {
        document.getElementById('kontak').scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
        document.getElementById('name').focus({ preventScroll: true });
      }, 900);
    });
  }

  /* ---------------------------------------------------------
     Contact form (client-side validation demo)
  --------------------------------------------------------- */
  var contactForm = document.getElementById('contactForm');
  var formResult = document.getElementById('formResult');
  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!contactForm.checkValidity()) {
        formResult.style.color = '#DC2626';
        formResult.textContent = 'Mohon lengkapi kolom yang wajib diisi.';
        return;
      }
      var name = document.getElementById('name').value.trim();
      formResult.style.color = '';
      formResult.textContent = 'Terima kasih, ' + name + '! Tim KINGS akan menghubungi Anda segera.';
      contactForm.reset();
    });
  }

  /* ---------------------------------------------------------
     Smooth-scroll offset correction for fixed nav
  --------------------------------------------------------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var id = this.getAttribute('href').slice(1);
      var target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      var navH = document.getElementById('navWrap').offsetHeight;
      var top = target.getBoundingClientRect().top + window.pageYOffset - (navH - 1);
      window.scrollTo({ top: top, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });
  });
})();
