    // ============================================================
    // Witness Distribution Visualization
    // ============================================================
    const witnessCanvas = document.getElementById('witness-canvas');
    const wCtx = witnessCanvas.getContext('2d');
    const wSlider = document.getElementById('witness-max-d');
    const wLabel = document.getElementById('witness-d-label');

    function gcd(a, b) { while (b) { [a, b] = [b, a % b]; } return a; }

    function cfQuotients(a, d) {
      const q = [];
      while (d !== 0) {
        q.push(Math.floor(a / d));
        [a, d] = [d, a % d];
      }
      return q;
    }

    function findWitness(d) {
      for (let a = 1; a <= d; a++) {
        if (gcd(a, d) === 1) {
          const pqs = cfQuotients(a, d);
          if (pqs.every(q => q <= 5)) return { a, pqs };
        }
      }
      return null;
    }

    function drawWitness() {
      const maxD = parseInt(wSlider.value);
      wLabel.textContent = maxD;
      const W = witnessCanvas.width, H = witnessCanvas.height;
      const dpr = window.devicePixelRatio || 1;
      witnessCanvas.width = W * dpr;
      witnessCanvas.height = H * dpr;
      wCtx.scale(dpr, dpr);
      witnessCanvas.style.width = W + 'px';
      witnessCanvas.style.height = H + 'px';

      wCtx.fillStyle = '#0b0d10';
      wCtx.fillRect(0, 0, W, H);

      const margin = { top: 30, right: 20, bottom: 40, left: 55 };
      const pw = W - margin.left - margin.right;
      const ph = H - margin.top - margin.bottom;

      // Axes
      wCtx.strokeStyle = '#2a2e35';
      wCtx.lineWidth = 1;
      wCtx.beginPath();
      wCtx.moveTo(margin.left, margin.top);
      wCtx.lineTo(margin.left, H - margin.bottom);
      wCtx.lineTo(W - margin.right, H - margin.bottom);
      wCtx.stroke();

      // Labels
      wCtx.fillStyle = '#8a8580';
      wCtx.font = '11px "Helvetica Neue", sans-serif';
      wCtx.textAlign = 'center';
      wCtx.fillText('d', W / 2, H - 8);
      wCtx.save();
      wCtx.translate(14, H / 2);
      wCtx.rotate(-Math.PI / 2);
      wCtx.fillText('α(d) / d', 0, 0);
      wCtx.restore();

      // Y axis ticks
      for (let y = 0; y <= 0.5; y += 0.1) {
        const py = margin.top + ph - (y / 0.5) * ph;
        wCtx.fillStyle = '#8a8580';
        wCtx.textAlign = 'right';
        wCtx.fillText(y.toFixed(1), margin.left - 8, py + 4);
        wCtx.strokeStyle = '#1a1e25';
        wCtx.beginPath();
        wCtx.moveTo(margin.left, py);
        wCtx.lineTo(W - margin.right, py);
        wCtx.stroke();
      }

      // Mean line at 0.171
      const meanY = margin.top + ph - (0.171 / 0.5) * ph;
      wCtx.strokeStyle = '#5eead4';
      wCtx.setLineDash([4, 4]);
      wCtx.beginPath();
      wCtx.moveTo(margin.left, meanY);
      wCtx.lineTo(W - margin.right, meanY);
      wCtx.stroke();
      wCtx.setLineDash([]);
      wCtx.fillStyle = '#5eead4';
      wCtx.textAlign = 'left';
      wCtx.font = '10px monospace';
      wCtx.fillText('μ = 0.171', W - margin.right - 65, meanY - 6);

      // Data points
      const colors = ['#2a2e35', '#2a2e35', '#2a2e35', '#7dd3fc', '#fcd34d', '#5eead4'];

      for (let d = 6; d <= maxD; d++) {
        const w = findWitness(d);
        if (!w) continue;
        const ratio = w.a / d;
        const maxPQ = Math.max.apply(null, w.pqs);
        const px = margin.left + ((d - 6) / (maxD - 6)) * pw;
        const py = margin.top + ph - (ratio / 0.5) * ph;
        const r = Math.max(1.5, Math.min(4, w.pqs.length / 4));

        wCtx.beginPath();
        wCtx.arc(px, py, r, 0, Math.PI * 2);
        wCtx.fillStyle = colors[maxPQ] || '#5eead4';
        wCtx.globalAlpha = 0.7;
        wCtx.fill();
        wCtx.globalAlpha = 1;
      }
    }

    wSlider.addEventListener('input', drawWitness);
    drawWitness();

    // ============================================================
    // Spectral Gap Visualization
    // ============================================================
    const specCanvas = document.getElementById('spectral-canvas');
    const sCtx = specCanvas.getContext('2d');
    const tooltip = document.getElementById('spectral-tooltip');

    // Fetch spectral data
    let spectralData = [];

    async function loadSpectralData() {
      try {
        const resp = await fetch('/data/spectral-gaps.json');
        const json = await resp.json();
        spectralData = json.data;
        drawSpectral();
      } catch (e) {
        // Fallback: draw placeholder
        sCtx.fillStyle = '#8a8580';
        sCtx.font = '14px serif';
        sCtx.textAlign = 'center';
        sCtx.fillText('Loading spectral data...', specCanvas.width / 2, specCanvas.height / 2);
      }
    }

    function drawSpectral() {
      const W = specCanvas.width, H = specCanvas.height;
      const dpr = window.devicePixelRatio || 1;
      specCanvas.width = W * dpr;
      specCanvas.height = H * dpr;
      sCtx.scale(dpr, dpr);
      specCanvas.style.width = W + 'px';
      specCanvas.style.height = H + 'px';

      sCtx.fillStyle = '#0b0d10';
      sCtx.fillRect(0, 0, W, H);

      const margin = { top: 30, right: 20, bottom: 40, left: 55 };
      const pw = W - margin.left - margin.right;
      const ph = H - margin.top - margin.bottom;
      const maxM = spectralData.reduce(function(a,b){return a.m>b.m?a:b}).m;

      // Grid
      sCtx.strokeStyle = '#1a1e25';
      sCtx.lineWidth = 1;
      for (let g = 0; g <= 1; g += 0.2) {
        const y = margin.top + ph - g * ph;
        sCtx.beginPath();
        sCtx.moveTo(margin.left, y);
        sCtx.lineTo(W - margin.right, y);
        sCtx.stroke();
        sCtx.fillStyle = '#8a8580';
        sCtx.textAlign = 'right';
        sCtx.font = '10px sans-serif';
        sCtx.fillText(g.toFixed(1), margin.left - 8, y + 3);
      }

      // Axes
      sCtx.strokeStyle = '#2a2e35';
      sCtx.lineWidth = 1.5;
      sCtx.beginPath();
      sCtx.moveTo(margin.left, margin.top);
      sCtx.lineTo(margin.left, H - margin.bottom);
      sCtx.lineTo(W - margin.right, H - margin.bottom);
      sCtx.stroke();

      // Labels
      sCtx.fillStyle = '#8a8580';
      sCtx.font = '11px sans-serif';
      sCtx.textAlign = 'center';
      sCtx.fillText('modulus m', W / 2, H - 8);
      sCtx.save();
      sCtx.translate(14, H / 2);
      sCtx.rotate(-Math.PI / 2);
      sCtx.fillText('spectral gap σₘ', 0, 0);
      sCtx.restore();

      // B-K threshold
      const threshY = margin.top + ph - 0.672 * ph;
      sCtx.strokeStyle = '#f87171';
      sCtx.setLineDash([6, 4]);
      sCtx.lineWidth = 1;
      sCtx.beginPath();
      sCtx.moveTo(margin.left, threshY);
      sCtx.lineTo(W - margin.right, threshY);
      sCtx.stroke();
      sCtx.setLineDash([]);
      sCtx.fillStyle = '#f87171';
      sCtx.font = '10px monospace';
      sCtx.textAlign = 'right';
      sCtx.fillText('B-K threshold (0.672)', W - margin.right, threshY - 6);

      // Data points
      spectralData.forEach(d => {
        const x = margin.left + (d.m / maxM) * pw;
        const y = margin.top + ph - d.gap * ph;
        sCtx.beginPath();
        sCtx.arc(x, y, 2, 0, Math.PI * 2);
        sCtx.fillStyle = d.gap < 0.28 ? '#fbbf24' : '#5eead4';
        sCtx.globalAlpha = 0.65;
        sCtx.fill();
        sCtx.globalAlpha = 1;
      });

      // Min point
      const minD = spectralData.reduce((a, b) => a.gap < b.gap ? a : b);
      const mx = margin.left + (minD.m / maxM) * pw;
      const my = margin.top + ph - minD.gap * ph;
      sCtx.beginPath();
      sCtx.arc(mx, my, 5, 0, Math.PI * 2);
      sCtx.strokeStyle = '#fbbf24';
      sCtx.lineWidth = 1.5;
      sCtx.stroke();
      sCtx.fillStyle = '#fbbf24';
      sCtx.font = '10px monospace';
      sCtx.textAlign = 'left';
      sCtx.fillText(`m=${minD.m} (${minD.gap.toFixed(3)})`, mx + 8, my + 3);

      // Store positions for hover
      specCanvas._points = spectralData.map(d => ({
        x: margin.left + (d.m / maxM) * pw,
        y: margin.top + ph - d.gap * ph,
        m: d.m, gap: d.gap, orbits: d.orbits
      }));
    }

    specCanvas.addEventListener('mousemove', (e) => {
      if (!specCanvas._points) return;
      const rect = specCanvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      let closest = null, minDist = 20;
      for (const p of specCanvas._points) {
        const dist = Math.hypot(p.x - mx, p.y - my);
        if (dist < minDist) { closest = p; minDist = dist; }
      }

      if (closest) {
        tooltip.style.display = 'block';
        tooltip.style.left = (closest.x + 12) + 'px';
        tooltip.style.top = (closest.y - 10) + 'px';
        tooltip.textContent = `m=${closest.m}  gap=${closest.gap.toFixed(4)}  orbits=${closest.orbits}`;
      } else {
        tooltip.style.display = 'none';
      }
    });

    specCanvas.addEventListener('mouseleave', () => { tooltip.style.display = 'none'; });
    loadSpectralData();

    // ============================================================
    // CF Tree Explorer
    // ============================================================
    const treeCanvas = document.getElementById('tree-canvas');
    const tCtx = treeCanvas.getContext('2d');
    const tSlider = document.getElementById('tree-depth');
    const tLabel = document.getElementById('tree-depth-label');
    const tAnimate = document.getElementById('tree-animate');

    function drawTree(maxDepth, animateUpTo) {
      const W = treeCanvas.width, H = treeCanvas.height;
      const dpr = window.devicePixelRatio || 1;
      treeCanvas.width = W * dpr;
      treeCanvas.height = H * dpr;
      tCtx.scale(dpr, dpr);
      treeCanvas.style.width = W + 'px';
      treeCanvas.style.height = H + 'px';

      tCtx.fillStyle = '#0b0d10';
      tCtx.fillRect(0, 0, W, H);

      const depth = animateUpTo || maxDepth;
      const denominators = new Set();
      let nodeCount = 0;

      function drawNode(x, y, qPrev, q, d, spreadX, spreadY) {
        if (d > depth) return;
        denominators.add(q);
        nodeCount++;

        // Node color by depth
        const hue = (d / maxDepth) * 120 + 160;
        const alpha = Math.max(0.3, 1 - d / (maxDepth + 2));
        tCtx.fillStyle = `hsla(${hue}, 60%, 65%, ${alpha})`;
        const r = Math.max(1.5, 4 - d * 0.3);
        tCtx.beginPath();
        tCtx.arc(x, y, r, 0, Math.PI * 2);
        tCtx.fill();

        // Children
        for (let a = 1; a <= 5; a++) {
          const qNew = a * q + qPrev;
          const childX = x + (a - 3) * spreadX;
          const childY = y + spreadY;

          tCtx.strokeStyle = `hsla(${hue}, 40%, 50%, ${alpha * 0.3})`;
          tCtx.lineWidth = 0.5;
          tCtx.beginPath();
          tCtx.moveTo(x, y);
          tCtx.lineTo(childX, childY);
          tCtx.stroke();

          drawNode(childX, childY, q, qNew, d + 1, spreadX * 0.45, spreadY);
        }
      }

      const startY = 30;
      const spreadX = W / 12;
      const spreadY = (H - 60) / Math.max(depth, 1);

      drawNode(W / 2, startY, 0, 1, 0, spreadX, spreadY);

      // Stats
      tCtx.fillStyle = '#8a8580';
      tCtx.font = '11px monospace';
      tCtx.textAlign = 'left';
      tCtx.fillText(`depth: ${depth}  nodes: ${nodeCount}  unique denominators: ${denominators.size}`, 10, H - 10);
    }

    tSlider.addEventListener('input', () => {
      tLabel.textContent = tSlider.value;
      drawTree(parseInt(tSlider.value));
    });

    let animating = false;
    tAnimate.addEventListener('click', () => {
      if (animating) return;
      animating = true;
      let d = 1;
      const max = parseInt(tSlider.value);
      function step() {
        drawTree(max, d);
        d++;
        if (d <= max) requestAnimationFrame(step);
        else animating = false;
      }
      step();
    });

    drawTree(6);
