document.addEventListener('DOMContentLoaded', () => {
  const html = document.documentElement;
  const toggleBtn = document.getElementById('theme-toggle');
  const toggleIcon = toggleBtn.querySelector('.toggle-icon');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- Theme ---------------- */
  function currentTheme() {
    return html.getAttribute('data-theme')
      || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  }
  function paintToggle() {
    toggleIcon.textContent = currentTheme() === 'dark' ? '☀' : '☾';
  }
  const saved = localStorage.getItem('theme');
  if (saved) html.setAttribute('data-theme', saved);
  else if (window.matchMedia('(prefers-color-scheme: dark)').matches) html.setAttribute('data-theme', 'dark');
  paintToggle();

  toggleBtn.addEventListener('click', () => {
    const next = currentTheme() === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    paintToggle();
    sky.rebuild();
  });

  /* ---------------- Scroll cue + reveal ---------------- */
  const onScroll = () => document.body.classList.toggle('scrolled', window.scrollY > 40);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  const sections = document.querySelectorAll('.content section');
  if (!reduce && 'IntersectionObserver' in window) {
    document.body.classList.add('js-reveal');
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); obs.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    sections.forEach((s) => io.observe(s));
  }

  /* ---------------- Ambient sky (stars / petals) ---------------- */
  const sky = (() => {
    const canvas = document.getElementById('sky');
    const ctx = canvas.getContext('2d');
    let W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
    let particles = [], shooting = [], mode = 'light';
    const mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
    let nextShoot = 0, raf = null, last = 0;

    const cssVar = (n) => getComputedStyle(html).getPropertyValue(n).trim();

    function resize() {
      W = canvas.clientWidth; H = canvas.clientHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(W * dpr);
      canvas.height = Math.floor(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function build() {
      mode = currentTheme();
      const area = W * H;
      particles = [];
      shooting = [];
      if (mode === 'dark') {
        const cols = [cssVar('--star-1') || '#fff', cssVar('--star-2') || '#cfe', cssVar('--star-3') || '#fed'];
        const n = Math.min(150, Math.round(area / 9000));
        for (let i = 0; i < n; i++) {
          particles.push({
            x: Math.random() * W, y: Math.random() * H,
            r: Math.random() * 1.5 + 0.4,
            a: Math.random() * 0.5 + 0.3,
            tw: Math.random() * Math.PI * 2,
            tws: Math.random() * 0.9 + 0.3,
            depth: Math.random() * 0.7 + 0.15,
            glow: Math.random() < 0.14,
            c: cols[(Math.random() * cols.length) | 0]
          });
        }
        nextShoot = performance.now() + 3500 + Math.random() * 5000;
      } else {
        const cols = [cssVar('--petal-1'), cssVar('--petal-2'), cssVar('--petal-3'), cssVar('--petal-4')];
        const n = Math.min(34, Math.round(area / 42000));
        for (let i = 0; i < n; i++) {
          particles.push({
            x: Math.random() * W, y: Math.random() * H,
            w: Math.random() * 6 + 5, h: Math.random() * 3 + 3.5,
            rot: Math.random() * Math.PI * 2,
            rots: (Math.random() - 0.5) * 0.02,
            vy: Math.random() * 0.35 + 0.18,
            sway: Math.random() * 0.9 + 0.4,
            phase: Math.random() * Math.PI * 2,
            a: Math.random() * 0.35 + 0.35,
            depth: Math.random() * 0.7 + 0.2,
            c: cols[(Math.random() * cols.length) | 0] || '#eab'
          });
        }
      }
    }

    function drawStatic() {
      ctx.clearRect(0, 0, W, H);
      for (const p of particles) {
        if (mode === 'dark') {
          ctx.globalAlpha = p.a;
          ctx.fillStyle = p.c;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill();
        } else {
          petal(p, 0, 0);
        }
      }
      ctx.globalAlpha = 1;
    }

    function petal(p, ox, oy) {
      ctx.save();
      ctx.translate(p.x + ox, p.y + oy);
      ctx.rotate(p.rot);
      ctx.globalAlpha = p.a;
      ctx.fillStyle = p.c;
      ctx.beginPath();
      ctx.ellipse(0, 0, p.w, p.h, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    function frame(t) {
      const dt = Math.min(40, t - last) / 16.7; last = t;
      mouse.x += (mouse.tx - mouse.x) * 0.05;
      mouse.y += (mouse.ty - mouse.y) * 0.05;
      const mx = (mouse.x - 0.5), my = (mouse.y - 0.5);
      ctx.clearRect(0, 0, W, H);

      if (mode === 'dark') {
        for (const p of particles) {
          p.tw += 0.02 * p.tws * dt;
          const a = p.a * (0.6 + 0.4 * Math.sin(p.tw));
          const ox = -mx * 40 * p.depth, oy = -my * 40 * p.depth;
          ctx.globalAlpha = Math.max(0, a);
          ctx.fillStyle = p.c;
          if (p.glow) { ctx.shadowBlur = 8; ctx.shadowColor = p.c; } else { ctx.shadowBlur = 0; }
          ctx.beginPath(); ctx.arc(p.x + ox, p.y + oy, p.r, 0, 7); ctx.fill();
        }
        ctx.shadowBlur = 0;
        // shooting stars
        if (t > nextShoot && shooting.length === 0) {
          const sx = Math.random() * W * 0.6, sy = Math.random() * H * 0.4;
          shooting.push({ x: sx, y: sy, vx: 6 + Math.random() * 4, vy: 2.4 + Math.random() * 2, life: 1 });
          nextShoot = t + 6000 + Math.random() * 8000;
        }
        for (let i = shooting.length - 1; i >= 0; i--) {
          const s = shooting[i];
          s.x += s.vx * dt; s.y += s.vy * dt; s.life -= 0.015 * dt;
          const len = 90;
          const g = ctx.createLinearGradient(s.x, s.y, s.x - s.vx * len / 6, s.y - s.vy * len / 6);
          const col = cssVar('--shoot') || '#fff';
          g.addColorStop(0, col); g.addColorStop(1, 'transparent');
          ctx.globalAlpha = Math.max(0, s.life);
          ctx.strokeStyle = g; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x - s.vx * len / 6, s.y - s.vy * len / 6); ctx.stroke();
          if (s.life <= 0 || s.x > W + 60 || s.y > H + 60) shooting.splice(i, 1);
        }
      } else {
        for (const p of particles) {
          p.phase += 0.01 * dt;
          p.rot += p.rots * dt;
          p.y += p.vy * dt;
          p.x += (Math.sin(p.phase) * p.sway - mx * 26 * p.depth) * 0.3 * dt;
          if (p.y > H + 14) { p.y = -14; p.x = Math.random() * W; }
          if (p.x < -20) p.x = W + 20; else if (p.x > W + 20) p.x = -20;
          petal(p, 0, -my * 18 * p.depth);
        }
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(frame);
    }

    function start() {
      if (raf) cancelAnimationFrame(raf);
      if (reduce) { drawStatic(); return; }
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }

    // interactions
    window.addEventListener('pointermove', (e) => {
      mouse.tx = e.clientX / window.innerWidth;
      mouse.ty = e.clientY / window.innerHeight;
    }, { passive: true });

    let rt;
    window.addEventListener('resize', () => {
      clearTimeout(rt);
      rt = setTimeout(() => { resize(); build(); if (reduce) drawStatic(); }, 150);
    });

    resize(); build(); start();

    return {
      rebuild() { build(); if (reduce) drawStatic(); }
    };
  })();
});