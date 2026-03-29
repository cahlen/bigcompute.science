// ============================================================
// bigcompute.science — Visual Effects
// ASCII particle hero, text scramble, scroll sparkles
// Inspired by ukint-vs.github.io
// ============================================================

(function() {
  'use strict';

  // Respect reduced motion
  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  // Math symbol charset for effects
  var MATH_CHARS = '\u03B4\u03BB\u03C3\u03B5\u222B\u2211\u220F\u221E\u221A\u2202\u2207\u2208\u2200\u2203\u22C5\u00B1\u2260\u2264\u2265\u2248\u03C0\u03C6\u03B6\u0393';
  var MONO_CHARS = '0123456789ABCDEFabcdef.+-=<>|/\\{}[]()';

  // ============================================================
  // 1. Text Scramble Effect on headings
  // ============================================================

  function scrambleText(el) {
    // Save the original innerHTML to restore at end (preserves colors/spans)
    var originalHTML = el.innerHTML;
    var originalText = el.textContent;
    var duration = 800;
    var start = null;
    var chars = MATH_CHARS + MONO_CHARS;

    function frame(ts) {
      if (!start) start = ts;
      var progress = Math.min((ts - start) / duration, 1);
      var ease = 1 - Math.pow(1 - progress, 3);
      var resolved = Math.floor(ease * originalText.length);

      var display = '';
      for (var i = 0; i < originalText.length; i++) {
        if (i < resolved) {
          display += originalText[i];
        } else if (originalText[i] === ' ') {
          display += ' ';
        } else {
          display += chars[Math.floor(Math.random() * chars.length)];
        }
      }
      el.textContent = display;

      if (progress < 1) {
        requestAnimationFrame(frame);
      } else {
        // Restore original HTML with all styling intact
        el.innerHTML = originalHTML;
      }
    }

    requestAnimationFrame(frame);
  }

  // Apply to all h1 and h2 elements when they enter viewport
  var scrambleObserver = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting && !entry.target._scrambled) {
        entry.target._scrambled = true;
        scrambleText(entry.target);
      }
    });
  }, { threshold: 0.3 });

  document.querySelectorAll('.experiment-content h1, .experiment-content h2').forEach(function(el) {
    scrambleObserver.observe(el);
  });

  // Don't scramble the hero h1 — the particle mosaic handles that

  // ============================================================
  // 2. Scroll Sparkle Particles
  // ============================================================

  var sparkleCanvas = document.createElement('canvas');
  sparkleCanvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999';
  document.body.appendChild(sparkleCanvas);
  var sparkCtx = sparkleCanvas.getContext('2d');
  var particles = [];
  var lastScroll = 0;
  var lastSpawnTime = 0;

  function resizeSparkle() {
    var dpr = window.devicePixelRatio || 1;
    sparkleCanvas.width = window.innerWidth * dpr;
    sparkleCanvas.height = window.innerHeight * dpr;
    sparkCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resizeSparkle();
  window.addEventListener('resize', resizeSparkle);

  function spawnParticle(x, y, dir) {
    particles.push({
      x: x,
      y: y,
      vx: (Math.random() - 0.5) * 40,
      vy: dir * (Math.random() * 30 + 10),
      life: 1,
      decay: 0.012 + Math.random() * 0.008,
      char: MATH_CHARS[Math.floor(Math.random() * MATH_CHARS.length)],
      size: 10 + Math.random() * 6,
      rotation: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.1
    });
  }

  window.addEventListener('scroll', function() {
    var now = Date.now();
    if (now - lastSpawnTime < 50) return;
    lastSpawnTime = now;

    var scrollY = window.scrollY;
    var dir = scrollY > lastScroll ? -1 : 1;
    lastScroll = scrollY;

    // Spawn 1-3 particles at random x positions
    var count = 1 + Math.floor(Math.random() * 2);
    for (var i = 0; i < count; i++) {
      var x = Math.random() * window.innerWidth;
      var y = dir === -1 ? window.innerHeight - 20 : 20;
      spawnParticle(x, y, dir);
    }
  });

  function animateParticles() {
    sparkCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    for (var i = particles.length - 1; i >= 0; i--) {
      var p = particles[i];
      p.x += p.vx * 0.016;
      p.y += p.vy * 0.016;
      p.vy += 15 * 0.016; // gentle gravity
      p.life -= p.decay;
      p.rotation += p.spin;

      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }

      sparkCtx.save();
      sparkCtx.translate(p.x, p.y);
      sparkCtx.rotate(p.rotation);
      sparkCtx.globalAlpha = p.life * p.life; // quadratic fade
      sparkCtx.fillStyle = '#5eead4';
      sparkCtx.font = Math.floor(p.size) + 'px serif';
      sparkCtx.textAlign = 'center';
      sparkCtx.textBaseline = 'middle';
      sparkCtx.fillText(p.char, 0, 0);
      sparkCtx.restore();
    }

    requestAnimationFrame(animateParticles);
  }

  animateParticles();

  // ============================================================
  // 3. Equation hover glow
  // ============================================================

  document.querySelectorAll('.katex-display').forEach(function(el) {
    el.addEventListener('mouseenter', function() {
      el.style.transition = 'box-shadow 300ms ease, border-left-color 300ms ease';
      el.style.boxShadow = '0 0 20px rgba(94, 234, 212, 0.08)';
      el.style.borderLeftColor = '#5eead4';
    });
    el.addEventListener('mouseleave', function() {
      el.style.boxShadow = 'none';
      el.style.borderLeftColor = '';
    });
  });

})();
