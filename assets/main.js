// ===== Текущий год в подвале =====
(function () {
  const y = document.getElementById('y');
  if (y) y.textContent = new Date().getFullYear();
})();

// ===== Кодирование путей с пробелами / кириллицей =====
(function () {
  const needEncode = s => /\s|[А-Яа-я]/.test(s);

  document.querySelectorAll('img[src]').forEach(img => {
    const s = img.getAttribute('src');
    if (s && needEncode(s)) img.src = encodeURI(s);
  });

  document.querySelectorAll('a[href]').forEach(a => {
    const h = a.getAttribute('href');
    if (h && /\.(png|jpe?g|gif|webp)$/i.test(h) && needEncode(h)) {
      a.href = encodeURI(h);
    }
  });
})();

// ===== Навигация: подчёркивание и активный пункт =====
(function () {
  const menu = document.getElementById('navmenu');
  const underline = document.querySelector('.menu-underline');
  if (!menu || !underline) return;

  const ids = [
    'about',
    'methods',
    'achievements',
    'events',
    'sertif',
    'project',
    'video',
    'essay',
    'contacts'
  ];

  const secs = ids
    .map(id => document.getElementById(id))
    .filter(Boolean);

  function moveUnderline(a) {
    if (!a) return;
    const ar = a.getBoundingClientRect();
    const mr = menu.getBoundingClientRect();
    const x = (ar.left - mr.left) + (menu.scrollLeft || 0);

    underline.style.width = `${ar.width}px`;
    underline.style.transform = `translateX(${x}px)`;
  }

  function setActive(hash) {
    const links = menu.querySelectorAll('a');
    let active = null;

    links.forEach(l => {
      const match = l.getAttribute('href') === hash;
      l.classList.toggle('is-active', match);
      if (match) active = l;
    });

    moveUnderline(active || links[0]);
  }

  // стартовое состояние
  setActive('#about');

  menu.addEventListener('mouseover', e => {
    const a = e.target.closest('a');
    if (a) moveUnderline(a);
  });

  menu.addEventListener('focusin', e => {
    const a = e.target.closest('a');
    if (a) moveUnderline(a);
  });

  menu.addEventListener('mouseleave', () => {
    const current = menu.querySelector('a.is-active') || menu.querySelector('a');
    moveUnderline(current);
  });

  window.addEventListener('resize', () => {
    const current = menu.querySelector('a.is-active') || menu.querySelector('a');
    moveUnderline(current);
  });

  // подсветка по скроллу
  if ('IntersectionObserver' in window && secs.length) {
    let currentHash = '#about';

    const io = new IntersectionObserver(entries => {
      let best = null;
      let bestRatio = 0;

      entries.forEach(e => {
        if (e.isIntersecting && e.intersectionRatio > bestRatio) {
          bestRatio = e.intersectionRatio;
          best = e.target;
        }
      });

      if (!best) return;
      const nextHash = `#${best.id}`;

      if (bestRatio >= 0.6 && nextHash !== currentHash) {
        currentHash = nextHash;
        setActive(currentHash);
      }
    }, {
      rootMargin: '-20% 0px -20% 0px',
      threshold: [0.25, 0.5, 0.6, 0.75, 0.9]
    });

    secs.forEach(sec => io.observe(sec));
  }

  menu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      setTimeout(() => moveUnderline(a), 0);
    });
  });
})();

// ===== Мобильное меню =====
(function () {
  const btn      = document.getElementById('hamby');
  const overlay  = document.getElementById('omenu');
  const backdrop = document.getElementById('omenuBackdrop');
  if (!btn || !overlay) return;

  let lastFocus = null;

  function lockScroll(lock) {
    document.documentElement.style.overflow = lock ? 'hidden' : '';
    document.body.style.overflow = lock ? 'hidden' : '';
  }

  function openMenu() {
    lastFocus = document.activeElement;
    overlay.classList.add('is-open');
    btn.classList.add('is-open');
    btn.setAttribute('aria-expanded', 'true');
    overlay.setAttribute('aria-hidden', 'false');
    lockScroll(true);

    const firstLink = overlay.querySelector('.omenu__list a');
    if (firstLink) firstLink.focus();
  }

  function closeMenu() {
    overlay.classList.remove('is-open');
    btn.classList.remove('is-open');
    btn.setAttribute('aria-expanded', 'false');
    overlay.setAttribute('aria-hidden', 'true');
    lockScroll(false);
    if (lastFocus) lastFocus.focus();
  }

  btn.addEventListener('click', e => {
    e.preventDefault();
    if (overlay.classList.contains('is-open')) closeMenu();
    else openMenu();
  });

  if (backdrop) {
    backdrop.addEventListener('click', closeMenu);
  }

  overlay.querySelectorAll('.omenu__list a').forEach(a => {
    a.addEventListener('click', closeMenu);
  });

  window.addEventListener('keydown', e => {
    if (e.key === 'Escape' && overlay.classList.contains('is-open')) {
      closeMenu();
    }
  });

  // trap focus
  overlay.addEventListener('keydown', e => {
    if (e.key !== 'Tab') return;

    const focusables = overlay.querySelectorAll(
      'a, button, [tabindex]:not([tabindex="-1"])'
    );
    if (!focusables.length) return;

    const first = focusables[0];
    const last  = focusables[focusables.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });
})();

// ===== Горизонтальные ленты (стрелки) =====
function railMove(id, dir) {
  const el = document.getElementById(id);
  if (!el) return;
  const step = el.offsetWidth * 0.9 || 320;
  el.scrollBy({ left: dir * step, behavior: 'smooth' });
}
window.railMove = railMove;

// ===== Лайтбокс для изображений =====
(function () {
  const dlg      = document.getElementById('lightbox');
  const img      = document.getElementById('lightbox-img');
  const closeBtn = document.getElementById('lightbox-close');

  if (!dlg || !img) return;

  function lockScroll(lock) {
    document.documentElement.style.overflow = lock ? 'hidden' : '';
    document.body.style.overflow = lock ? 'hidden' : '';
  }

  function openLightbox(src, alt) {
    img.src = src;
    img.alt = alt || '';

    if (typeof dlg.showModal === 'function') {
      try {
        dlg.showModal();
      } catch (e) {
        dlg.setAttribute('open', 'open');
      }
    } else {
      dlg.setAttribute('open', 'open');
    }

    lockScroll(true);
  }

  function closeLightbox() {
    if (dlg.hasAttribute('open')) {
      if (typeof dlg.close === 'function') dlg.close();
      else dlg.removeAttribute('open');
    }
    img.src = '';
    lockScroll(false);
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', closeLightbox);
  }

  dlg.addEventListener('click', e => {
    if (e.target === dlg) closeLightbox();
  });

  dlg.addEventListener('cancel', e => {
    e.preventDefault();
    closeLightbox();
  });

  // делегирование на все .img-zoomable
  document.addEventListener('click', e => {
    const target = e.target.closest && e.target.closest('img.img-zoomable');
    if (!target) return;
    if (target.hasAttribute('data-nozoom')) return;

    e.preventDefault();

    const src = target.currentSrc || target.src;
    const alt = target.alt || '';
    openLightbox(src, alt);
  });
})();

// ===== Плавное появление блоков (reveal) =====
(function () {
  const selectors = [
    '.hero-v10__left',
    '.hero-v10__portrait',
    '#about .about-lead',
    '#about .hcard',
    '#methods .method',
    '#achievements .ach-card',
    '#events .event-card',
    '#sertif .event-card',
    '#project .project-card',
    '#contacts .contact-col'
  ];

  const nodes = document.querySelectorAll(selectors.join(','));
  if (!nodes.length) return;

  nodes.forEach((el, i) => {
    el.classList.add('reveal');
    el.setAttribute('data-reveal-delay', (i % 4) * 100);
  });

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, {
      rootMargin: '-10% 0px -10% 0px',
      threshold: 0.15
    });

    nodes.forEach(n => io.observe(n));
  } else {
    nodes.forEach(n => n.classList.add('in'));
  }
})();

// ===== Кнопка "Вверх" =====
(function () {
  const btn = document.createElement('button');
  btn.className = 'to-top';
  btn.setAttribute('aria-label', 'Вверх');
  btn.innerHTML =
    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
    '<path d="M12 5l7 7-1.4 1.4L13 9.8V19h-2V9.8L6.4 13.4 5 12l7-7z"/>' +
    '</svg>';

  document.body.appendChild(btn);

  function onScroll() {
    if (window.scrollY > 600) btn.classList.add('is-show');
    else btn.classList.remove('is-show');
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  btn.addEventListener('click', () => {
    const top = document.getElementById('top') || document.body;
    top.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
})();

// ===== Видео-герой с VK (наш постер + iframe) =====
(function () {
  const shell = document.querySelector('.video-shell');
  if (!shell) return;

  // обёртка с нашим постером и кнопкой
  const overlay = shell.querySelector('[data-video-overlay]');
  // iframe с VK-плеером: <iframe class="video-shell__player" data-src="..."></iframe>
  const frame   = shell.querySelector('.video-shell__player');

  if (!overlay || !frame) return;

  overlay.addEventListener('click', () => {
    if (!frame.src) {
      const url = frame.dataset.src;
      if (url) frame.src = url;
    }
    overlay.classList.add('video-shell__poster--hidden');
  });
})();

// ===== Эссе: "Читать полностью" =====
(function () {
  const card = document.querySelector('.essay-card');
  if (!card) return;

  const body = card.querySelector('.essay-body');
  const btn  = card.querySelector('.essay-toggle');
  if (!body || !btn) return;

  // старт: свёрнуто
  body.classList.remove('is-expanded');
  if (!body.classList.contains('is-collapsed')) {
    body.classList.add('is-collapsed');
  }

  btn.addEventListener('click', () => {
    const expanded = body.classList.toggle('is-expanded');
    body.classList.toggle('is-collapsed', !expanded);
    btn.textContent = expanded ? 'Свернуть текст' : 'Читать полностью';

    if (expanded) {
      card.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
})();
