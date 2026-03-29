// ============================================================
// bigcompute.science — Hero Particle Mosaic
//
// The "bigcompute.science" title is rendered as a grid of math
// symbols. Mouse repels particles, they spring back to position.
// ============================================================

(function() {
  'use strict';

  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  var heroEl = document.querySelector('.hero');
  if (!heroEl) return;

  // Hide the original h1 and tagline — we'll render them on canvas
  var heroH1 = heroEl.querySelector('h1');
  var heroTagline = heroEl.querySelector('.tagline');
  if (!heroH1) return;

  // Create canvas
  var canvas = document.createElement('canvas');
  canvas.style.cssText = 'display:block;margin:0 auto;cursor:default;';
  heroEl.insertBefore(canvas, heroEl.firstChild);

  // Hide original text (keep in DOM for SEO/accessibility)
  heroH1.style.position = 'absolute';
  heroH1.style.opacity = '0';
  heroH1.style.pointerEvents = 'none';
  if (heroTagline) {
    heroTagline.style.position = 'absolute';
    heroTagline.style.opacity = '0';
    heroTagline.style.pointerEvents = 'none';
  }

  var ctx = canvas.getContext('2d');
  var dpr = window.devicePixelRatio || 1;
  var W, H, fontSize, particles = [];
  var mouseX = -9999, mouseY = -9999;
  var REPEL_RADIUS = 80;
  var REPEL_FORCE = 8;
  var SPRING = 0.08;
  var DAMPING = 0.85;

  var MATH_CHARS = '\u03B4\u03BB\u03C3\u03B5\u222B\u2211\u220F\u221E\u221A\u2202\u2207\u2208\u2200\u2203\u03C0\u03C6\u03B6\u03930123456789';

  function resize() {
    var containerW = Math.min(heroEl.clientWidth - 32, 900);
    W = containerW;
    H = Math.floor(W * 0.32);
    if (H < 120) H = 120;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildParticles();
  }

  function buildParticles() {
    particles = [];

    // Render text to offscreen canvas to get pixel positions
    var offCanvas = document.createElement('canvas');
    offCanvas.width = W;
    offCanvas.height = H;
    var offCtx = offCanvas.getContext('2d');

    // Title text
    var titleText = 'bigcompute';
    var dotText = '.science';

    // Find font size that fits
    fontSize = Math.floor(W / 8);
    if (fontSize > 72) fontSize = 72;
    if (fontSize < 24) fontSize = 24;

    offCtx.fillStyle = '#ffffff';
    offCtx.font = '700 ' + fontSize + 'px "JetBrains Mono", "Fira Code", monospace';
    offCtx.textAlign = 'center';
    offCtx.textBaseline = 'middle';

    // Draw title
    var fullText = titleText + dotText;
    offCtx.fillText(fullText, W / 2, H / 2);

    // Sample pixels
    var imageData = offCtx.getImageData(0, 0, W, H);
    var data = imageData.data;

    // Determine grid spacing based on desired density
    var gap = Math.max(4, Math.floor(fontSize / 8));
    var charSize = gap * 1.2;

    for (var y = 0; y < H; y += gap) {
      for (var x = 0; x < W; x += gap) {
        var idx = (y * W + x) * 4;
        var alpha = data[idx + 3];
        if (alpha > 128) {
          // Determine if this pixel is in the ".science" part (accent color)
          // Measure where dotText starts
          var fullW = offCtx.measureText(fullText).width;
          var titleW = offCtx.measureText(titleText).width;
          var textStartX = W / 2 - fullW / 2;
          var dotStartX = textStartX + titleW;
          var isAccent = x >= dotStartX;

          particles.push({
            // Target position
            tx: x,
            ty: y,
            // Current position (start scattered)
            x: x + (Math.random() - 0.5) * W * 0.8,
            y: y + (Math.random() - 0.5) * H * 0.8,
            // Velocity
            vx: 0,
            vy: 0,
            // Display
            char: MATH_CHARS[Math.floor(Math.random() * MATH_CHARS.length)],
            size: charSize,
            accent: isAccent,
            // Slight phase offset for shimmer
            phase: Math.random() * Math.PI * 2
          });
        }
      }
    }
  }

  function animate() {
    ctx.clearRect(0, 0, W, H);

    var time = Date.now() * 0.001;

    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];

      // Spring force toward target
      var dx = p.tx - p.x;
      var dy = p.ty - p.y;
      p.vx += dx * SPRING;
      p.vy += dy * SPRING;

      // Mouse repulsion
      var mdx = p.x - mouseX;
      var mdy = p.y - mouseY;
      var dist = Math.sqrt(mdx * mdx + mdy * mdy);
      if (dist < REPEL_RADIUS && dist > 0) {
        var force = (REPEL_RADIUS - dist) / REPEL_RADIUS * REPEL_FORCE;
        p.vx += (mdx / dist) * force;
        p.vy += (mdy / dist) * force;
      }

      // Damping
      p.vx *= DAMPING;
      p.vy *= DAMPING;

      // Update position
      p.x += p.vx;
      p.y += p.vy;

      // Shimmer opacity
      var shimmer = 0.6 + 0.4 * Math.sin(time * 1.5 + p.phase);

      // Distance from target affects opacity (settled = brighter)
      var settled = 1 - Math.min(1, Math.sqrt(dx * dx + dy * dy) / 30);
      var alpha = shimmer * (0.4 + 0.6 * settled);

      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.accent ? '#5eead4' : '#e8e6e3';
      ctx.font = Math.floor(p.size) + 'px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.char, p.x, p.y);
    }

    ctx.globalAlpha = 1;
    requestAnimationFrame(animate);
  }

  // Mouse tracking relative to canvas
  canvas.addEventListener('mousemove', function(e) {
    var rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
  });

  canvas.addEventListener('mouseleave', function() {
    mouseX = -9999;
    mouseY = -9999;
  });

  // Touch support
  canvas.addEventListener('touchmove', function(e) {
    var rect = canvas.getBoundingClientRect();
    var touch = e.touches[0];
    mouseX = touch.clientX - rect.left;
    mouseY = touch.clientY - rect.top;
  });

  canvas.addEventListener('touchend', function() {
    mouseX = -9999;
    mouseY = -9999;
  });

  window.addEventListener('resize', resize);
  resize();
  animate();

})();
