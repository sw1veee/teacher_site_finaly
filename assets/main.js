/* Footer year */
document.addEventListener('DOMContentLoaded', () => {
  const y = document.getElementById('y');
  if (y) y.textContent = new Date().getFullYear();
});

/* Encode media paths with spaces/ru */
(function encodeMediaPaths(){
  document.querySelectorAll('img[src]').forEach(img=>{
    const s=img.getAttribute('src');
    if(s && (/\s|[А-Яа-я]/.test(s))) img.src = encodeURI(s);
  });
  document.querySelectorAll('a[href]').forEach(a=>{
    const h=a.getAttribute('href');
    if(h && /\.(png|jpe?g|gif|webp)$/i.test(h) && (/\s|[А-Яа-я]/.test(h))) a.href = encodeURI(h);
  });
})();

/* ===== Smart-sticky navbar (fixed) ===== */
(() => {
  const nav = document.querySelector('.nav');
  if(!nav) return;
  let lastY = window.scrollY, state = 'pinned';

  const pin = ()=>{ nav.classList.remove('nav--hidden'); nav.classList.add('nav--pinned'); state='pinned'; };
  const hide= ()=>{ nav.classList.add('nav--hidden'); nav.classList.remove('nav--pinned'); state='hidden'; };

  pin(); // старт — закреплён

  const onScroll = () => {
    const y = window.scrollY;
    const dy = y - lastY;
    lastY = y;

    const atBottom = window.innerHeight + window.scrollY >= (document.documentElement.scrollHeight - 2);
    if (atBottom){ pin(); return; }

    const threshold = 8;
    if(Math.abs(dy) < threshold) return;

    if (y <= 10){ pin(); return; }

    if (dy > 0 && state !== 'hidden'){ hide(); }     // вниз
    else if (dy < 0 && state !== 'pinned'){ pin(); } // вверх
  };

  window.addEventListener('scroll', onScroll, {passive:true});
})();

/* ===== NAV underline + инертный активный пункт ===== */
(() => {
  const menu = document.getElementById('navmenu');
  const underline = document.querySelector('.menu-underline');
  if(!menu || !underline) return;

  const ids = ['about','methods','achievements','events','sertif','video','contacts'];
  const secs = ids.map(id => document.getElementById(id)).filter(Boolean);

  function moveUnderline(a){
    if(!a) return;
    const ar = a.getBoundingClientRect();
    const mr = menu.getBoundingClientRect();
    const x = (ar.left - mr.left) + 8 + (menu.scrollLeft||0);
    underline.style.width = `${Math.max(24, ar.width - 16)}px`;
    underline.style.transform = `translateX(${x}px)`;
  }
  function setActive(hash){
    const links = menu.querySelectorAll('a');
    links.forEach(l => l.classList.toggle('is-active', l.getAttribute('href') === hash));
    moveUnderline(menu.querySelector('a.is-active') || links[0]);
  }
  setActive('#about');

  menu.addEventListener('mouseover', e=>{ const a=e.target.closest('a'); if(a) moveUnderline(a); });
  menu.addEventListener('focusin',  e=>{ const a=e.target.closest('a'); if(a) moveUnderline(a); });
  menu.addEventListener('mouseleave', ()=> moveUnderline(menu.querySelector('a.is-active') || menu.querySelector('a')));
  window.addEventListener('resize', ()=> moveUnderline(menu.querySelector('a.is-active') || menu.querySelector('a')));

  // Инертность: переключаемся только при ≥60% видимости
  let current = '#about';
  if('IntersectionObserver' in window){
    const io = new IntersectionObserver((entries)=>{
      let best = null, bestRatio = 0;
      entries.forEach(e=>{ if(e.isIntersecting && e.intersectionRatio > bestRatio){ bestRatio=e.intersectionRatio; best=e; } });
      if(!best) return;
      const next = `#${best.target.id}`;
      if(bestRatio >= 0.60 && next !== current){ current = next; setActive(current); }
    },{
      rootMargin: '-20% 0px -20% 0px',
      threshold: [0.25, 0.5, 0.6, 0.75, 0.9]
    });
    secs.forEach(s=>io.observe(s));
  }

  // клик — сразу подсветить
  menu.querySelectorAll('a').forEach(a=>{
    a.addEventListener('click', ()=> setTimeout(()=> moveUnderline(a), 0));
  });
})();

/* ===== Mobile overlay menu ===== */
(() => {
  const btn     = document.getElementById('hamby');
  const overlay = document.getElementById('omenu');
  const backdrop= document.getElementById('omenuBackdrop');

  if(!btn || !overlay) return;

  let lastFocus = null;

  function lockScroll(lock){
    document.documentElement.style.overflow = lock ? 'hidden' : '';
    document.body.style.overflow = lock ? 'hidden' : '';
  }
  function openMenu(){
    lastFocus = document.activeElement;
    overlay.classList.add('is-open');
    btn.classList.add('is-open');
    btn.setAttribute('aria-expanded','true');
    overlay.setAttribute('aria-hidden','false');
    lockScroll(true);
    (overlay.querySelector('.omenu__list a') || btn).focus();
  }
  function closeMenu(){
    overlay.classList.remove('is-open');
    btn.classList.remove('is-open');
    btn.setAttribute('aria-expanded','false');
    overlay.setAttribute('aria-hidden','true');
    lockScroll(false);
    lastFocus && lastFocus.focus();
  }

  btn.addEventListener('click', (e)=> {
    e.preventDefault();
    overlay.classList.contains('is-open') ? closeMenu() : openMenu();
  });
  backdrop?.addEventListener('click', closeMenu);
  overlay.querySelectorAll('.omenu__list a').forEach(a => a.addEventListener('click', closeMenu));
  window.addEventListener('keydown', (e)=>{ if(e.key === 'Escape' && overlay.classList.contains('is-open')) closeMenu(); });

  // focus trap
  overlay.addEventListener('keydown', (e) => {
    if(e.key !== 'Tab') return;
    const focusables = overlay.querySelectorAll('a, button, [tabindex]:not([tabindex="-1"])');
    if(!focusables.length) return;
    const first = focusables[0], last = focusables[focusables.length - 1];
    if(e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
    else if(!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
  });
})();

/* ===== Horizontal rails: arrows, drag, keyboard ===== */
function railMove(id, dir){
  const el = document.getElementById(id);
  if(!el) return;
  const first = el.querySelector('.event-card, .ach-card, .card, img');
  const step  = first ? first.getBoundingClientRect().width + 16 : 320;
  el.scrollBy({ left: dir*step, behavior: 'smooth' });
}
window.railMove = railMove;

['ach','serf','certs'].forEach(id=>{
  const el = document.getElementById(id);
  if(!el) return;
  let down=false, sx=0, sl=0, moved=false;
  el.addEventListener('pointerdown', e=>{ down=true; moved=false; sx=e.pageX; sl=el.scrollLeft; el.setPointerCapture(e.pointerId); el.style.scrollSnapType='none'; });
  el.addEventListener('pointermove', e=>{ if(!down) return; el.scrollLeft = sl - (e.pageX - sx); moved = true; });
  const up=()=>{ down=false; el.style.scrollSnapType='x mandatory'; };
  el.addEventListener('pointerup', up);
  el.addEventListener('pointercancel', up);
  el.tabIndex = 0;
  el.addEventListener('keydown', e=>{ if(e.key==='ArrowRight') railMove(id,1); if(e.key==='ArrowLeft') railMove(id,-1); });

  // Tap-safe: не открываем изображение, если был drag
  el.addEventListener('click', (e)=>{ if(moved){ e.preventDefault(); e.stopPropagation(); } }, true);
});

/* ===== Надёжный лайтбокс (dialog + fallback) ===== */
function openLightbox(src, alt=''){
  const dlg = document.getElementById('lightbox');
  const img = document.getElementById('lightbox-img');

  // если нет <dialog> — fallback
  if(!window.HTMLDialogElement || !dlg || !img){
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;z-index:1500;background:rgba(0,0,0,.65);display:grid;place-items:center;padding:16px;';
    const wrap = document.createElement('div');
    wrap.style.cssText = 'position:relative;max-width:1100px;width:92vw;max-height:92vh;';
    const close = document.createElement('button');
    close.textContent = '×';
    close.setAttribute('aria-label','Закрыть');
    close.style.cssText = 'position:absolute;top:6px;right:6px;width:40px;height:40px;border:0;border-radius:12px;background:#fff;box-shadow:0 8px 30px rgba(31,41,55,.18);font-size:24px;cursor:pointer;';
    const pic = document.createElement('img');
    pic.alt = alt || '';
    pic.src = src;
    pic.style.cssText = 'display:block;width:100%;height:auto;object-fit:contain;border-radius:12px;background:#fff';
    wrap.appendChild(pic); wrap.appendChild(close); overlay.appendChild(wrap);
    document.body.appendChild(overlay);
    const bye = ()=> overlay.remove();
    overlay.addEventListener('click', e=>{ if(e.target===overlay) bye(); });
    close.addEventListener('click', bye);
    window.addEventListener('keydown', (e)=>{ if(e.key==='Escape'){ bye(); } }, {once:true});
    return;
  }

  img.src = src; img.alt = alt || '';
  try{ dlg.showModal(); }catch{ /* на всякий: если что-то не так — используем fallback */ return openLightbox(src, alt, true); }
}
window.openLightbox = openLightbox;

// поведение dialog
(() => {
  const dlg = document.getElementById('lightbox');
  const btn = document.getElementById('lightbox-close');
  if(!dlg) return;

  dlg.addEventListener('click', (e)=>{ if(e.target===dlg) dlg.close(); });
  dlg.addEventListener('cancel', ()=> dlg.close());
  btn?.addEventListener('click', ()=> dlg.close());
})();

/* ===== Делегированный клик по .img-zoomable (везде), с preventDefault ===== */
document.addEventListener('click', (e)=>{
  const img = e.target.closest('img.img-zoomable');
  if(!img) return;
  // если картинка внутри <a href=...> — останавливаем переход
  const a = img.closest('a[href]');
  if(a){ e.preventDefault(); e.stopPropagation(); }
  openLightbox(img.currentSrc || img.src, img.alt || '');
});

/* ===== Reveal-анимации ===== */
(() => {
  const toReveal = [
    '.hero-v10__left', '.hero-v10__portrait',
    '#about .about-lead', '#about .hcard',
    '#methods .method',
    '#achievements .ach-card', '#events .event-card',
    '#sertif .event-card',
    '#contacts .contact-col'
  ];
  const nodes = document.querySelectorAll(toReveal.join(','));
  nodes.forEach((el,i) => {
    el.classList.add('reveal');
    el.setAttribute('data-reveal-delay', (i%4)*100);
  });

  if('IntersectionObserver' in window){
    const io = new IntersectionObserver((ents)=>{
      ents.forEach(e=>{
        if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, {rootMargin:'-10% 0px -10% 0px', threshold:0.15});
    nodes.forEach(n=>io.observe(n));
  }else{
    nodes.forEach(n=>n.classList.add('in'));
  }
})();

/* ===== Кнопка «наверх» ===== */
(() => {
  const btn = document.createElement('button');
  btn.className = 'to-top';
  btn.setAttribute('aria-label', 'Вверх');
  btn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 5l7 7-1.4 1.4L13 9.8V19h-2V9.8L6.4 13.4 5 12l7-7z"/></svg>';
  document.body.appendChild(btn);

  const onScroll = () => {
    if(window.scrollY > 600) btn.classList.add('is-show'); else btn.classList.remove('is-show');
  };
  window.addEventListener('scroll', onScroll, {passive:true});
  onScroll();

  btn.addEventListener('click', () => {
    const top = document.getElementById('top') || document.body;
    top.scrollIntoView({behavior:'smooth', block:'start'});
  });
})();
/* === PATCHES === */

/* 1) Портрет в hero — точно без зума (убираем класс, если он есть в HTML) */
document.addEventListener('DOMContentLoaded', () => {
  const heroImg = document.querySelector('.hero-v10__portrait img');
  heroImg?.classList.remove('img-zoomable');
});

/* 2) Принудительно держим navbar «прибитым» */
document.addEventListener('DOMContentLoaded', () => {
  const nav = document.querySelector('.nav');
  if(nav){
    nav.classList.add('nav--pinned');
    nav.classList.remove('nav--hidden');
  }
});
