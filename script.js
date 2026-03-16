/* ================================================================
   科技感简历 · 交互脚本
   功能模块：
     1. 背景粒子网格（Canvas）
     2. 打字机效果（顶部 ID 栏）
     3. 实时时钟（底部）
     4. 数字滚动计数（亮点数据条）
     5. 滚动触发入场动画
     6. 联系方式点击复制 + Toast 提示
     7. 项目卡片鼠标跟随光晕
================================================================ */

/* ──────────────────────────────────────────────────────────────
   1. 背景粒子网格
   在 canvas 上绘制极坐标散点，线连近邻，营造"数字空间"感
────────────────────────────────────────────────────────────── */
function initParticles() {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W, H, particles;

  const PARTICLE_COUNT = 80;
  const MAX_DIST = 130;          // 连线最大距离
  const SPEED = 0.3;
  const COLOR = '0, 229, 255';   // CSS RGB 值，用于 rgba()

  // 单个粒子
  function Particle() {
    this.reset();
  }
  Particle.prototype.reset = function () {
    this.x  = Math.random() * W;
    this.y  = Math.random() * H;
    this.vx = (Math.random() - .5) * SPEED;
    this.vy = (Math.random() - .5) * SPEED;
    this.r  = Math.random() * 1.5 + .5;
    this.a  = Math.random() * .6 + .2;
  };
  Particle.prototype.update = function () {
    this.x += this.vx;
    this.y += this.vy;
    // 到达边界弹回
    if (this.x < 0 || this.x > W) this.vx *= -1;
    if (this.y < 0 || this.y > H) this.vy *= -1;
  };

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function init() {
    resize();
    particles = Array.from({ length: PARTICLE_COUNT }, () => new Particle());
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // 更新并绘制每个粒子
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.update();

      // 点
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${COLOR}, ${p.a})`;
      ctx.fill();

      // 连线：只连后面的粒子（避免重复绘制）
      for (let j = i + 1; j < particles.length; j++) {
        const q = particles[j];
        const dx = p.x - q.x;
        const dy = p.y - q.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < MAX_DIST) {
          const alpha = (1 - dist / MAX_DIST) * .25;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          ctx.strokeStyle = `rgba(${COLOR}, ${alpha})`;
          ctx.lineWidth = .5;
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(draw);
  }

  init();
  draw();
  window.addEventListener('resize', init);
}

/* ──────────────────────────────────────────────────────────────
   2. 打字机效果
   在 #typewriter 元素里逐字"打出"文本，打完后等待再重新打
────────────────────────────────────────────────────────────── */
function initTypewriter() {
  const el = document.getElementById('typewriter');
  if (!el) return;

  const lines = [
    'WANG_ZIHAN // HNU_CS_2022',
    'ROLE: FRONTEND_ENGINEER',
    'STATUS: SEEKING_OPPORTUNITY',
  ];

  let lineIdx = 0;
  let charIdx = 0;
  let deleting = false;
  const DELAY_TYPE   = 65;    // 打字间隔
  const DELAY_DELETE = 30;    // 删除间隔
  const DELAY_PAUSE  = 1800;  // 打完后暂停

  function tick() {
    const current = lines[lineIdx];

    if (!deleting) {
      // 打字阶段
      charIdx++;
      el.textContent = current.slice(0, charIdx);

      if (charIdx >= current.length) {
        // 打完，暂停后进入删除阶段
        deleting = true;
        setTimeout(tick, DELAY_PAUSE);
        return;
      }
      setTimeout(tick, DELAY_TYPE);
    } else {
      // 删除阶段
      charIdx--;
      el.textContent = current.slice(0, charIdx);

      if (charIdx <= 0) {
        // 删完，切换到下一行
        deleting = false;
        lineIdx  = (lineIdx + 1) % lines.length;
        setTimeout(tick, 300);
        return;
      }
      setTimeout(tick, DELAY_DELETE);
    }
  }

  setTimeout(tick, 800);
}

/* ──────────────────────────────────────────────────────────────
   3. 实时时钟
   每秒更新底部 #footer-time 的文本
────────────────────────────────────────────────────────────── */
function initClock() {
  const el = document.getElementById('footer-time');
  if (!el) return;

  function update() {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    el.textContent =
      `${now.getFullYear()}.${pad(now.getMonth()+1)}.${pad(now.getDate())} ` +
      `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  }

  update();
  setInterval(update, 1000);
}

/* ──────────────────────────────────────────────────────────────
   4. 数字滚动计数
   .hl-num 中的纯数字内容，进入视口时从 0 滚动到目标值
────────────────────────────────────────────────────────────── */
function initCounters() {
  const items = document.querySelectorAll('.hl-num');

  items.forEach((el) => {
    const original = el.textContent.trim();
    const num = parseInt(original, 10);
    if (isNaN(num)) return; // 跳过 "O(log n)" 这类非纯数字

    const observer = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting) return;
      observer.disconnect();

      const duration = 900;
      const start    = performance.now();

      function tick(now) {
        const t = Math.min((now - start) / duration, 1);
        // easeOutQuart
        const ease = 1 - Math.pow(1 - t, 4);
        el.textContent = Math.round(ease * num);
        if (t < 1) requestAnimationFrame(tick);
        else        el.textContent = original; // 还原（带 ↓ 等后缀）
      }

      requestAnimationFrame(tick);
    }, { threshold: .6 });

    observer.observe(el);
  });
}

/* ──────────────────────────────────────────────────────────────
   5. 滚动入场动画
   元素进入视口时添加 .visible，触发 CSS 过渡（额外的淡入上移）
   —— 注意：CSS 已用 animation，这里给本来 opacity:0 的元素补充支持
────────────────────────────────────────────────────────────── */
function initReveal() {
  const targets = document.querySelectorAll('.edu-card, .project-card, .about-card');

  const obs = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.style.opacity = '1';
        e.target.style.transform = 'translateY(0)';
        obs.unobserve(e.target);
      }
    });
  }, { threshold: .1 });

  targets.forEach((el) => {
    el.style.opacity    = '0';
    el.style.transform  = 'translateY(18px)';
    el.style.transition = 'opacity .5s ease, transform .5s ease';
    obs.observe(el);
  });
}

/* ──────────────────────────────────────────────────────────────
   6. 联系方式点击复制
   点击联系列表 .contact-item 自动复制可见文本并弹出 Toast
────────────────────────────────────────────────────────────── */
function initCopyContact() {
  document.querySelectorAll('.contact-item').forEach((item) => {
    item.addEventListener('click', async () => {
      // 提取文字（去掉 SVG 图标部分，只取 span / a 的文本）
      const texts = [...item.querySelectorAll('span, a')]
        .map((n) => n.textContent.trim())
        .filter(Boolean);
      const text = texts.join(' ');

      try {
        await navigator.clipboard.writeText(text);
        showToast(`已复制：${text}`);
      } catch {
        showToast('复制失败，请手动复制');
      }
    });
  });
}

/* ──────────────────────────────────────────────────────────────
   7. 项目卡片鼠标跟随光晕
   鼠标在卡片内移动时，产生以鼠标为中心的 radial-gradient 光晕
────────────────────────────────────────────────────────────── */
function initCardGlow() {
  document.querySelectorAll('.project-card').forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const { left, top } = card.getBoundingClientRect();
      const x = e.clientX - left;
      const y = e.clientY - top;
      card.style.background = `
        radial-gradient(400px circle at ${x}px ${y}px,
          rgba(0,229,255,.05) 0%,
          transparent 65%),
        var(--bg-card)
      `;
    });

    card.addEventListener('mouseleave', () => {
      card.style.background = '';
    });
  });
}

/* ──────────────────────────────────────────────────────────────
   工具：Toast 提示
────────────────────────────────────────────────────────────── */
function showToast(msg) {
  const old = document.getElementById('cv-toast');
  if (old) old.remove();

  const toast = document.createElement('div');
  toast.id = 'cv-toast';
  toast.textContent = msg;
  Object.assign(toast.style, {
    position:       'fixed',
    bottom:         '28px',
    left:           '50%',
    transform:      'translateX(-50%) translateY(14px)',
    background:     'rgba(7,13,26,.95)',
    border:         '1px solid rgba(0,229,255,.3)',
    color:          '#00e5ff',
    fontFamily:     'var(--font, monospace)',
    fontSize:       '12px',
    letterSpacing:  '1px',
    padding:        '10px 22px',
    borderRadius:   '2px',
    boxShadow:      '0 0 20px rgba(0,229,255,.15)',
    opacity:        '0',
    transition:     'opacity .25s, transform .25s',
    zIndex:         '9999',
    pointerEvents:  'none',
    whiteSpace:     'nowrap',
  });

  document.body.appendChild(toast);

  requestAnimationFrame(() => requestAnimationFrame(() => {
    toast.style.opacity   = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';
  }));

  setTimeout(() => {
    toast.style.opacity   = '0';
    toast.style.transform = 'translateX(-50%) translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 2400);
}

/* ──────────────────────────────────────────────────────────────
   初始化入口
────────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initParticles();
  initTypewriter();
  initClock();
  initCounters();
  initReveal();
  initCopyContact();
  initCardGlow();
});
