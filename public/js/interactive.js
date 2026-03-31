// ============================================================
// bigcompute.science — Interactive Visualizations
// ============================================================

(function() {
  'use strict';

  // Utility: setup a canvas fitting its container
  function setupCanvas(canvas, aspectRatio) {
    var dpr = window.devicePixelRatio || 1;
    var container = canvas.parentElement;
    var W = Math.floor(container.clientWidth - 48); // account for padding
    if (W < 300) W = 300;
    var H = Math.floor(W * (aspectRatio || 0.54));
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    var ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx: ctx, W: W, H: H };
  }

  function gcd(a, b) {
    while (b) { var t = b; b = a % b; a = t; }
    return a;
  }

  function cfQuotients(a, d) {
    var q = [];
    while (d !== 0) {
      q.push(Math.floor(a / d));
      var r = a % d;
      a = d;
      d = r;
    }
    return q;
  }

  function findWitness(d) {
    for (var a = 1; a <= d; a++) {
      if (gcd(a, d) === 1) {
        var pqs = cfQuotients(a, d);
        var ok = true;
        for (var i = 0; i < pqs.length; i++) { if (pqs[i] > 5) { ok = false; break; } }
        if (ok) return { a: a, pqs: pqs };
      }
    }
    return null;
  }

  function maxOfArray(arr) {
    var m = arr[0];
    for (var i = 1; i < arr.length; i++) { if (arr[i] > m) m = arr[i]; }
    return m;
  }

  // ============================================================
  // 1. Witness Distribution
  // ============================================================

  var witnessCanvas = document.getElementById('witness-canvas');
  var wSlider = document.getElementById('witness-max-d');
  var wLabel = document.getElementById('witness-d-label');

  if (witnessCanvas && wSlider) {
    function drawWitness() {
      var c = setupCanvas(witnessCanvas, 0.54);
      var ctx = c.ctx, W = c.W, H = c.H;
      var maxD = parseInt(wSlider.value);
      wLabel.textContent = maxD;

      ctx.fillStyle = '#0b0d10';
      ctx.fillRect(0, 0, W, H);

      var margin = { top: 30, right: 20, bottom: 40, left: 55 };
      var pw = W - margin.left - margin.right;
      var ph = H - margin.top - margin.bottom;

      // Axes
      ctx.strokeStyle = '#2a2e35';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(margin.left, margin.top);
      ctx.lineTo(margin.left, H - margin.bottom);
      ctx.lineTo(W - margin.right, H - margin.bottom);
      ctx.stroke();

      // Axis labels
      ctx.fillStyle = '#8a8580';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('d', W / 2, H - 8);
      ctx.save();
      ctx.translate(14, H / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText('\u03B1(d) / d', 0, 0);
      ctx.restore();

      // Y grid
      for (var yv = 0; yv <= 0.5; yv += 0.1) {
        var py = margin.top + ph - (yv / 0.5) * ph;
        ctx.fillStyle = '#8a8580';
        ctx.textAlign = 'right';
        ctx.font = '10px sans-serif';
        ctx.fillText(yv.toFixed(1), margin.left - 8, py + 4);
        ctx.strokeStyle = '#1a1e25';
        ctx.beginPath();
        ctx.moveTo(margin.left, py);
        ctx.lineTo(W - margin.right, py);
        ctx.stroke();
      }

      // Mean line at 0.171
      var meanY = margin.top + ph - (0.171 / 0.5) * ph;
      ctx.strokeStyle = '#5eead4';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(margin.left, meanY);
      ctx.lineTo(W - margin.right, meanY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#5eead4';
      ctx.font = '10px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('\u03BC = 0.171', W - margin.right - 70, meanY - 6);

      // Data points
      var colors = ['#2a2e35', '#2a2e35', '#2a2e35', '#7dd3fc', '#fcd34d', '#5eead4'];

      for (var d = 6; d <= maxD; d++) {
        var w = findWitness(d);
        if (!w) continue;
        var ratio = w.a / d;
        var maxPQ = maxOfArray(w.pqs);
        var px = margin.left + ((d - 6) / (maxD - 6)) * pw;
        var ptY = margin.top + ph - (ratio / 0.5) * ph;
        var r = Math.max(1.5, Math.min(4, w.pqs.length / 4));

        ctx.beginPath();
        ctx.arc(px, ptY, r, 0, Math.PI * 2);
        ctx.fillStyle = colors[maxPQ] || '#5eead4';
        ctx.globalAlpha = 0.7;
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }

    wSlider.addEventListener('input', drawWitness);
    drawWitness();
  }

  // ============================================================
  // 2. Spectral Gap Landscape
  // ============================================================

  var specCanvas = document.getElementById('spectral-canvas');
  var tooltip = document.getElementById('spectral-tooltip');
  var spectralData = [];

  if (specCanvas) {
    function drawSpectral() {
      var c = setupCanvas(specCanvas, 0.57);
      var ctx = c.ctx, W = c.W, H = c.H;

      ctx.fillStyle = '#0b0d10';
      ctx.fillRect(0, 0, W, H);

      if (spectralData.length === 0) {
        ctx.fillStyle = '#8a8580';
        ctx.font = '14px serif';
        ctx.textAlign = 'center';
        ctx.fillText('Loading spectral data...', W / 2, H / 2);
        return;
      }

      var margin = { top: 30, right: 20, bottom: 40, left: 55 };
      var pw = W - margin.left - margin.right;
      var ph = H - margin.top - margin.bottom;

      var maxM = 0;
      for (var i = 0; i < spectralData.length; i++) {
        if (spectralData[i].m > maxM) maxM = spectralData[i].m;
      }

      // Grid
      ctx.strokeStyle = '#1a1e25';
      ctx.lineWidth = 1;
      for (var g = 0; g <= 1; g += 0.2) {
        var y = margin.top + ph - g * ph;
        ctx.beginPath();
        ctx.moveTo(margin.left, y);
        ctx.lineTo(W - margin.right, y);
        ctx.stroke();
        ctx.fillStyle = '#8a8580';
        ctx.textAlign = 'right';
        ctx.font = '10px sans-serif';
        ctx.fillText(g.toFixed(1), margin.left - 8, y + 3);
      }

      // Axes
      ctx.strokeStyle = '#2a2e35';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(margin.left, margin.top);
      ctx.lineTo(margin.left, H - margin.bottom);
      ctx.lineTo(W - margin.right, H - margin.bottom);
      ctx.stroke();

      // Labels
      ctx.fillStyle = '#8a8580';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('modulus m', W / 2, H - 8);
      ctx.save();
      ctx.translate(14, H / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText('spectral gap \u03C3\u2098', 0, 0);
      ctx.restore();

      // B-K threshold
      var threshY = margin.top + ph - 0.672 * ph;
      ctx.strokeStyle = '#f87171';
      ctx.setLineDash([6, 4]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(margin.left, threshY);
      ctx.lineTo(W - margin.right, threshY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#f87171';
      ctx.font = '10px monospace';
      ctx.textAlign = 'right';
      ctx.fillText('B-K threshold (0.672)', W - margin.right, threshY - 6);

      // Points
      var points = [];
      for (var i = 0; i < spectralData.length; i++) {
        var d = spectralData[i];
        var x = margin.left + (d.m / maxM) * pw;
        var y = margin.top + ph - d.gap * ph;
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fillStyle = d.gap < 0.28 ? '#fbbf24' : '#5eead4';
        ctx.globalAlpha = 0.65;
        ctx.fill();
        ctx.globalAlpha = 1;
        points.push({ x: x, y: y, m: d.m, gap: d.gap, orbits: d.orbits || 0 });
      }

      // Min point
      var minD = spectralData[0];
      for (var i = 1; i < spectralData.length; i++) {
        if (spectralData[i].gap < minD.gap) minD = spectralData[i];
      }
      var mx = margin.left + (minD.m / maxM) * pw;
      var my = margin.top + ph - minD.gap * ph;
      ctx.beginPath();
      ctx.arc(mx, my, 5, 0, Math.PI * 2);
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = '#fbbf24';
      ctx.font = '10px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('m=' + minD.m + ' (' + minD.gap.toFixed(3) + ')', mx + 8, my + 3);

      specCanvas._points = points;
    }

    // Tooltip
    specCanvas.addEventListener('mousemove', function(e) {
      if (!specCanvas._points) return;
      var rect = specCanvas.getBoundingClientRect();
      var mx = e.clientX - rect.left;
      var my = e.clientY - rect.top;
      var closest = null, minDist = 20;
      for (var i = 0; i < specCanvas._points.length; i++) {
        var p = specCanvas._points[i];
        var dist = Math.sqrt((p.x - mx) * (p.x - mx) + (p.y - my) * (p.y - my));
        if (dist < minDist) { closest = p; minDist = dist; }
      }
      if (closest && tooltip) {
        tooltip.style.display = 'block';
        tooltip.style.left = (closest.x + 12) + 'px';
        tooltip.style.top = (closest.y - 10) + 'px';
        tooltip.textContent = 'm=' + closest.m + '  gap=' + closest.gap.toFixed(4) + '  orbits=' + closest.orbits;
      } else if (tooltip) {
        tooltip.style.display = 'none';
      }
    });

    specCanvas.addEventListener('mouseleave', function() {
      if (tooltip) tooltip.style.display = 'none';
    });

    // Load data
    fetch('/data/spectral-gaps.json')
      .then(function(r) { return r.json(); })
      .then(function(json) { spectralData = json.data; drawSpectral(); })
      .catch(function() { drawSpectral(); });
  }

  // ============================================================
  // 3. CF Tree Explorer
  // ============================================================

  var treeCanvas = document.getElementById('tree-canvas');
  var tSlider = document.getElementById('tree-depth');
  var tLabel = document.getElementById('tree-depth-label');
  var tAnimate = document.getElementById('tree-animate');

  if (treeCanvas && tSlider) {
    var MAX_NODES = 50000; // prevent browser lockup

    function drawTree(maxDepth, animateUpTo) {
      var c = setupCanvas(treeCanvas, 0.67);
      var ctx = c.ctx, W = c.W, H = c.H;

      ctx.fillStyle = '#0b0d10';
      ctx.fillRect(0, 0, W, H);

      var depth = animateUpTo || maxDepth;
      var denominators = {};
      var denomCount = 0;
      var nodeCount = 0;
      var capped = false;

      function drawNode(x, y, qPrev, q, d, spreadX, spreadY) {
        if (d > depth) return;
        if (nodeCount >= MAX_NODES) { capped = true; return; }
        if (!denominators[q]) { denominators[q] = true; denomCount++; }
        nodeCount++;

        // Skip drawing nodes that are off-screen
        if (x < -10 || x > W + 10 || y < -10 || y > H + 10) return;

        var hue = (d / maxDepth) * 120 + 160;
        var alpha = Math.max(0.15, 1 - d / (maxDepth + 1));
        ctx.fillStyle = 'hsla(' + hue + ', 60%, 65%, ' + alpha + ')';
        var r = Math.max(1, 4 - d * 0.35);
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();

        // Only draw edges for first few levels (they overlap too much deeper)
        if (d < 6) {
          for (var a = 1; a <= 5; a++) {
            var qNew = a * q + qPrev;
            var childX = x + (a - 3) * spreadX;
            var childY = y + spreadY;

            ctx.strokeStyle = 'hsla(' + hue + ', 40%, 50%, ' + (alpha * 0.2) + ')';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(childX, childY);
            ctx.stroke();

            drawNode(childX, childY, q, qNew, d + 1, spreadX * 0.45, spreadY);
          }
        } else {
          // Deep levels: just nodes, no edges (faster + cleaner)
          for (var a = 1; a <= 5; a++) {
            var qNew = a * q + qPrev;
            var childX = x + (a - 3) * spreadX;
            var childY = y + spreadY;
            drawNode(childX, childY, q, qNew, d + 1, spreadX * 0.45, spreadY);
          }
        }
      }

      var startY = 30;
      var spreadX = W / 12;
      var spreadY = (H - 60) / Math.max(depth, 1);
      drawNode(W / 2, startY, 0, 1, 0, spreadX, spreadY);

      ctx.fillStyle = '#8a8580';
      ctx.font = '11px monospace';
      ctx.textAlign = 'left';
      var stats = 'depth: ' + depth + '  nodes: ' + nodeCount + '  denominators: ' + denomCount;
      if (capped) stats += '  (capped at ' + MAX_NODES + ')';
      ctx.fillText(stats, 10, H - 10);
    }

    tSlider.addEventListener('input', function() {
      tLabel.textContent = tSlider.value;
      drawTree(parseInt(tSlider.value));
    });

    var animating = false;
    tAnimate.addEventListener('click', function() {
      if (animating) return;
      animating = true;
      var d = 1;
      var max = parseInt(tSlider.value);
      function step() {
        drawTree(max, d);
        d++;
        if (d <= max) requestAnimationFrame(step);
        else animating = false;
      }
      step();
    });

    drawTree(5);
  }

  // ============================================================
  // 4. Zaremba Density Phase Transition
  // ============================================================
  var densityCanvas = document.getElementById('density-canvas');
  if (densityCanvas) {
    var s = setupCanvas(densityCanvas, 0.5);
    var ctx = s.ctx, W = s.W, H = s.H;

    var data = [
      { label: '{1}', density: 0.003, dim: 0.0 },
      { label: '{2,3}', density: 0.92, dim: 0.0 },
      { label: '{1,2}', density: 57.98, dim: 0.531 },
      { label: '{1,3}', density: 23.01, dim: 0.388 },
      { label: '{1,3,5}', density: 98.72, dim: 0.624 },
      { label: '{1,2,3}', density: 99.997, dim: 0.706 },
      { label: '{1,2,4}', density: 99.994, dim: 0.695 },
      { label: '{2,3,4,5}', density: 84.06, dim: 0.605 },
      { label: '{1,2,3,4}', density: 99.9998, dim: 0.819 },
      { label: '{1,…,5}', density: 100.0, dim: 0.837 },
      { label: '{1,…,6}', density: 100.0, dim: 0.871 },
    ];

    data.sort(function(a, b) { return a.dim - b.dim; });

    var pad = { l: 55, r: 20, t: 20, b: 50 };
    var pw = W - pad.l - pad.r, ph = H - pad.t - pad.b;

    // Axes
    ctx.strokeStyle = '#4a4540';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l, H - pad.b);
    ctx.lineTo(W - pad.r, H - pad.b);
    ctx.stroke();

    // Threshold line at dim=0.5
    var threshX = pad.l + (0.5 / 0.9) * pw;
    ctx.strokeStyle = '#c0392b';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(threshX, pad.t); ctx.lineTo(threshX, H - pad.b);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#c0392b';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('δ = 1/2', threshX, pad.t - 4);

    // Points
    for (var i = 0; i < data.length; i++) {
      var d = data[i];
      var x = pad.l + (d.dim / 0.9) * pw;
      var y = H - pad.b - (d.density / 100) * ph;
      var r = 6;

      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = d.density > 99 ? '#27ae60' : d.density > 50 ? '#f39c12' : '#c0392b';
      ctx.fill();
      ctx.strokeStyle = '#1a1714';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = '#d4cfc9';
      ctx.font = '9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(d.label, x, y - 10);
    }

    // Axis labels
    ctx.fillStyle = '#8a8580';
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Hausdorff dimension dim_H(E_A)', pad.l + pw / 2, H - 8);
    ctx.save();
    ctx.translate(14, pad.t + ph / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Zaremba density (%)', 0, 0);
    ctx.restore();

    // Tick marks
    ctx.fillStyle = '#6a6560';
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    for (var v = 0; v <= 0.9; v += 0.2) {
      var tx = pad.l + (v / 0.9) * pw;
      ctx.fillText(v.toFixed(1), tx, H - pad.b + 14);
    }
    ctx.textAlign = 'right';
    for (var pct = 0; pct <= 100; pct += 25) {
      var ty = H - pad.b - (pct / 100) * ph;
      ctx.fillText(pct + '%', pad.l - 6, ty + 3);
    }
  }

  // ============================================================
  // 5. Class Number Distribution
  // ============================================================
  var classnumCanvas = document.getElementById('classnum-canvas');
  if (classnumCanvas) {
    var s = setupCanvas(classnumCanvas, 0.45);
    var ctx = s.ctx, W = s.W, H = s.H;

    var dist = [
      [1, 16.70], [2, 22.17], [3, 2.68], [4, 19.77], [5, 0.83],
      [6, 3.54], [7, 0.40], [8, 10.90], [9, 0.33], [10, 1.10],
      [11, 0.15], [12, 3.14], [13, 0.11], [14, 0.53], [15, 0.13],
      [16, 4.52], [17, 0.06], [18, 0.43], [19, 0.05], [20, 0.98]
    ];

    var pad = { l: 50, r: 15, t: 20, b: 45 };
    var pw = W - pad.l - pad.r, ph = H - pad.t - pad.b;
    var barW = pw / dist.length - 2;
    var maxPct = 25;

    // Axes
    ctx.strokeStyle = '#4a4540';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l, H - pad.b);
    ctx.lineTo(W - pad.r, H - pad.b);
    ctx.stroke();

    // Bars
    for (var i = 0; i < dist.length; i++) {
      var h = dist[i][0], pct = dist[i][1];
      var x = pad.l + i * (pw / dist.length) + 1;
      var barH = (pct / maxPct) * ph;
      var y = H - pad.b - barH;

      // Color: powers of 2 highlighted
      var isPow2 = (h & (h - 1)) === 0;
      ctx.fillStyle = isPow2 ? '#e67e22' : '#3498db';
      ctx.fillRect(x, y, barW, barH);

      // Label
      ctx.fillStyle = '#8a8580';
      ctx.font = '9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('h=' + h, x + barW / 2, H - pad.b + 13);
      if (pct > 1) {
        ctx.fillStyle = '#d4cfc9';
        ctx.fillText(pct.toFixed(1) + '%', x + barW / 2, y - 4);
      }
    }

    // Y axis
    ctx.fillStyle = '#6a6560';
    ctx.font = '9px monospace';
    ctx.textAlign = 'right';
    for (var tick = 0; tick <= maxPct; tick += 5) {
      var ty = H - pad.b - (tick / maxPct) * ph;
      ctx.fillText(tick + '%', pad.l - 6, ty + 3);
    }

    // Legend
    ctx.fillStyle = '#e67e22'; ctx.fillRect(W - 160, 10, 10, 10);
    ctx.fillStyle = '#8a8580'; ctx.font = '10px monospace'; ctx.textAlign = 'left';
    ctx.fillText('Powers of 2 (genus theory)', W - 145, 19);
    ctx.fillStyle = '#3498db'; ctx.fillRect(W - 160, 25, 10, 10);
    ctx.fillStyle = '#8a8580'; ctx.fillText('Other h values', W - 145, 34);
  }

  // ============================================================
  // 6. Hausdorff Dimension Spectrum (n=10, 1023 subsets)
  // ============================================================
  var hausdorffCanvas = document.getElementById('hausdorff-canvas');
  if (hausdorffCanvas) {
    var s = setupCanvas(hausdorffCanvas, 0.5);
    var ctx = s.ctx, W = s.W, H = s.H;

    // Precomputed summary: min/mean/max dimension per cardinality for n=10
    var byCard = [
      { card: 1,  min: 0.000, mean: 0.000, max: 0.000, count: 10 },
      { card: 2,  min: 0.000, mean: 0.271, max: 0.531, count: 45 },
      { card: 3,  min: 0.000, mean: 0.418, max: 0.706, count: 120 },
      { card: 4,  min: 0.105, mean: 0.518, max: 0.776, count: 210 },
      { card: 5,  min: 0.227, mean: 0.593, max: 0.837, count: 252 },
      { card: 6,  min: 0.334, mean: 0.654, max: 0.868, count: 210 },
      { card: 7,  min: 0.428, mean: 0.707, max: 0.893, count: 120 },
      { card: 8,  min: 0.531, mean: 0.755, max: 0.914, count: 45 },
      { card: 9,  min: 0.629, mean: 0.803, max: 0.932, count: 10 },
      { card: 10, min: 0.706, mean: 0.849, max: 0.849, count: 1 },
    ];

    var pad = { l: 50, r: 20, t: 25, b: 45 };
    var pw = W - pad.l - pad.r, ph = H - pad.t - pad.b;

    // Axes
    ctx.strokeStyle = '#4a4540';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l, H - pad.b);
    ctx.lineTo(W - pad.r, H - pad.b);
    ctx.stroke();

    // Draw range bars + mean dots
    for (var i = 0; i < byCard.length; i++) {
      var d = byCard[i];
      var x = pad.l + (d.card - 0.5) / 10.5 * pw;
      var yMin = H - pad.b - (d.min / 1.0) * ph;
      var yMax = H - pad.b - (d.max / 1.0) * ph;
      var yMean = H - pad.b - (d.mean / 1.0) * ph;

      // Range bar
      ctx.strokeStyle = 'rgba(52, 152, 219, 0.4)';
      ctx.lineWidth = Math.max(8, pw / 16);
      ctx.beginPath(); ctx.moveTo(x, yMin); ctx.lineTo(x, yMax); ctx.stroke();

      // Mean dot
      ctx.beginPath();
      ctx.arc(x, yMean, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#e67e22';
      ctx.fill();
      ctx.strokeStyle = '#1a1714';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Card label
      ctx.fillStyle = '#8a8580';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('|A|=' + d.card, x, H - pad.b + 14);
    }

    // Y axis ticks
    ctx.fillStyle = '#6a6560';
    ctx.font = '9px monospace';
    ctx.textAlign = 'right';
    for (var v = 0; v <= 1.0; v += 0.2) {
      var ty = H - pad.b - (v / 1.0) * ph;
      ctx.fillText(v.toFixed(1), pad.l - 6, ty + 3);
      ctx.strokeStyle = 'rgba(100,100,100,0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(pad.l, ty); ctx.lineTo(W - pad.r, ty); ctx.stroke();
    }

    // Labels
    ctx.fillStyle = '#8a8580';
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Cardinality |A|', pad.l + pw / 2, H - 6);
    ctx.save();
    ctx.translate(14, pad.t + ph / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('dim_H(E_A)', 0, 0);
    ctx.restore();

    // Annotation
    ctx.fillStyle = '#e67e22';
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('● mean    ▌ range (min–max)', pad.l + 10, pad.t + 10);
  }

})();
