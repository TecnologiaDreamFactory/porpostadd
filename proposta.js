/* ============================================================
   dream data — main.js
   Lenis (scroll) + GSAP/ScrollTrigger (cena). Sem build.
   Cada modulo roda so se o seletor dele existir: dá para remover ou
   duplicar secoes no HTML sem mexer aqui.
   ============================================================ */

/* todo reload comeca no topo (link com #ancora e respeitado) */
function travaNoTopo() { if (!location.hash) scrollTo(0, 0); }
travaNoTopo();
addEventListener('load', travaNoTopo);
addEventListener('pageshow', e => { if (e.persisted) travaNoTopo(); });

/* tema: fora do boot, funciona mesmo se as libs nao carregarem */
const btnTema = document.getElementById('tema');
if (btnTema) {
  const raiz = document.documentElement;
  const escuro = () => raiz.dataset.theme === 'dark';
  const sincroniza = () => {
    btnTema.setAttribute('aria-pressed', String(escuro()));
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', escuro() ? '#0b0c10' : '#ffffff');
  };
  sincroniza();
  btnTema.addEventListener('click', () => {
    const novo = escuro() ? 'light' : 'dark';
    raiz.classList.add('sem-transicao');
    raiz.dataset.theme = novo;
    void raiz.offsetHeight;   // aplica o tema sem transicao, tudo no mesmo quadro
    raiz.classList.remove('sem-transicao');
    try { localStorage.setItem('dd-tema', novo); } catch (e) {}
    sincroniza();
  });
}

if (!window.gsap || !window.ScrollTrigger || !window.Lenis) document.documentElement.classList.replace('carregando', 'no-fx');
else boot();

function boot() {

const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const clamp = gsap.utils.clamp;
gsap.registerPlugin(ScrollTrigger);
document.documentElement.classList.add('fx');

/* ---------- Lenis ---------- */
let lenis = null;
if (!REDUCED) {
  lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.95, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  if (!location.hash) lenis.scrollTo(0, { immediate: true });
  gsap.ticker.add(t => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
const goTo = target => {
  if (lenis) lenis.scrollTo(target, { offset: -70 });
  else $(target)?.scrollIntoView({ behavior: 'smooth' });
};
$$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
  const id = a.getAttribute('href');
  if (id.length < 2) return;
  e.preventDefault();
  closeMenu();
  goTo(id);
}));

/* ---------- menu mobile ---------- */
const burger = $('#burger');
const menu = $('#menu');
$$('a', menu).forEach((a, i) => a.style.setProperty('--i', i));
function setMenu(open) {
  menu.classList.toggle('is-open', open);
  menu.toggleAttribute('inert', !open);
  burger.setAttribute('aria-expanded', String(open));
  burger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  document.body.classList.toggle('is-locked', open);
  if (lenis) open ? lenis.stop() : lenis.start();
}
const closeMenu = () => setMenu(false);
burger.addEventListener('click', () => setMenu(!menu.classList.contains('is-open')));
addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });

/* ---------- nav: cola, some ao descer, fica clara sobre faixa escura ---------- */
const nav = $('#nav');
const progBar = $('#progBar');
ScrollTrigger.create({
  start: 0, end: 'max',
  onUpdate: self => {
    nav.classList.toggle('is-stuck', self.scroll() > 70);
    nav.classList.toggle('is-hidden', self.direction === 1 && self.scroll() > 400 && !menu.classList.contains('is-open'));
    progBar.style.transform = `scaleX(${self.progress.toFixed(4)})`;
  }
});
const escuras = new Set();
$$('[data-dark]').forEach(sec => ScrollTrigger.create({
  trigger: sec, start: 'top 40px', end: 'bottom 40px',
  onToggle: self => {
    self.isActive ? escuras.add(sec) : escuras.delete(sec);
    nav.classList.toggle('is-dark', escuras.size > 0);
  }
}));

/* ---------- capitulo atual (indicador fixo + link ativo no nav) ---------- */
const chap = $('#chap'), chapN = $('#chapN'), chapT = $('#chapT');
$$('[data-chap]').forEach(sec => {
  const [n, t] = sec.dataset.chap.split('|');
  ScrollTrigger.create({
    trigger: sec, start: 'top 50%', end: 'bottom 50%',
    onToggle: self => {
      if (!self.isActive) return;
      chapN.textContent = n; chapT.textContent = t;
      chap.classList.toggle('is-on', n !== '00');
      chap.classList.toggle('is-ink', sec.classList.contains('cta'));
      $$('.nav__links a').forEach(a => a.classList.toggle('is-on', a.getAttribute('href') === '#' + sec.id));
    }
  });
});

/* ---------- titulos: mascara por palavra ----------
   Texto solto vira palavras; dentro de .g cada palavra leva o .g para o <i>
   (o background-clip so recorta texto filho direto). */
function split(el) {
  const frag = document.createDocumentFragment();
  const words = (text, cls) => text.split(/\s+/).filter(Boolean).forEach(w => {
    const s = document.createElement('span'); s.className = 'w';
    const i = document.createElement('i'); if (cls) i.className = cls;
    i.textContent = w; s.append(i);
    frag.append(s, ' ');
  });
  el.childNodes.forEach(n => {
    if (n.nodeType === 3) words(n.textContent);
    else if (n.nodeName === 'BR') frag.append(n.cloneNode());
    else words(n.textContent, n.className);
  });
  el.replaceChildren(frag);
  return $$('.w > i', el);
}
const titulos = $$('.big, [data-split]');
const palavras = new Map(titulos.map(t => [t, split(t)]));
if (!REDUCED) {
  titulos.filter(t => !t.classList.contains('hero__title')).forEach(t => {
    gsap.set(palavras.get(t), { yPercent: 115 });
    ScrollTrigger.create({
      trigger: t, start: 'top 88%', once: true,
      onEnter: () => gsap.to(palavras.get(t), { yPercent: 0, duration: 1.05, stagger: 0.045, ease: 'power3.out' })
    });
  });
}

const NS = 'http://www.w3.org/2000/svg';
const mk = (tag, attrs, parent) => {
  const el = document.createElementNS(NS, tag);
  for (const k in attrs) el.setAttribute(k, attrs[k]);
  parent?.append(el);
  return el;
};

/* ---------- hero: campo de pontos ----------
   A marca e um halftone: pontos numa grade hexagonal, so os que caem dentro da
   geometria do mark.svg. A foto entra por dentro dos pontos com source-atop
   (nao le pixels, entao funciona ate abrindo o arquivo direto, em file://).
   Entrada: os pontos saem do centro e giram em espiral ate o lugar.
   Mouse: lupa (os pontos crescem e a foto aparece). Scroll: dispersam. */
const field = $('#field');
const caixa = $('#heroMark');
const campo = { ent: REDUCED ? 1 : 0, ping: REDUCED ? 1 : 0, out: 0 };   // entrada da marca, onda da grade, saida no scroll
campo.centro = () => {   // centro do disco da marca (x50 y47 no viewBox), na tela
  const r = caixa.getBoundingClientRect();
  return [r.left + r.width * .5, r.top + r.width * .47];
};
if (field && caixa) {
  const ctx = field.getContext('2d');
  const hero = field.parentElement;
  const foto = $('#fieldImg');
  const TAU = Math.PI * 2;
  const saiDe = gsap.parseEase('expo.out'), dispersa = gsap.parseEase('power2.in');
  let W = 0, H = 0, ox, oy, M, cx, cy, passo, maxD, grade = [], marca = [], tinta, cor = '#0d0e12', visivel = true;
  const mouse = { x: -1e4, y: -1e4, tx: -1e4, ty: -1e4 };

  // geometria do mark.svg (viewBox 100): disco com 3 furos ligados por tracos + ponto solto
  const seg = (u, v, ax, ay, bx, by) => {
    const dx = bx - ax, dy = by - ay;
    const t = clamp(0, 1, ((u - ax) * dx + (v - ay) * dy) / (dx * dx + dy * dy));
    return Math.hypot(u - ax - t * dx, v - ay - t * dy);
  };
  const naMarca = (u, v, folga) => {
    if (Math.hypot(u - 87, v - 88) <= 5.5) return true;
    if (Math.hypot(u - 50, v - 47) > 39) return false;
    const f = 1.3 + folga;
    return Math.hypot(u - 35, v - 38) > 14 + f && Math.hypot(u - 79, v - 43) > 7 + f && Math.hypot(u - 60, v - 71) > 10 + f
      && seg(u, v, 35, 38, 79, 43) > f && seg(u, v, 35, 38, 60, 71) > f;
  };

  const leCor = () => { cor = getComputedStyle(document.documentElement).getPropertyValue('--ink').trim() || cor; };

  function monta() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const h = hero.getBoundingClientRect(), r = caixa.getBoundingClientRect();
    W = h.width; H = h.height;
    field.width = Math.round(W * dpr); field.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    M = r.width; ox = r.left - h.left; oy = r.top - h.top;
    cx = ox + M * .5; cy = oy + M * .47;
    leCor();
    tinta = ctx.createLinearGradient(ox, oy, ox + M, oy + M);
    tinta.addColorStop(0, '#00c2ff'); tinta.addColorStop(1, '#0047ff');

    // marca: grade hexagonal fina; os furos ganham folga para ler bem em pontos
    passo = Math.max(4.5, M / 54);
    const pu = passo / M * 100, dy = passo * .866;
    marca = [];
    for (let j = 0, y = oy; y < oy + M; j++, y += dy) {
      for (let x = ox + (j % 2) * passo / 2; x < ox + M; x += passo) {
        if (!naMarca((x - ox) / M * 100, (y - oy) / M * 100, pu * .12)) continue;
        const d = Math.hypot(x - cx, y - cy);
        marca.push({ d, a: Math.atan2(y - cy, x - cx), giro: 1.6 + Math.random() * 1.1, atraso: d / M * .5 + Math.random() * .1, fase: Math.random() * TAU });
      }
    }
    // fundo: grade larga, com um respiro em volta da marca
    const pg = clamp(18, 30, W / 52), sx = ox + M * .87, sy = oy + M * .88;
    grade = [];
    for (let y = pg / 2; y < H; y += pg) {
      for (let x = pg / 2; x < W; x += pg) {
        const d = Math.hypot(x - cx, y - cy);
        if (d < M * .45 || Math.hypot(x - sx, y - sy) < M * .1) continue;
        grade.push({ x, y, d });
      }
    }
    maxD = Math.hypot(Math.max(cx, W - cx), Math.max(cy, H - cy));
    if (REDUCED) desenha(0);
  }

  function desenha(t) {
    mouse.x += (mouse.tx - mouse.x) * .18; mouse.y += (mouse.ty - mouse.y) * .18;
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, W, H);
    const sai = dispersa(campo.out), lupaR = M * .2;

    // 1. pontos da marca (um path so) -> foto por dentro deles
    ctx.beginPath();
    for (const p of marca) {
      const k = clamp(0, 1, (campo.ent - p.atraso) / .55);
      if (k <= 0) continue;
      const e = saiDe(k);
      const ang = p.a - (1 - e) * p.giro + sai * p.giro * .6;
      const dist = p.d * e * (1 + sai * .9);
      const x = cx + Math.cos(ang) * dist, y = cy + Math.sin(ang) * dist;
      const lp = Math.max(0, 1 - Math.hypot(x - mouse.x, y - mouse.y) / lupaR);
      const pulso = REDUCED ? 1 : 1 + Math.sin(t * 1.6 - p.d * .035 + p.fase * .3) * .08;
      const r = passo * .4 * Math.min(1, k * 2.5) * pulso * (1 + lp * lp * 1.05) * (1 - sai * .7);
      if (r <= .1) continue;
      ctx.moveTo(x + r, y);
      ctx.arc(x, y, r, 0, TAU);
    }
    ctx.globalAlpha = Math.max(0, 1 - sai * 1.4);   // some antes de chegar no titulo
    ctx.fillStyle = tinta;
    ctx.fill();
    if (foto.complete && foto.naturalWidth) {
      // foto por dentro dos pontos e, por cima, de novo o gradiente: a marca fica azul e a foto aparece nas luzes
      ctx.globalCompositeOperation = 'source-atop';
      const s = M * 1.06, px = mouse.x > -1e3 ? (mouse.x - cx) * -.03 : 0;
      ctx.globalAlpha = .62;
      ctx.drawImage(foto, ox - (s - M) / 2 + px, oy - (s - M) / 2, s, s);
      ctx.globalAlpha = .34;
      ctx.fillStyle = tinta;
      ctx.fillRect(0, 0, W, H);
      // lupa: dentro do raio do mouse a foto volta sem tinta (dois aneis para a borda nao cortar seco)
      if (mouse.x > -1e3) {
        ctx.globalAlpha = .5;
        for (const f of [1, .62]) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(mouse.x, mouse.y, lupaR * f, 0, TAU);
          ctx.clip();
          ctx.drawImage(foto, ox - (s - M) / 2 + px, oy - (s - M) / 2, s, s);
          ctx.restore();
        }
      }
    }

    // 2. grade do fundo: onda que sai da marca + brilho perto do mouse
    ctx.globalCompositeOperation = 'source-over';
    const frente = campo.ping * (maxD + 120), fade = 1 - campo.out;
    const quentes = [];
    ctx.beginPath();
    for (const g of grade) {
      if (g.d > frente) continue;
      const onda = Math.exp(-(((g.d - frente) / 70) ** 2)) * (1 - campo.ping);
      const perto = Math.max(0, 1 - Math.hypot(g.x - mouse.x, g.y - mouse.y) / 170);
      if (onda + perto > .15) { quentes.push(g, 1 + onda * 2.4 + perto * 1.6); continue; }
      ctx.moveTo(g.x + 1.1, g.y);
      ctx.arc(g.x, g.y, 1.1, 0, TAU);
    }
    ctx.globalAlpha = .18 * fade;
    ctx.fillStyle = cor;
    ctx.fill();
    ctx.beginPath();
    for (let i = 0; i < quentes.length; i += 2) {
      const g = quentes[i], r = 1.1 * quentes[i + 1];
      ctx.moveTo(g.x + r, g.y);
      ctx.arc(g.x, g.y, r, 0, TAU);
    }
    ctx.globalAlpha = .9 * fade;
    ctx.fillStyle = '#0099ef';
    ctx.fill();
  }

  monta();
  ScrollTrigger.addEventListener('refresh', monta);
  foto.decode?.().then(() => REDUCED && desenha(0)).catch(() => {});
  new MutationObserver(() => { leCor(); if (REDUCED) desenha(0); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  if (!REDUCED) {
    ScrollTrigger.create({ trigger: hero, start: 'top bottom', end: 'bottom top', onToggle: s => { visivel = s.isActive; } });
    gsap.ticker.add(t => { if (visivel) desenha(t); });
    gsap.to(campo, { out: 1, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
    if (matchMedia('(pointer: fine)').matches) {
      hero.addEventListener('pointermove', e => { const h = hero.getBoundingClientRect(); mouse.tx = e.clientX - h.left; mouse.ty = e.clientY - h.top; });
      hero.addEventListener('pointerleave', () => { mouse.tx = mouse.ty = -1e4; });
    }
  }
}

/* ---------- intro do hero ----------
   Titulo: um bloco em gradiente varre cada palavra e a deixa no lugar.
   Barra de baixo: a linha abre do centro e os textos entram por recorte. */
const heroW = $$('.hero__title .w');
const heroI = $$('.hero__title .w > i');
const barra = $$('.hero__bar > *');
const intro = gsap.timeline({ paused: true });
if (!REDUCED) {
  gsap.set(heroI, { opacity: 0 });
  gsap.set(barra, { clipPath: 'inset(0 100% 0 0)' });
  gsap.set('.hero__bar', { '--k': 0 });
  intro
    .to(campo, { ent: 1, duration: 2.6, ease: 'none' }, 0)          // a curva fica por ponto, no desenho
    .to(campo, { ping: 1, duration: 2.4, ease: 'power1.out' }, .2)
    .to(heroW, { '--r': 1, duration: .42, stagger: .07, ease: 'power3.inOut' }, .7)
    .to(heroI, { opacity: 1, duration: .01, stagger: .07 }, 1.12)
    .to(heroW, { '--l': 1, duration: .42, stagger: .07, ease: 'power3.inOut' }, 1.12)
    .to('.hero__bar', { '--k': 1, duration: 1.1, ease: 'expo.inOut' }, 1.3)
    .to(barra, { clipPath: 'inset(0 0% 0 0)', duration: .9, stagger: .12, ease: 'power3.inOut' }, 1.5);
}

/* ---------- loader: contador + iris que fecha no centro da marca ---------- */
const loader = $('#loader');
const libera = () => { document.documentElement.classList.remove('carregando'); lenis?.start(); };
if (REDUCED) {
  loader.remove();
  libera();
} else {
  lenis?.stop();   // a roda do mouse nao rola a pagina por tras do loader
  const num = $('#loaderN', loader);
  const prog = { v: 0, done: 0 };
  const pinta = () => { num.textContent = Math.round(prog.v * 100); };
  const heroImg = $('#fieldImg');
  const tarefas = [
    document.fonts ? document.fonts.ready : Promise.resolve(),
    heroImg?.decode ? heroImg.decode().catch(() => {}) : Promise.resolve()   // imagem quebrada nao prende ninguem
  ];
  tarefas.forEach(t => t.then(() => {
    prog.done++;
    gsap.to(prog, { v: prog.done / tarefas.length * .9, duration: .5, ease: 'power2.out', onUpdate: pinta });
  }));
  const minimo = new Promise(r => setTimeout(r, 700));
  const teto = new Promise(r => setTimeout(r, 6000));
  Promise.race([Promise.all([...tarefas, minimo]), teto]).then(() => {
    ScrollTrigger.refresh();   // a fonte carregada muda o layout: marca e centro da iris se recalculam
    const [x, y] = campo.centro();
    const R = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    gsap.timeline()
      .to(prog, { v: 1, duration: .35, ease: 'power2.out', onUpdate: pinta })
      .to('.loader__t, .loader__n', { opacity: 0, y: -14, duration: .3, stagger: .05, ease: 'power2.in' })
      .fromTo(loader, { clipPath: `circle(${R}px at ${x}px ${y}px)` },
        { clipPath: `circle(0px at ${x}px ${y}px)`, duration: 1.05, ease: 'expo.inOut', onComplete: () => { loader.remove(); libera(); ScrollTrigger.refresh(); } }, '-=.05')   // a barra de rolagem volta: recalcula
      .add(() => intro.play(), '-=.22');
  });
}

/* ---------- reveals ---------- */
ScrollTrigger.batch('.reveal', {
  start: 'top 88%',
  onEnter: els => gsap.to(els, { opacity: 1, y: 0, duration: .85, stagger: .08, ease: 'power3.out' })
});

/* ---------- contadores (formato pt-BR) ---------- */
$$('[data-count]').forEach(el => {
  const alvo = Number(el.dataset.count);
  const dec = Number(el.dataset.dec || 0);
  const fmt = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  const pre = el.dataset.prefix || '', suf = el.dataset.suffix || '';
  const pinta = v => { el.textContent = pre + fmt.format(v) + suf; };
  if (REDUCED) return pinta(alvo);
  const o = { v: 0 };
  pinta(0);
  ScrollTrigger.create({
    trigger: el, start: 'top 92%', once: true,
    onEnter: () => gsap.to(o, { v: alvo, duration: 1.8, ease: 'power2.out', onUpdate: () => pinta(dec ? o.v : Math.round(o.v)) })
  });
});

/* ---------- fluxo da ia: a linha da esquerda vai ate o fim do titulo da coluna ---------- */
const aiCore = $('.ai__core'), aiH3 = $('.ai__col h3');
if (aiCore && aiH3) {
  const mede = () => aiCore.style.setProperty('--fio', Math.max(0, aiCore.getBoundingClientRect().left - 10 - aiH3.getBoundingClientRect().right - 6) + 'px');
  mede();
  ScrollTrigger.addEventListener('refresh', mede);
}

/* ---------- barras crescem ao entrar (a animacao e do CSS) ---------- */
ScrollTrigger.batch('[data-bars]', { start: 'top 85%', onEnter: els => els.forEach(e => e.classList.add('is-in')) });

/* ---------- diagramas de ligacoes ----------
   Arestas lidas da lista .rels (data-a, data-b, data-r). As linhas sao
   recalculadas a cada refresh do ScrollTrigger, entao acompanham qualquer
   largura. p (0..1) desenha uma aresta apos a outra. */
function graph(root) {
  const svg = $('.wires', root);
  const node = id => $(`[data-node="${id}"]`, root);
  const edges = $$('.rels li', root).map(li => ({
    a: node(li.dataset.a), b: node(li.dataset.b), r: li.dataset.r || 'h',
    hot: li.hasAttribute('data-hot'),
    label: li.dataset.label ?? $('b', li)?.textContent ?? '',
    ids: [li.dataset.a, li.dataset.b]
  }));
  let p = 0, built = [];

  function route(A, B, r) {
    if (r === 'top') {
      const y = Math.min(A.t, B.t) - 24;
      return [[A.cx, A.t], [A.cx, y], [B.cx, y], [B.cx, B.t]];
    }
    if (r === 'v') {
      const down = A.cy <= B.cy;
      const sy = down ? A.b : A.t, ey = down ? B.t : B.b, my = (sy + ey) / 2;
      return [[A.cx, sy], [A.cx, my], [B.cx, my], [B.cx, ey]];
    }
    const ltr = A.cx <= B.cx;
    const sx = ltr ? A.r : A.l, ex = ltr ? B.l : B.r, mx = (sx + ex) / 2;
    return [[sx, A.cy], [mx, A.cy], [mx, B.cy], [ex, B.cy]];
  }

  function build() {
    svg.replaceChildren();
    built = [];
    if (!svg.getClientRects().length) return;          // escondido nesta largura
    // posicao de layout (offsets), nao getBoundingClientRect: os nos podem
    // estar no meio de uma animacao de escala/deslocamento e o desenho entortaria
    const rel = el => {
      let x = 0, y = 0, n = el;
      while (n && n !== root) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; }
      const o = { l: x, t: y, r: x + el.offsetWidth, b: y + el.offsetHeight };
      o.cx = (o.l + o.r) / 2; o.cy = (o.t + o.b) / 2;
      return o;
    };
    edges.forEach(e => {
      if (!e.a || !e.b) return;
      const pts = route(rel(e.a), rel(e.b), e.r);
      const d = 'M' + pts.map(q => q.map(n => n.toFixed(1)).join(' ')).join('L');
      const base = mk('path', { d, class: e.hot ? 'hot' : '' }, svg);
      const flow = mk('path', { d, class: 'flow' }, svg);
      let lbl = null, bg = null;
      if (e.label) {
        const [x1, y1] = pts[1], [x2, y2] = pts[2];
        bg = mk('rect', { class: 'lbl-bg', rx: 6 }, svg);
        lbl = mk('text', { x: (x1 + x2) / 2, y: (y1 + y2) / 2 + 4 }, svg);
        lbl.textContent = e.label;
        const bb = lbl.getBBox();
        Object.entries({ x: bb.x - 8, y: bb.y - 4, width: bb.width + 16, height: bb.height + 8 }).forEach(([k, v]) => bg.setAttribute(k, v));
      }
      built.push({ e, base, flow, lbl, bg, len: base.getTotalLength() });
    });
    render();
  }

  function render() {
    const s = .55, total = (built.length - 1) * s + 1, t = p * total;
    built.forEach((b, i) => {
      const k = clamp(0, 1, t - i * s);
      b.base.style.strokeDasharray = b.len;
      b.base.style.strokeDashoffset = b.len * (1 - k);
      b.flow.classList.toggle('is-on', k >= 1);
      b.lbl?.classList.toggle('is-on', k > .85);
      b.bg?.classList.toggle('is-on', k > .85);
    });
  }

  // passar o mouse num no acende as ligacoes dele
  $$('[data-node]', root).forEach(n => {
    const id = n.dataset.node;
    const lit = on => built.forEach(b => {
      if (!b.e.ids.includes(id)) return;
      b.base.classList.toggle('lit', on);
      b.e.ids.forEach(o => o !== id && node(o)?.classList.toggle('is-lit', on));
    });
    n.addEventListener('mouseenter', () => lit(true));
    n.addEventListener('mouseleave', () => lit(false));
  });

  return { build, set(v) { p = v; render(); } };
}

const grafos = new Map($$('[data-graph]').map(r => [r, graph(r)]));
const montaGrafos = () => grafos.forEach(g => g.build());
ScrollTrigger.addEventListener('refresh', montaGrafos);
document.fonts?.ready.then(montaGrafos);

const whoGraph = $('#whoGraph');
grafos.forEach((g, root) => {
  if (REDUCED) return g.set(1);
  if (root === whoGraph) return;          // o de pessoas e guiado pelo pin abaixo
  ScrollTrigger.create({
    trigger: root, start: 'top 85%', end: 'center center', scrub: true,   // termina com o diagrama no meio da tela
    onUpdate: self => g.set(self.progress)
  });
});

/* pessoas: no desktop a secao trava e a identidade se monta */
const mm = gsap.matchMedia();
if (whoGraph && !REDUCED) {
  const g = grafos.get(whoGraph);
  const pin = $('#whoPin');
  const partes = ['.core', '.role--a', '.role--b', '.role--c'].map(s => $(s, whoGraph));
  mm.add('(min-width: 901px)', () => {
    gsap.set(partes, { opacity: 0, y: 30 });
    gsap.set(partes[0], { scale: .7 });
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: pin, pin: true, scrub: .6, anticipatePin: 1, invalidateOnRefresh: true,
        refreshPriority: 1,   // pins medem primeiro: os gatilhos criados antes deles contam o espaco do pin
        start: () => pin.offsetHeight > innerHeight ? 'bottom bottom' : 'center center',
        end: '+=110%',
        onUpdate: self => g.set(clamp(0, 1, (self.progress - .2) / .7))
      }
    })
      .to(partes[0], { opacity: 1, y: 0, scale: 1, duration: .25 }, 0)
      .to(partes.slice(1), { opacity: 1, y: 0, duration: .2, stagger: .22 }, .25)
      .to({}, { duration: .2 });
    return () => tl.kill();
  });
  mm.add('(max-width: 900px)', () => {
    const tw = gsap.from(partes, { opacity: 0, y: 30, stagger: .12, duration: .8, ease: 'power3.out', scrollTrigger: { trigger: whoGraph, start: 'top 80%', once: true } });
    return () => tw.kill();
  });
}

/* ---------- etapas: trilho que enche e etapas que acendem ---------- */
$$('[data-steps]').forEach(el => {
  const passos = $$('.step', el);
  const pinta = p => {
    el.style.setProperty('--p', p.toFixed(3));
    passos.forEach((s, i) => s.classList.toggle('is-on', p >= i / Math.max(1, passos.length - 1) - .02));
  };
  if (REDUCED) return pinta(1);
  pinta(0);
  ScrollTrigger.create({ trigger: el, start: 'top 72%', end: 'bottom 62%', scrub: .5, onUpdate: s => pinta(s.progress) });
});

/* ---------- arquitetura: scroll horizontal (desktop) ---------- */
const archPin = $('#archPin');
if (archPin) {
  const track = $('#archTrack'), fill = $('#archFill'), dot = $('#archDot');
  const mods = $$('.mod', track);
  mm.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', () => {
    gsap.set(track, { width: 'max-content' });
    const dist = () => Math.max(0, track.scrollWidth - innerWidth);
    const tw = gsap.to(track, {
      x: () => -dist(), ease: 'none',
      scrollTrigger: {
        trigger: archPin, pin: true, scrub: .8, start: 'top top', end: () => '+=' + dist(),
        invalidateOnRefresh: true, anticipatePin: 1, refreshPriority: 1,
        onUpdate: self => {
          // o ponto fica parado a 40% da tela; o trilho corre por baixo dele
          const pad = parseFloat(getComputedStyle(track).paddingLeft);
          const railW = track.scrollWidth - pad * 2;
          const x = clamp(0, railW, innerWidth * .4 + dist() * self.progress - pad);
          fill.style.width = x + 'px';
          dot.style.transform = `translateX(${x}px)`;
          mods.forEach(m => m.classList.toggle('is-on', m.offsetLeft - pad < x));
        }
      }
    });
    return () => { tw.kill(); gsap.set(track, { clearProps: 'all' }); };
  });
  mm.add('(max-width: 1023px), (prefers-reduced-motion: reduce)', () => {
    const sts = mods.map(m => ScrollTrigger.create({ trigger: m, start: 'top 65%', end: 'bottom 35%', toggleClass: 'is-on' }));
    return () => sts.forEach(s => s.kill());
  });
}

/* ---------- produto: o painel se endireita em 3D com o scroll ---------- */
if ($('#dash') && !REDUCED) {
  gsap.fromTo('#dash',
    { rotateX: 30, scale: .86, y: 40, opacity: .4 },
    { rotateX: 0, scale: 1, y: 0, opacity: 1, ease: 'none',
      scrollTrigger: { trigger: '.proto__stage', start: 'top 95%', end: 'top 22%', scrub: 1 } });
}

/* ---------- ia: sugestao estruturada sendo "digitada" ---------- */
const term = $('#term');
if (term) {
  const exemplos = [
    { pergunta: 'Qual marca de tênis você usa?', conceito: 'uso_declarado_marca', contexto: 'formulário de inscrição · corrida', justificativa: 'verbo no presente indica uso atual, não intenção', revisao: 'pendente' },
    { pergunta: 'Qual marca pretende comprar?', conceito: 'intencao_compra_marca', contexto: 'formulário de inscrição · corrida', justificativa: '"pretende" indica intenção futura de compra', revisao: 'pendente' }
  ];
  // segmentos [classe, texto]: digitar respeitando o realce de sintaxe
  const segs = o => {
    const out = [['', '{\n']];
    const ks = Object.keys(o);
    ks.forEach((k, i) => out.push(['', '  '], ['k', JSON.stringify(k)], ['', ': '], ['s', JSON.stringify(o[k])], ['', (i < ks.length - 1 ? ',' : '') + '\n']));
    out.push(['', '}']);
    return out;
  };
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const pinta = (sg, n) => {
    let h = '';
    for (const [c, t] of sg) {
      if (n <= 0) break;
      const parte = esc(t.slice(0, n)); n -= t.length;
      h += c ? `<span class="${c}">${parte}</span>` : parte;
    }
    term.innerHTML = h;
  };
  const qs = $$('.q');
  const foco = i => qs.forEach(q => q.classList.toggle('is-on', Number(q.dataset.q) === i));
  const tl = gsap.timeline({ repeat: -1, paused: true });
  exemplos.forEach((ex, i) => {
    const sg = segs(ex), total = sg.reduce((a, [, t]) => a + t.length, 0), o = { n: 0 };
    tl.add(() => { foco(i); o.n = 0; pinta(sg, 0); })
      .to(o, { n: total, duration: total / 55, ease: 'none', onUpdate: () => pinta(sg, Math.round(o.n)) })
      .to({}, { duration: 2.4 });
  });
  if (REDUCED) { foco(0); pinta(segs(exemplos[0]), 1e9); }
  else ScrollTrigger.create({ trigger: term, start: 'top 90%', end: 'bottom top', onToggle: s => s.isActive ? tl.play() : tl.pause() });
}

/* frase que acende palavra a palavra */
$$('[data-words]').forEach(el => {
  el.innerHTML = el.textContent.trim().split(/\s+/).map(w => `<span class="wd">${w}</span>`).join(' ');
  if (REDUCED) return;
  gsap.to($$('.wd', el), { opacity: 1, stagger: .1, ease: 'none', scrollTrigger: { trigger: el, start: 'top 85%', end: 'bottom 50%', scrub: true } });
});

/* ---------- novos usos: a foto abre e desliza ---------- */
const usesImg = $('#usesImg');
if (usesImg && !REDUCED) {
  gsap.fromTo(usesImg, { clipPath: 'inset(14% 12% 14% 12% round 28px)' },
    { clipPath: 'inset(0% 0% 0% 0% round 28px)', ease: 'none', scrollTrigger: { trigger: '.uses', start: 'top 80%', end: 'top 10%', scrub: .8 } });
  gsap.fromTo($('img', usesImg), { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: '.uses', start: 'top bottom', end: 'bottom top', scrub: 1 } });
}

/* ---------- fluxo: esteiras infinitas em sentidos opostos, reagem ao scroll ---------- */
$$('.flux__track').forEach(track => {
  const unit = track.firstElementChild;
  const alvo = Math.max(innerWidth, screen.width || 0) * 1.15;
  let guarda = 24;   // ponytail: teto de copias, so protege de largura 0
  while (track.scrollWidth - unit.offsetWidth < alvo && guarda--) track.append(unit.cloneNode(true));
  const volta = track.hasAttribute('data-rev');
  const tw = gsap.fromTo($$(':scope > span', track), { xPercent: volta ? -100 : 0 },
    { xPercent: volta ? 0 : -100, repeat: -1, ease: 'none', duration: Math.max(10, unit.offsetWidth / 70) });
  if (REDUCED) tw.pause();
  else if (lenis) gsap.ticker.add(() => tw.timeScale(clamp(-6, 6, 1 + (lenis.velocity || 0) * 0.12)));
});

/* ---------- integracoes: a cor entra e sai pelo ponto do mouse ---------- */
$$('.api li').forEach(li => {
  const origem = e => {
    const r = li.getBoundingClientRect();
    li.style.setProperty('--x', (e.clientX - r.left) + 'px');
    li.style.setProperty('--y', (e.clientY - r.top) + 'px');
  };
  li.addEventListener('pointerenter', origem);
  li.addEventListener('pointerleave', origem);
});

/* ---------- cursor ponto + anel + magnetismo (ponteiro fino) ---------- */
if (matchMedia('(hover: hover) and (pointer: fine)').matches && !REDUCED) {
  const raiz = document.documentElement;
  const mira = $('.cur'), ponto = $('.cur-dot');
  raiz.classList.add('has-cur');
  let mx = innerWidth / 2, my = innerHeight / 2, ax = mx, ay = my;
  addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; raiz.classList.add('cur-on'); });
  addEventListener('mouseout', e => { if (!e.relatedTarget) raiz.classList.remove('cur-on'); });
  addEventListener('mousedown', () => raiz.classList.add('cur-down'));
  addEventListener('mouseup', () => raiz.classList.remove('cur-down'));
  gsap.ticker.add(() => {
    ax += (mx - ax) * .2; ay += (my - ay) * .2;
    mira.style.transform = `translate(${ax.toFixed(1)}px,${ay.toFixed(1)}px)`;
    ponto.style.transform = `translate(${mx}px,${my}px)`;
  });
  // delegado: closest pega o clicavel mais interno, entao link dentro de card funciona
  // cur-light: branco sobre fundo azul (contato e linha de integracao pintada)
  addEventListener('mouseover', e => {
    const t = e.target.closest ? e.target : document.body;
    raiz.classList.toggle('cur-lock', !!t.closest('a, button, [data-magnet], [data-node], .bar'));
    raiz.classList.toggle('cur-light', !!t.closest('.cta, .api li'));
  });
  $$('[data-magnet]').forEach(el => {
    const qx = gsap.quickTo(el, 'x', { duration: .5, ease: 'power3' });
    const qy = gsap.quickTo(el, 'y', { duration: .5, ease: 'power3' });
    el.addEventListener('mousemove', e => {
      const r = el.getBoundingClientRect();
      qx((e.clientX - r.left - r.width / 2) * .25);
      qy((e.clientY - r.top - r.height / 2) * .4);
    });
    el.addEventListener('mouseleave', () => { qx(0); qy(0); });
  });
}

travaNoTopo();
addEventListener('load', () => ScrollTrigger.refresh());
}
