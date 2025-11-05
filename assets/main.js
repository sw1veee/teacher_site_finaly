/* ===== Footer year ===== */
document.addEventListener('DOMContentLoaded', () => {
  const y = document.getElementById('y');
  if (y) y.textContent = new Date().getFullYear();
});

/* ===== Encode RU/space media paths ===== */
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

/* ===== NAV underline + active ===== */
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

  let current = '#about';
  if('IntersectionObserver' in window){
    const io = new IntersectionObserver((entries)=>{
      let best = null, bestRatio = 0;
      entries.forEach(e=>{ if(e.isIntersecting && e.intersectionRatio > bestRatio){ bestRatio=e.intersectionRatio; best=e; } });
      if(!best) return;
      const next = `#${best.target.id}`;
      if(bestRatio >= 0.60 && next !== current){ current = next; setActive(current); }
    },{ rootMargin: '-20% 0px -20% 0px', threshold: [0.25, 0.5, 0.6, 0.75, 0.9] });
    secs.forEach(s=>io.observe(s));
  }

  menu.querySelectorAll('a').forEach(a=>{
    a.addEventListener('click', ()=> setTimeout(()=> moveUnderline(a), 0));
  });
})();

/* ===== Mobile menu ===== */
(() => {
  const btn     = document.getElementById('hamby');
  const overlay = document.getElementById('omenu');
  const backdrop= document.getElementById('omenuBackdrop');
  if(!btn || !overlay) return;

  let lastFocus = null;
  const lockScroll = (lock)=>{ document.documentElement.style.overflow = lock ? 'hidden' : ''; document.body.style.overflow = lock ? 'hidden' : ''; };
  const openMenu = ()=>{ lastFocus = document.activeElement; overlay.classList.add('is-open'); btn.classList.add('is-open'); btn.setAttribute('aria-expanded','true'); overlay.setAttribute('aria-hidden','false'); lockScroll(true); (overlay.querySelector('.omenu__list a') || btn).focus(); };
  const closeMenu= ()=>{ overlay.classList.remove('is-open'); btn.classList.remove('is-open'); btn.setAttribute('aria-expanded','false'); overlay.setAttribute('aria-hidden','true'); lockScroll(false); lastFocus && lastFocus.focus(); };

  btn.addEventListener('click', e=>{ e.preventDefault(); overlay.classList.contains('is-open') ? closeMenu() : openMenu(); });
  backdrop?.addEventListener('click', closeMenu);
  overlay.querySelectorAll('.omenu__list a').forEach(a => a.addEventListener('click', closeMenu));
  window.addEventListener('keydown', (e)=>{ if(e.key === 'Escape' && overlay.classList.contains('is-open')) closeMenu(); });

  overlay.addEventListener('keydown', (e) => {
    if(e.key !== 'Tab') return;
    const focusables = overlay.querySelectorAll('a, button, [tabindex]:not([tabindex="-1"])');
    if(!focusables.length) return;
    const first = focusables[0], last = focusables[focusables.length - 1];
    if(e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
    else if(!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
  });
})();

/* ===== Rails (scroll, drag, keys, arrows) ===== */
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
  el.addEventListener('pointermove', e=>{ if(!down) return; const dx = e.pageX - sx; el.scrollLeft = sl - dx; if(Math.abs(dx) > 4) moved = true; });
  const up=()=>{ down=false; el.style.scrollSnapType='x mandatory'; el.__wasDragged = moved; setTimeout(()=>{ el.__wasDragged = false; }, 80); };
  el.addEventListener('pointerup', up);
  el.addEventListener('pointercancel', up);
  el.tabIndex = 0;
  el.addEventListener('keydown', e=>{ if(e.key==='ArrowRight') railMove(id,1); if(e.key==='ArrowLeft') railMove(id,-1); });
  // Не открываем изображение, если был drag
  el.addEventListener('click', (e)=>{ if(moved){ e.preventDefault(); e.stopPropagation(); } }, true);
});

/* ===== LIGHTBOX (собственный, центр, адаптив, без прокрутки фона) ===== */
(function(){
  const dlg = document.getElementById('lightbox');
  const img = document.getElementById('lightbox-img');
  const closeBtn = document.getElementById('lightbox-close');

  const lockScroll = (lock)=>{ document.documentElement.style.overflow = lock ? 'hidden' : ''; document.body.style.overflow = lock ? 'hidden' : ''; };

  function openLightbox(src, alt=''){
    if(dlg && typeof dlg.showModal === 'function'){
      img.src = src; img.alt = alt || '';
      try{ dlg.showModal(); }catch(_){} // на случай Safari старых
      lockScroll(true);
      return;
    }
    // абсолютный fallback (без <dialog>)
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;z-index:1500;background:rgba(0,0,0,.65);display:grid;place-items:center;padding:16px;';
    const wrap = document.createElement('div');
    wrap.style.cssText = 'position:relative;max-width:96vw;max-height:92vh;';
    const btn = document.createElement('button');
    btn.textContent = '×'; btn.setAttribute('aria-label','Закрыть');
    btn.style.cssText = 'position:absolute;top:6px;right:6px;width:40px;height:40px;border:0;border-radius:12px;background:#fff;box-shadow:0 8px 30px rgba(31,41,55,.18);font-size:24px;cursor:pointer;z-index:1;';
    const pic = document.createElement('img');
    pic.alt = alt || ''; pic.src = src;
    pic.style.cssText = 'display:block;width:auto;height:auto;max-width:96vw;max-height:92vh;object-fit:contain;border-radius:12px;background:#fff';
    wrap.appendChild(pic); wrap.appendChild(btn); overlay.appendChild(wrap);
    document.body.appendChild(overlay);
    const bye = ()=> overlay.remove();
    overlay.addEventListener('click', e=>{ if(e.target===overlay) bye(); });
    btn.addEventListener('click', bye);
    window.addEventListener('keydown', (e)=>{ if(e.key==='Escape') bye(); }, {once:true});
  }
  window.openLightbox = openLightbox;

  if(dlg){
    dlg.addEventListener('click', (e)=>{ if(e.target===dlg){ dlg.close(); lockScroll(false); }});
    dlg.addEventListener('cancel', ()=>{ dlg.close(); lockScroll(false); });
    closeBtn?.addEventListener('click', ()=>{ dlg.close(); lockScroll(false); });
  }

  // Делегированный клик по изображениям
  (function bindZoom(){
    // отменяем переход по <a> вокруг картинки
    document.addEventListener('click', (e)=>{
      const a = e.target.closest && e.target.closest('a[href]');
      if(!a) return;
      const img = a.querySelector && a.querySelector('img.img-zoomable');
      if(img){ e.preventDefault(); }
    }, {capture:true});

    const TOL = 6; let downPos = null;
    window.addEventListener('pointerdown', e=>{
      const img = e.target.closest && e.target.closest('img.img-zoomable');
      downPos = img ? {x:e.clientX,y:e.clientY} : null;
    }, {capture:true, passive:true});

    document.addEventListener('click', (e)=>{
      const targetImg = e.target.closest && e.target.closest('img.img-zoomable');
      if(!targetImg) return;

      // не зумим портрет с data-nozoom
      if(targetImg.hasAttribute('data-nozoom')) return;

      // если картинка в треке и был drag — не открываем
      const track = targetImg.closest('.track');
      if(track && track.__wasDragged) return;

      // толеранс от случайного сдвига
      if(downPos){
        const dx = Math.abs(e.clientX - downPos.x);
        const dy = Math.abs(e.clientY - downPos.y);
        if(dx > TOL || dy > TOL) return;
      }

      e.preventDefault();
      e.stopPropagation();
      const src = targetImg.currentSrc || targetImg.src;
      const alt = targetImg.alt || '';
      openLightbox(src, alt);
    }, {capture:true, passive:false});
  })();
})();

/* ===== Reveal ===== */
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

/* ===== To top ===== */
(() => {
  const btn = document.createElement('button');
  btn.className = 'to-top';
  btn.setAttribute('aria-label', 'Вверх');
  btn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 5l7 7-1.4 1.4L13 9.8V19h-2V9.8L6.4 13.4 5 12l7-7z"/></svg>';
  document.body.appendChild(btn);

  const onScroll = () => { if(window.scrollY > 600) btn.classList.add('is-show'); else btn.classList.remove('is-show'); };
  window.addEventListener('scroll', onScroll, {passive:true}); onScroll();

  btn.addEventListener('click', () => {
    const top = document.getElementById('top') || document.body;
    top.scrollIntoView({behavior:'smooth', block:'start'});
  });
})();

(function(){
  // --- 0) если уже ставили — не дублируем
  if (window.__LB_READY__) return; 
  window.__LB_READY__ = true;

  // --- 1) создаём один-единственный overlay
  var overlay = document.createElement('div');
  overlay.id = 'lbOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,.65);padding:16px;';
  var box = document.createElement('div');
  box.style.cssText = 'position:relative;max-width:96vw;max-height:92vh;';
  var btn = document.createElement('button');
  btn.type='button';
  btn.setAttribute('aria-label','Закрыть');
  btn.textContent = '×';
  btn.style.cssText = 'position:absolute;top:6px;right:6px;width:40px;height:40px;border:0;border-radius:12px;background:#fff;box-shadow:0 8px 30px rgba(31,41,55,.18);font-size:24px;cursor:pointer;z-index:1;';
  var pic = document.createElement('img');
  pic.alt=''; pic.src='';
  pic.style.cssText = 'display:block;width:auto;height:auto;max-width:96vw;max-height:92vh;object-fit:contain;border-radius:12px;background:#fff';
  box.appendChild(pic); box.appendChild(btn); overlay.appendChild(box);
  document.body.appendChild(overlay);

  function lockScroll(on){ document.documentElement.style.overflow = on?'hidden':''; document.body.style.overflow = on?'hidden':''; }

  var isOpen = false;
  function openLB(src, alt){
    if (isOpen) { // уже открыто — не дублируем
      pic.src = src; pic.alt = alt||''; return;
    }
    isOpen = true;
    pic.src = src; pic.alt = alt||'';
    overlay.style.display='flex';
    lockScroll(true);
  }
  function closeLB(){
    if(!isOpen) return;
    isOpen = false;
    overlay.style.display='none';
    pic.src=''; // разгружаем
    lockScroll(false);
  }

  overlay.addEventListener('click', function(e){ if(e.target===overlay) closeLB(); }, {capture:true});
  btn.addEventListener('click', closeLB, {capture:true});
  window.addEventListener('keydown', function(e){ if(e.key==='Escape' && isOpen) closeLB(); });

  // --- 2) Переопределяем глобальную функцию (если старая уже есть)
  // Любые "старые" вызовы openLightbox теперь придут сюда и второго окна не будет.
  window.openLightbox = function(src, alt){ openLB(src, alt); };

  // --- 3) Делегированный клик по img.img-zoomable (в т.ч. внутри <a>)
  // Защита от "drag" в горизонтальных каруселях на десктопе
  var downInfo = null, moved = false;
  window.addEventListener('pointerdown', function(e){
    var img = e.target.closest && e.target.closest('img.img-zoomable');
    if (!img) { downInfo = null; return; }
    downInfo = { x:e.clientX, y:e.clientY, inTrack: !!e.target.closest('.track') };
    moved = false;
  }, {capture:true, passive:true});

  window.addEventListener('pointermove', function(e){
    if (!downInfo) return;
    var dx = Math.abs(e.clientX - downInfo.x), dy = Math.abs(e.clientY - downInfo.y);
    if (dx>8 || dy>8) moved = true; // порог для десктопа
  }, {capture:true, passive:true});

  document.addEventListener('click', function(e){
    var img = e.target.closest && e.target.closest('img.img-zoomable');
    if(!img) return;

    // портрет, помеченный как "не зумить"
    if(img.hasAttribute('data-nozoom')) return;

    // если тянули карусель — не открываем
    if (moved) { moved=false; return; }

    // если картинка внутри <a> — блокируем переход
    var a = img.closest('a[href]');
    if (a) e.preventDefault();

    // Гасим дальнейшие обработчики, чтобы старый код не открыл второе окно
    if (e.stopImmediatePropagation) e.stopImmediatePropagation();
    e.stopPropagation();
    e.preventDefault();

    // открываем единый лайтбокс
    var src = img.currentSrc || img.src;
    openLB(src, img.alt || '');
  }, {capture:true, passive:false});

  // --- 4) Если где-то в разметке остался <dialog id="lightbox"> — отключим его
  (function neuterDialog(){
    var dlg = document.getElementById('lightbox');
    if(!dlg) return;
    try { dlg.remove(); } catch(_) { dlg.style.display='none'; }
  })();

  // --- 5) На всякий: отключим перехват кликов оверлеем подписи у карточек
  var style = document.createElement('style');
  style.textContent = '.event-overlay{pointer-events:none!important}';
  document.head.appendChild(style);
})();

/* =========================================================
   PATCH: разрешаем клики по img.img-zoomable в каруселях
   ========================================================= */
(function(){
  // 1) Подписи не ловят клики
  const style = document.createElement('style');
  style.textContent = '.event-overlay{pointer-events:none!important}';
  document.head.appendChild(style);

  // 2) Убираем перехват pointerdown/pointermove у .track
  function inoculate(img){
    if (img.__noTapGuard) return;
    img.__noTapGuard = true;
    const stop = e => { e.stopPropagation(); };
    img.addEventListener('pointerdown', stop, {capture:true, passive:true});
    img.addEventListener('pointermove', stop, {capture:true, passive:true});
  }

  // Применяем ко всем существующим
  document.querySelectorAll('.track img.img-zoomable').forEach(inoculate);

  // Следим за новыми
  const mo = new MutationObserver(muts=>{
    muts.forEach(m=>{
      m.addedNodes && m.addedNodes.forEach(n=>{
        if (n.nodeType !== 1) return;
        if (n.matches?.('.track img.img-zoomable')) inoculate(n);
        n.querySelectorAll?.('.track img.img-zoomable').forEach(inoculate);
      });
    });
  });
  mo.observe(document.body, {subtree:true, childList:true});
})();

